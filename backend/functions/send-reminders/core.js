// Calendar calculations use date-only UTC values; display and reminder times use Asia/Taipei.
export const DAY = 86400000;
export function parseDate(s) { if(!/^\d{4}-\d{2}-\d{2}$/.test(s||'')) throw Error('日期格式錯誤'); const d=new Date(s+'T00:00:00Z'); if(!Number.isFinite(+d)||iso(d)!==s)throw Error('日期不存在'); return d; }
export const iso=d=>d.toISOString().slice(0,10);
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function occurrence(item,n){const d=parseDate(item.start_date), step=Number(item.interval)*n;if(item.unit==='day'||item.unit==='week')return iso(new Date(+d+step*(item.unit==='week'?7:1)*DAY));const month=d.getUTCMonth()+step*(item.unit==='year'?12:1);const target=new Date(Date.UTC(d.getUTCFullYear(),month,1));target.setUTCDate(Math.min(d.getUTCDate(),new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate()));return iso(target);}
function estimate(item,date){const a=parseDate(item.start_date),b=parseDate(date);if(item.unit==='day'||item.unit==='week')return Math.max(0,Math.floor((b-a)/DAY/(item.interval*(item.unit==='week'?7:1)))-1);return Math.max(0,Math.floor(((b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth())/(item.interval*(item.unit==='year'?12:1)))-1);}
export function occurrences(item,from,to){if(from>to||item.start_date>to)return [];const end=item.end_date&&item.end_date<to?item.end_date:to;if(from>end)return [];const out=[];for(let n=estimate(item,from);;n++){const d=occurrence(item,n);if(d>end)break;if(d>=from)out.push(d);}return out;}
export function nextDate(item,date=today()){for(let n=estimate(item,date);;n++){const d=occurrence(item,n);if(item.end_date&&d>item.end_date)return null;if(d>=date)return d;}}
export const daysBetween=(a,b)=>Math.round((parseDate(b)-parseDate(a))/DAY);
export const sum=(items,from,to)=>items.reduce((v,s)=>v+occurrences(s,from,to).length*s.amount_cents,0);
export const money=c=>new Intl.NumberFormat('zh-TW',{style:'currency',currency:'TWD',maximumFractionDigits:c%100?2:0}).format(c/100);
export function validate(s){if(!s.name?.trim()||s.name.length>80)throw Error('名稱需為 1～80 字');if(!Number.isSafeInteger(s.amount_cents)||s.amount_cents<=0||s.amount_cents>999999999)throw Error('請輸入有效金額');parseDate(s.start_date);if(s.end_date){parseDate(s.end_date);if(s.end_date<s.start_date)throw Error('結束日期不得早於開始日期');}if(!['day','week','month','year'].includes(s.unit)||!Number.isInteger(s.interval)||s.interval<1||s.interval>999)throw Error('請確認扣款週期');if(s.url){const u=new URL(s.url);if(!['https:','http:'].includes(u.protocol))throw Error('網址需以 https:// 或 http:// 開頭');}for(const k of ['payment_reminder','end_reminder']){const r=s[k];if(r&&(!Number.isInteger(r.days)||r.days<0||r.days>365||!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)))throw Error('提醒需為提前 0～365 天及有效時間');}return s;}
export function dueReminders(item,now=new Date()){const from=iso(new Date(+now-DAY)),to=iso(new Date(+now+367*DAY));const result=[];for(const type of ['payment','end']){const r=item[type+'_reminder'];if(!r)continue;const dates=type==='payment'?occurrences(item,from,to):item.end_date?[item.end_date]:[];for(const date of dates){const reminderDay=iso(new Date(+parseDate(date)-r.days*DAY));const at=new Date(reminderDay+'T'+r.time+':00+08:00');if(+at<=+now&&+at>+now-DAY)result.push({type,date,at:at.toISOString()});}}return result;}
// Forecast includes the entire selected range; averages exclude time before recording began.
export function paymentReport(items,from,to,averageUnit='day'){
  const entries=items.flatMap(item=>occurrences(item,from,to).map(date=>({subscription_id:item.id,name:item.name,date,amount_cents:item.amount_cents}))).sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name,'zh-TW'));
  const total=entries.reduce((n,e)=>n+e.amount_cents,0);
  const firstStart=items.map(item=>item.start_date).sort()[0];
  const start=firstStart?(firstStart>from?firstStart:from):null;
  let denominator=0;
  if(start&&start<=to){if(averageUnit==='month'){const a=parseDate(start),b=parseDate(to);denominator=(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth()+1;}else denominator=daysBetween(start,to)+1;}
  return {entries,total,count:entries.length,start:denominator?start:null,end:to,denominator,average:denominator?Math.round(total/denominator):null};
}
