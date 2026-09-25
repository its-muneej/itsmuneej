(() => {
  'use strict';
  const form=document.querySelector('#project-form');
  if(!form)return;
  const studio=window.Studio;
  const dialog=document.querySelector('#inquiry-dialog');
  const text=document.querySelector('#inquiry-text');
  const files=document.querySelector('#reference-files');
  const params=new URLSearchParams(location.search);
  const service=params.get('service');
  if([...form.elements.service.options].some(o=>o.value===service))form.elements.service.value=service;
  const product=(window.PRODUCTS||[]).find(p=>p.id===params.get('product'));
  if(product){form.elements.service.value='Custom product';form.elements.description.value=`I am interested in the ${product.name}. Please share available sizes, colors, material, price and lead time.`;}
  const deadline=form.elements.deadline;
  const now=new Date();
  deadline.min=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  files.addEventListener('change',()=>{
    const list=document.querySelector('#file-list');list.replaceChildren();
    Array.from(files.files).forEach(file=>{const li=document.createElement('li');li.textContent=`${file.name} · ${(file.size/1024/1024).toFixed(2)} MB · attach when sending`;list.append(li);});
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const rows=[['Name','name'],['Phone / WhatsApp','phone'],['Email','email'],['Request','service'],['Project','description'],['Dimensions','dimensions'],['Quantity','quantity'],['Preferred color','color'],['Material','material'],['Ideal deadline','deadline']];
    let message='Hello ShePrints3D! I would like a quote for my project.\n\n';
    message+=rows.map(([label,key])=>`${label}: ${String(data.get(key)||'').trim()||'Not specified'}`).join('\n\n');
    if(files.files.length)message+='\n\nReference files (I will attach these separately):\n'+Array.from(files.files).map(file=>file.name).join('\n');
    message+='\n\nPlease confirm feasibility, price and lead time. Thank you!';
    text.value=message;
    const wa=document.querySelector('#send-whatsapp');
    const email=document.querySelector('#send-email');
    wa.hidden=!studio.hasWhatsApp;
    if(studio.hasWhatsApp){wa.href=studio.whatsappURL(message);wa.target='_blank';wa.rel='noopener noreferrer';}
    email.hidden=!studio.config.email;
    if(studio.config.email)email.href=`mailto:${encodeURIComponent(studio.config.email)}?subject=${encodeURIComponent('Project inquiry — ShePrints3D')}&body=${encodeURIComponent(message)}`;
    document.querySelector('#inquiry-help').textContent=studio.hasWhatsApp||studio.config.email?'Review your brief, then choose how to send it.':'Direct messaging is not available yet. Copy or download your brief to keep it ready; nothing has been sent.';
    dialog.showModal();
  });
  document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.querySelector('#copy-inquiry').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(text.value);studio.toast('Project brief copied. Attach your files when sending.');}
    catch{text.focus();text.select();studio.toast('Select and copy the brief, or use Download Brief.');}
  });
  document.querySelector('#download-inquiry').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([text.value],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='ShePrints3D-project-brief.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    studio.toast('Project brief prepared for download.');
  });
})();
