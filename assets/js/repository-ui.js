import {repository,retrySave} from './db.js';
import {esc,field,btn,icon,toast,safeError,closeDialog} from './ui.js';
let dialog,onConnected;
export function initConnectionUI(callback){
 onConnected=callback;dialog=document.createElement('dialog');dialog.id='repository-dialog';dialog.setAttribute('aria-labelledby','repository-title');document.body.append(dialog);
 window.addEventListener('storeflow:connect-required',()=>connectionDialog('Connect Ultra Storage to make this change.'));
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-repo-close]'))dialog.close();});
 dialog.addEventListener('submit',async e=>{e.preventDefault();e.stopPropagation();const form=e.target,button=form.querySelector('[type="submit"]'),error=form.querySelector('.form-error');button.disabled=true;error.textContent='';
  try{const fields=Object.fromEntries(new FormData(form));await repository.connect(fields);form.elements.token.value='';await retrySave();dialog.close();closeDialog();await onConnected();toast('Ultra Storage connected for this tab session.');}catch(e){error.textContent=safeError(e);}finally{button.disabled=false;}
 });
}
export function connectionDialog(message=''){
 if(!dialog)return;const c=repository.details;
 dialog.innerHTML=`<div class="dialog-head"><h2 id="repository-title">${icon('shield')} Connect Ultra Storage</h2><button type="button" class="icon-button" data-repo-close aria-label="Close">${icon('close')}</button></div><div class="dialog-content">${message?`<div class="notice">${esc(message)}</div>`:''}<p class="muted">Connect the Ultra Storage that hosts this website. Your site and store data stay together.</p><form id="repository-form" autocomplete="off"><div class="form-grid">${field('Username / Organization','owner',c?.owner||'','text','required autocapitalize="none" spellcheck="false"')}${field('Webpage name','repo',c?.repo||'','text','required autocapitalize="none" spellcheck="false"')}${field('Branch (blank uses default)','branch',c?.branch||'','text','placeholder="main" autocapitalize="none" spellcheck="false"')}${field('Personal Access Key','token','','password','required autocomplete="off" autocapitalize="none" spellcheck="false"',true)}</div><div class="form-error" role="alert"></div><div class="dialog-actions"><button type="button" class="btn" data-repo-close>Cancel</button><button type="submit" class="btn primary">Connect Ultra Storage</button></div></form><p class="small"><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Create a Personal Access Key</a> · <a href="START-HERE.html" target="_blank" rel="noopener noreferrer">Setup guide</a></p></div>`;
 if(!dialog.open)dialog.showModal();
}
