// GitHub is the durable store. sessionStorage holds only the tab's connection
// and one in-flight write journal so a lost HTTP response cannot duplicate it.
const API='https://api.github.com';
const scope=new URL('../../',import.meta.url).pathname;
const SESSION='storeflow-github:'+scope;
const JOURNAL=SESSION+':write';
const encoder=new TextEncoder(),decoder=new TextDecoder();
const clone=v=>structuredClone(v);
const encode=v=>{const bytes=encoder.encode(v);let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
const decode=s=>decoder.decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
export class Repository {
 constructor(fetcher=(...args)=>fetch(...args),storage=sessionStorage){this.fetcher=fetcher;this.storage=storage;this.config=null;this.cached=new Map();this.state='disconnected';this.lastSync=0;this.pending=false;this.cooldown=0;}
 notify(state){this.state=state;if(state==='saved')this.lastSync=Date.now();window.dispatchEvent(new CustomEvent('storeflow:connection'));}
 get connected(){return !!this.config;}
 get details(){if(!this.config)return null;const {owner,repo,branch}=this.config;return {owner,repo,branch};}
 get root(){return '/repos/'+encodeURIComponent(this.config.owner)+'/'+encodeURIComponent(this.config.repo);}
 async request(path,method='GET',payload){
  if(!this.config)throw new Error('Connect your GitHub repository to make this change.');
  if(Date.now()<this.cooldown)throw new Error('GitHub has paused requests. Try again after '+new Date(this.cooldown).toLocaleTimeString()+'.');
  let response;try{response=await this.fetcher(API+path,{method,credentials:'omit',cache:'no-store',redirect:'error',headers:{Accept:method==='GET'&&path.includes('/contents/')?'application/vnd.github.object+json':'application/vnd.github+json','Authorization':'Bearer '+this.config.token,'X-GitHub-Api-Version':'2026-03-10',...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(45000)});}catch{this.notify('offline');throw new Error('Cannot reach GitHub. The save is not confirmed. Reconnect and use Retry save.');}
  if(!response.ok){let detail='';try{detail=String((await response.json()).message||'');}catch{}const e=new Error('GitHub could not complete this request.');e.status=response.status;
   if(response.status===401)e.message='Your GitHub token has expired or is invalid. Reconnect with a valid token.';
   else if(response.status===404)e.message='Repository, branch or file not found. Check the repository name and token access.';
   else if(response.status===409)e.message='Another device changed this store. Refresh and retry your action.';
   else if(response.status===403||response.status===429){const retry=Number(response.headers.get('retry-after')),reset=Number(response.headers.get('x-ratelimit-reset'));if(response.status===429||retry||response.headers.get('x-ratelimit-remaining')==='0'||/rate limit|abuse detection/i.test(detail)){this.cooldown=retry?Date.now()+retry*1000:reset?reset*1000:Date.now()+60000;e.message='GitHub rate limit reached. Try again after '+new Date(this.cooldown).toLocaleTimeString()+'.';}else e.message='GitHub denied access. Give this token Contents: Read and write for this repository; check branch rules and organization approval.';}
   else if(response.status===422)e.message='GitHub rejected the save. Check branch rules, repository access and file size.';
   else if(response.status>=500)e.message='GitHub is temporarily unavailable. Retry the save after reconnecting.';
   throw e;
  }
  try{return await response.json();}catch{throw new Error('GitHub returned an unreadable response. Retry after reconnecting.');}
 }
 async connect(input){
  const owner=String(input.owner||'').trim(),repo=String(input.repo||'').trim(),branch=String(input.branch||'').trim(),token=String(input.token||'').trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(owner)||! /^[A-Za-z0-9_.-]{1,100}$/.test(repo)||repo==='.'||repo==='..')throw new Error('Enter a GitHub owner and repository name, not a URL.');
  if(!token.startsWith('github_pat_')||token.length<30)throw new Error('Paste a fine-grained personal access token from GitHub.');
  if(branch&&(/[\s~^:?*\[\\]/.test(branch)||branch.includes('..')||branch.includes('@{')||branch.endsWith('/')||branch.startsWith('/')))throw new Error('Enter a valid branch name.');
  const previous=this.config;this.config={owner,repo,branch,token};
  try{const meta=await this.request(this.root);if(meta.archived)throw new Error('This repository is archived and cannot save changes.');this.config.branch=branch||meta.default_branch;
   await this.request(this.root+'/branches/'+encodeURIComponent(this.config.branch));
   const existing=this.storage.getItem(JOURNAL);if(existing){const j=JSON.parse(existing);if(j.repository!==this.identity())throw new Error('Reconnect the original repository first to resolve its pending save.');}
   this.storage.setItem(SESSION,JSON.stringify(this.config));this.cached.clear();this.notify('connected');
  }catch(e){this.config=previous;this.notify(previous?'error':'disconnected');throw e;}
 }
 identity(){return [this.config.owner.toLowerCase(),this.config.repo.toLowerCase(),this.config.branch].join('/');}
 async restore(){const raw=this.storage.getItem(SESSION);if(!raw)return false;const input=JSON.parse(raw);await this.connect(input);return true;}
 disconnect(){if(this.storage.getItem(JOURNAL))throw new Error('Retry the pending save before disconnecting.');this.storage.removeItem(SESSION);this.config=null;this.cached.clear();this.notify('disconnected');}
 require(){if(!this.connected){window.dispatchEvent(new Event('storeflow:connect-required'));throw new Error('Connect your GitHub repository to make this change.');}}
 async read(path){
  this.require();let meta;
  try{meta=await this.request(this.root+'/contents/'+path+'?ref='+encodeURIComponent(this.config.branch));}catch(e){if(e.status!==404)throw e;if(this.cached.has(path))throw new Error('The store data file is missing or access was removed. Restore access before making changes.');return {sha:null,document:null};}
  if(meta.type!=='file'||!meta.sha)throw new Error('The store data path is not a file.');
  if(meta.size>45*1024*1024)throw new Error('This data file exceeds the 45 MB limit for this edition. Download a backup copy from GitHub before reducing the file size.');
  const cached=this.cached.get(path);if(cached?.sha===meta.sha){this.notify('saved');return clone(cached);}
  let content=meta.content;if(!content||meta.encoding!=='base64'){const blob=await this.request(this.root+'/git/blobs/'+meta.sha);if(blob.encoding!=='base64')throw new Error('Unsupported GitHub file encoding.');content=blob.content;}
  let document;try{document=JSON.parse(decode(content));}catch{throw new Error('The repository data file is invalid JSON. It was not overwritten. Restore a valid backup.');}
  if(document?.format!=='storeflow-github'||document.version!==1||!document.data||!Array.isArray(document.applied)||typeof document.epoch!=='string')throw new Error('This is not a supported StoreFlow repository data file. It was not overwritten.');
  const result={sha:meta.sha,document};this.cached.set(path,clone(result));this.notify('saved');return result;
 }
 journal(){const raw=this.storage.getItem(JOURNAL);return raw?JSON.parse(raw):null;}
 async commit(path,base,document,result){
  this.require();if(this.journal())throw new Error('Retry the previous unconfirmed save before making another change.');
  const id=crypto.randomUUID(),changes={};
  for(const [name,rows] of Object.entries(document.data)){const old=new Map((base.document?.data[name]||[]).map(r=>[r.id,r]));const next=new Set(rows.map(r=>r.id));const put=rows.filter(r=>JSON.stringify(old.get(r.id))!==JSON.stringify(r));const remove=[...old.keys()].filter(id=>!next.has(id));if(!base.document?.data[name]||put.length||remove.length)changes[name]={put,remove};}
  const {data,applied,...meta}=document;
  const j={id,path,repository:this.identity(),baseSha:base.sha,meta,changes,result:result??null};
  // This recovery journal must exist before sending a potentially ambiguous PUT.
  try{this.storage.setItem(JOURNAL,JSON.stringify(j));}catch{throw new Error('This batch is too large for safe save recovery in this tab. Import fewer rows at a time or reduce image sizes. Nothing was sent to GitHub.');}
  this.pending=true;return this.sendJournal(j,base);
 }
 apply(j,base){const document=clone(base.document||{data:{},applied:[]});Object.assign(document,j.meta);for(const [name,patch] of Object.entries(j.changes)){const map=new Map((document.data[name]||[]).map(r=>[r.id,r]));for(const id of patch.remove)map.delete(id);for(const r of patch.put)map.set(r.id,r);document.data[name]=[...map.values()];}document.applied=[...(document.applied||[]),j.id].slice(-2000);return document;}
 finish(j,snapshot){this.storage.removeItem(JOURNAL);this.pending=false;this.cached.set(j.path,clone(snapshot));this.notify('saved');return {snapshot,result:j.result};}
 async sendJournal(j,base){
  this.pending=true;this.notify('saving');const document=this.apply(j,base);const text=JSON.stringify(document);if(encoder.encode(text).length>45*1024*1024){this.storage.removeItem(JOURNAL);this.pending=false;this.notify('error');throw new Error('Save exceeds this edition’s 45 MB data-file limit. Nothing was changed.');}
  try{const response=await this.request(this.root+'/contents/'+j.path,'PUT',{message:'StoreFlow: save records',branch:this.config.branch,content:encode(text),...(j.baseSha?{sha:j.baseSha}:{})});if(!response.content?.sha)throw new Error('The save response could not be confirmed.');return this.finish(j,{sha:response.content.sha,document});}
  catch(error){
   // A failed/lost HTTP response is NOT proof that the commit failed.
   try{const current=await this.read(j.path);if(current.document?.applied.includes(j.id))return this.finish(j,current);if(current.sha!==j.baseSha){this.storage.removeItem(JOURNAL);this.pending=false;this.notify('error');const conflict=new Error('Another device changed this store. This action was not applied. Refresh and retry it.');conflict.conflict=true;throw conflict;}}catch(check){if(check.conflict)throw check;}
   if([401,403,404,422].includes(error.status)){this.storage.removeItem(JOURNAL);this.pending=false;}
   this.notify(this.pending?'pending':'error');throw error;
  }
 }
 async recover(){
  this.require();const j=this.journal();if(!j){this.pending=false;return null;}if(j.repository!==this.identity())throw new Error('Reconnect the original repository to recover the pending save.');
  this.pending=true;const base=await this.read(j.path);if(base.document?.applied.includes(j.id))return this.finish(j,base);
  if(base.sha!==j.baseSha){this.storage.removeItem(JOURNAL);this.pending=false;this.notify('error');throw new Error('The earlier save could not be applied because another device changed the store. Review the latest records, then repeat that action.');}
  return this.sendJournal(j,base);
 }
}
export const repository=new Repository();
