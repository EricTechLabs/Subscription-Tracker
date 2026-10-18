// iOS fallback for non-interactive headings where CSS manipulation alone may not suppress smart zoom.
// Cancel only a second nearby, short, single-finger tap in the same heading region.
export function installHeadingTapGuard(root=document){
 const regions='.list-topbar,.menu-heading,.title-row';
 const interactive='button,a,input,select,textarea,label,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"]';
 let current=null,last=null;
 const reset=()=>{current=null;last=null;};
 const regionFor=target=>{const el=target?.closest?target:target?.parentElement;return el&&!el.closest(interactive)?el.closest(regions):null;};
 const start=event=>{
  current=null;
  if(event.touches.length!==1){last=null;return;}
  const zone=regionFor(event.target),touch=event.touches[0];
  if(!zone){last=null;return;}
  current={zone,id:touch.identifier,x:touch.clientX,y:touch.clientY,time:event.timeStamp};
 };
 const move=event=>{
  if(event.touches.length!==1){reset();return;}
  if(!current)return;
  const touch=event.touches[0];
  if(touch.identifier!==current.id||Math.hypot(touch.clientX-current.x,touch.clientY-current.y)>12)reset();
 };
 const end=event=>{
  const tap=current;current=null;
  if(!tap||event.touches.length!==0){last=null;return;}
  const touch=Array.from(event.changedTouches).find(t=>t.identifier===tap.id);
  if(!touch||regionFor(event.target)!==tap.zone||event.timeStamp-tap.time>350||Math.hypot(touch.clientX-tap.x,touch.clientY-tap.y)>12){last=null;return;}
  const interval=last?event.timeStamp-last.time:Infinity;
  if(last?.zone===tap.zone&&interval>=0&&interval<=350&&Math.hypot(touch.clientX-last.x,touch.clientY-last.y)<=24){
   if(event.cancelable)event.preventDefault();
   last=null;return;
  }
  last={zone:tap.zone,x:touch.clientX,y:touch.clientY,time:event.timeStamp};
 };
 const passive={capture:true,passive:true},active={capture:true,passive:false};
 root.addEventListener('touchstart',start,passive);
 root.addEventListener('touchmove',move,passive);
 root.addEventListener('touchend',end,active);
 root.addEventListener('touchcancel',reset,passive);
 return ()=>{root.removeEventListener('touchstart',start,true);root.removeEventListener('touchmove',move,true);root.removeEventListener('touchend',end,true);root.removeEventListener('touchcancel',reset,true);reset();};
}
