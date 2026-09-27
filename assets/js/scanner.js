import {icon,iconBtn,btn,esc,loadScript,toast} from './ui.js';
let controls,reader,generation=0,lastCode='',lastSeen=0,lastAccepted=0,torch=false,audio;
let callbacks;
const el=()=>document.querySelector('#scanner');
export function closeScanner(){generation++;controls?.stop();controls=null;const v=el().querySelector('video');v?.srcObject?.getTracks().forEach(t=>t.stop());if(v)v.srcObject=null;if(el().open)el().close();}
export async function openScanner(mode,hooks){
 closeScanner();callbacks=hooks;lastCode='';lastSeen=lastAccepted=0;
 const d=el();d.classList.toggle('fast-mode',!!hooks.fast);d.innerHTML=`<div class="dialog-head"><h2 id="scanner-title">${icon('scan')} ${mode==='sell'?'Scan to sell':mode==='stock'?'Scan to receive stock':mode==='add'?'Scan a new product':'Product lookup'}</h2>${iconBtn('Close scanner','scan-close','close')}</div><div class="scanner-stage"><video id="scan-video" playsinline muted autoplay></video><div class="scan-frame"></div><div class="scan-line"></div></div><div class="scanner-feedback" role="status" aria-live="polite">Starting camera…</div><div class="scanner-controls"><select id="camera-select" aria-label="Camera"><option value="">Rear camera</option></select>${iconBtn('Toggle flashlight','torch','light','disabled')}</div><p class="scan-instruction">Point the camera at a barcode or QR code. Move it away, then scan again to add another. No photo needed.</p><div id="scan-unknown"></div><div class="scan-manual"><form id="manual-scan"><input aria-label="Enter barcode manually" name="barcode" placeholder="Or enter / scan with a USB reader" autocomplete="off" required><button class="btn" type="submit">Enter</button></form>${mode==='sell'?`<div class="actions" style="margin-top:18px"><span id="scan-total" class="scanner-cart-total">${hooks.total()}</span>${btn('Checkout','scan-checkout','cart','primary')}</div>`:''}</div>`;
 d.showModal();try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){audio??=new AC();await audio.resume();}}catch{}
 const feedback=t=>{const f=d.querySelector('.scanner-feedback');if(f)f.textContent=t;};
 async function accept(code,manual=false){
  code=String(code).trim();if(!code||code.length>512){feedback('This code is too long. Use a product barcode.');return;}
  if(document.querySelector('#dialog').open||d.querySelector('#scan-unknown').childElementCount){if(code===lastCode)lastSeen=Date.now();return;}
  const time=Date.now(),same=code===lastCode,seenAgo=time-lastSeen;lastSeen=time;
  if(!manual&&same&&(seenAgo<850||time-lastAccepted<1400))return;
  lastCode=code;lastAccepted=time;
  const p=hooks.find(code);
  if(!p){feedback('Product not found');d.querySelector('#scan-unknown').innerHTML=`<div class="unknown-panel"><strong>Unknown product</strong><p>Barcode: ${esc(code)}</p><div class="actions">${btn('Add product','scan-add','plus','primary')}${btn('Ignore','scan-ignore')}</div></div>`;d.querySelector('[data-action="scan-add"]').onclick=()=>{d.querySelector('#scan-unknown').innerHTML='';hooks.add(code);};return;}
  try{await hooks.found(p,mode);feedback(mode==='sell'?`${p.name} added to bill`:`Found: ${p.name}`);if(hooks.settings.vibration&&navigator.vibrate)navigator.vibrate(50);if(hooks.settings.sound&&audio){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=1046;g.gain.value=.07;o.connect(g);g.connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.stop(audio.currentTime+.12);}if(d.querySelector('#scan-total'))d.querySelector('#scan-total').textContent=hooks.total();}
  catch(e){feedback(e.message);toast(e.message,true);}
 }
 d.querySelector('#manual-scan').onsubmit=e=>{e.preventDefault();const input=e.currentTarget.elements.barcode;accept(input.value,true);input.value='';};
 d.onclick=async e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='scan-close')closeScanner();if(action==='scan-ignore'){d.querySelector('#scan-unknown').innerHTML='';feedback('Ready to scan');}if(action==='scan-checkout'){closeScanner();hooks.checkout();}if(action==='torch'&&controls?.switchTorch){try{torch=!torch;await controls.switchTorch(torch);}catch{toast('This camera could not enable its flashlight.',true);}}};
 d.oncancel=()=>closeScanner();d.onclose=()=>{controls?.stop();controls=null;};
 async function start(deviceId){
  const token=++generation;controls?.stop();controls=null;torch=false;d.querySelector('[data-action="torch"]').disabled=true;
  if(!navigator.mediaDevices?.getUserMedia){feedback('Camera requires HTTPS and a supported browser. You can enter a barcode below.');return;}
  try{
   await loadScript('assets/vendor/zxing.min.js');if(token!==generation)return;
   reader=new ZXingBrowser.BrowserMultiFormatReader(undefined,{delayBetweenScanAttempts:120,delayBetweenScanSuccess:120});
   const c=await reader.decodeFromConstraints({audio:false,video:deviceId?{deviceId:{exact:deviceId},width:{ideal:1280},height:{ideal:720}}:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}},d.querySelector('video'),(result)=>{if(token!==generation)return;if(result)accept(result.getText());});
   if(token!==generation){c.stop();return;}controls=c;
   d.querySelector('[data-action="torch"]').disabled=!c.switchTorch;
   const devices=await ZXingBrowser.BrowserCodeReader.listVideoInputDevices();if(token!==generation)return;
   const current=d.querySelector('video').srcObject?.getVideoTracks()[0]?.getSettings()?.deviceId;
   d.querySelector('#camera-select').innerHTML=devices.map((x,i)=>`<option value="${esc(x.deviceId)}" ${x.deviceId===current?'selected':''}>${esc(x.label||`Camera ${i+1}`)}</option>`).join('');feedback('Ready. Place a barcode inside the frame.');
  }catch(e){if(token!==generation)return;const msg=e.name==='NotAllowedError'?'Camera access denied. Allow camera access in your browser settings.':e.name==='NotFoundError'?'No camera found. Connect a camera or enter the barcode below.':e.name==='NotReadableError'?'The camera is busy. Close other apps using it, then reopen Scan.':'Camera could not start. Try another camera or enter the barcode below.';feedback(msg);}
 }
 d.querySelector('#camera-select').onchange=e=>start(e.target.value);await start();
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&el().open)closeScanner();});
