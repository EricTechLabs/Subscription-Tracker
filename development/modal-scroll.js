// Preserve the page position while any native modal (including a nested picker) is open.
let saved=null;
const bound=new WeakSet();
function restoreIfClosed(){
 if(!saved||document.querySelector('dialog[open]'))return;
 const previous=saved;saved=null;
 for(const [key,value] of Object.entries(previous.body))document.body.style[key]=value;
 document.documentElement.style.overflow=previous.rootOverflow;
 window.scrollTo({left:previous.x,top:previous.y,behavior:'instant'});
}
export function showLockedDialog(dialog){
 if(!bound.has(dialog)){dialog.addEventListener('close',restoreIfClosed);bound.add(dialog);}
 if(!saved){
  const body=document.body,root=document.documentElement;
  const keys=['position','top','left','width','overflow','paddingRight'];
  saved={x:window.scrollX,y:window.scrollY,body:Object.fromEntries(keys.map(key=>[key,body.style[key]])),rootOverflow:root.style.overflow};
  const scrollbar=Math.max(0,window.innerWidth-root.clientWidth);
  const padding=parseFloat(window.getComputedStyle(body).paddingRight)||0;
  root.style.overflow='hidden';body.style.position='fixed';body.style.top=`-${saved.y}px`;body.style.left=`-${saved.x}px`;body.style.width='100%';body.style.overflow='hidden';
  if(scrollbar)body.style.paddingRight=`${padding+scrollbar}px`;
 }
 try{if(!dialog.open){dialog.showModal();dialog.scrollTop=0;dialog.scrollLeft=0;}}catch(error){restoreIfClosed();throw error;}
}
