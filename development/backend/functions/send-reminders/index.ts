import { createClient } from 'npm:@supabase/supabase-js@2.102.0';
import webpush from 'npm:web-push@3.6.7';
import { dueReminders, money } from './core.js';

const env=(name:string)=>{const v=Deno.env.get(name);if(!v)throw new Error(`Missing ${name}`);return v;};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
function safeEndpoint(endpoint:string){try{const u=new URL(endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(['web.push.apple.com','fcm.googleapis.com','updates.push.services.mozilla.com'].includes(u.hostname)||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com'));}catch{return false;}}
async function sameSecret(a:string,b:string){const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const x=await digest(a),y=await digest(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
Deno.serve(async req=>{
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  if(!await sameSecret(req.headers.get('x-cron-secret')||'',env('ST_CRON_SECRET')))return reply({error:'Unauthorized'},401);
  const db=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
  const now=new Date();let sent=0,failed=0;
  try{
    // Personal-scale app: page through records, rather than silently truncating at the API row limit.
    const rows:any[]=[];for(let offset=0;;offset+=500){const {data,error}=await db.from('st_subscriptions').select('*').order('id').range(offset,offset+499);if(error)throw error;rows.push(...data);if(data.length<500)break;}
    for(const item of rows){const reminders=dueReminders(item,now);if(!reminders.length)continue;
      const {data:devices,error:deviceError}=await db.from('st_push_devices').select('*').eq('user_id',item.user_id);if(deviceError)throw deviceError;
      for(const reminder of reminders)for(const device of devices||[]){
        if(!safeEndpoint(device.endpoint)){failed++;continue;}
        const key={device_id:device.id,subscription_id:item.id,kind:reminder.type,occurrence_date:reminder.date};
        const {error:insertError}=await db.from('st_push_deliveries').insert({...key,reminder_at:reminder.at,attempted_at:now.toISOString()});
        if(insertError){if(insertError.code!=='23505')throw insertError;
          // Atomic retry lease avoids concurrent cron invocations sending the same reminder.
          const {data:claimed,error}=await db.from('st_push_deliveries').update({state:'sending',attempted_at:now.toISOString()}).match(key).neq('state','sent').lt('attempted_at',new Date(+now-120000).toISOString()).select('device_id');if(error)throw error;if(!claimed?.length)continue;
        }
        try{
          const title=reminder.type==='payment'?'付款提醒':'合約結束提醒';
          const body=reminder.type==='payment'?`${item.name} 將於 ${reminder.date} 付款 ${money(item.amount_cents)}`:`${item.name} 將於 ${reminder.date} 結束`;
          const payload=JSON.stringify({title,body,id:item.id,tag:`${item.id}:${reminder.type}:${reminder.date}`});
          const request=webpush.generateRequestDetails(device.subscription,payload,{TTL:86400,vapidDetails:{subject:env('ST_VAPID_SUBJECT'),publicKey:env('ST_VAPID_PUBLIC_KEY'),privateKey:env('ST_VAPID_PRIVATE_KEY')}});
          const res=await fetch(request.endpoint,{method:'POST',headers:request.headers,body:request.body,redirect:'error',signal:AbortSignal.timeout(15000)});
          if(res.status===404||res.status===410){await db.from('st_push_devices').delete().eq('id',device.id);continue;}
          if(!res.ok)throw Error(`Push status ${res.status}`);
          const {error}=await db.from('st_push_deliveries').update({state:'sent',sent_at:new Date().toISOString()}).match(key);if(error)throw error;sent++;
        }catch(error){console.error('Push failed',String(error));await db.from('st_push_deliveries').update({state:'failed'}).match(key);failed++;}
      }
    }
    // Retain only recent delivery history; a reminder is eligible for catch-up for 24 hours.
    const {error:cleanupError}=await db.from('st_push_deliveries').delete().lt('attempted_at',new Date(+now-30*86400000).toISOString());if(cleanupError)throw cleanupError;
    return reply({sent,failed});
  }catch(error){console.error('Reminder job failed',String(error));return reply({error:'Reminder job failed'},500);}
});
