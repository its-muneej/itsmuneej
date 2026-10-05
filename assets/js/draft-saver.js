// One current bill, one write in flight, and only the latest pending edit.
export function createDraftSaver({read,write,canSave=()=>true,onError=()=>{},onChange=()=>{},delay=700,setTimer=setTimeout,clearTimer=clearTimeout}){
 let timer=null,running=null,wanted=false,forced=false,savedKey=null,scope=0;
 const key=value=>JSON.stringify(value);
 const cancelTimer=()=>{if(timer!==null)clearTimer(timer);timer=null;};
 function arm(){
  cancelTimer();timer=setTimer(()=>{
   timer=null;
   if(!canSave()){arm();return;}
   flush(false).catch(onError);
  },delay);
 }
 function schedule(){wanted=true;if(!running)arm();onChange();}
 function flush(immediate=true){
  cancelTimer();wanted=true;if(immediate)forced=true;
  if(running)return running;
  const currentScope=scope;let failed=false;
  running=Promise.resolve().then(async()=>{
   while(wanted&&currentScope===scope){
    if(!forced&&!canSave())break;
    wanted=false;
    const value=structuredClone(read()),nextKey=key(value);
    if(nextKey===savedKey)continue;
    await write(value);
    if(currentScope===scope)savedKey=nextKey;
   }
  }).catch(error=>{failed=true;throw error;}).finally(()=>{
   running=null;forced=false;cancelTimer();
   if(wanted&&!failed&&currentScope===scope)arm();
   onChange();
  });
  onChange();return running;
 }
 function reset(savedValue){scope++;wanted=false;forced=false;cancelTimer();savedKey=key(savedValue);onChange();}
 async function discard(){scope++;wanted=false;forced=false;cancelTimer();savedKey=null;await running?.catch(()=>{});onChange();}
 return {schedule,flush,reset,discard,get saving(){return timer!==null||running!==null;},get dirty(){return key(read())!==savedKey;}};
}
