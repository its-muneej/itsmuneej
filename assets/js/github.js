import {DEFAULT_SETTINGS,normalizeSettings,applyPageSettings,validImagePath} from './settings.js';
import {validateCatalog} from './core.js';
// Normalize equivalent local paths before checking whether an image is still used.
function imagePath(value){return typeof value==='string'&&value&&validImagePath(value)?value.split('/').filter(part=>part&&part!=='.').join('/'):'';}
function referencedImages(catalog){
  const paths=[...catalog.products,...catalog.categories].map(item=>item.image);
  for(const key of ['favicon','headerLogo','footerLogo','heroImage','heroPrimaryLink','heroSecondaryLink'])paths.push(catalog.settings?.[key]);
  return new Set(paths.map(imagePath).filter(Boolean));
}
export class GitHubPublisher {
  #token;
  constructor(config,token){this.config={...config};this.#token=token;this.root=`/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`;}
  disconnect(){this.#token='';}
  path(file){return (this.config.directory?this.config.directory+'/':'')+file;}
  async request(path,{method='GET',body,raw=false}={}){
    if(!this.#token)throw new Error('Connect GitHub to publish.');
    let response;
    try{response=await fetch('https://api.github.com'+this.root+path,{method,headers:{'Accept':raw?'application/vnd.github.raw+json':'application/vnd.github+json','Authorization':'Bearer '+this.#token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(45000)});}catch{throw new Error('GitHub could not be reached. Check your connection and try again.');}
    if(!response.ok){const error=new Error(({401:'GitHub authorization expired or is invalid. Disconnect and connect with a valid fine-grained token.',403:'GitHub denied this request. Check Contents: Read and write, token approval, branch rules, or your API rate limit.',404:'Repository, branch, or store files not found. Check your repository settings, upload all site files, and ensure the token can access this repository.',409:'The branch changed while you were publishing. Refresh the catalog and review your changes.',422:'GitHub rejected the update. The branch may have changed or require pull requests. Refresh the catalog and check branch rules.'})[response.status]||`GitHub request failed (HTTP ${response.status}). No further publishing steps were attempted.`);error.status=response.status;throw error;}
    return raw?response:response.json();
  }
  async connect(){const repo=await this.request('');if(repo.permissions?.push===false)throw new Error('Your GitHub account does not have write access to this repository.');return this.snapshot();}
  async snapshot(){
    const ref=await this.request('/git/ref/heads/'+encodeURIComponent(this.config.branch));
    const head=ref.object.sha;
    const [commit,products,categories,settings]=await Promise.all([this.request('/git/commits/'+head),this.readJSON('data/products.json',head),this.readJSON('data/categories.json',head),this.readSettings(head)]);
    validateCatalog(products,categories);
    return {head,tree:commit.tree.sha,products,categories,settings};
  }
  async readSettings(ref){try{return normalizeSettings(await this.readJSON('data/settings.json',ref));}catch(error){if(error.status===404)return {...DEFAULT_SETTINGS};throw error;}}
  async readText(file,ref){const response=await this.request('/contents/'+this.path(file).split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref),{raw:true});return response.text();}
  async readJSON(file,ref){const response=await this.request('/contents/'+this.path(file).split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref),{raw:true});try{return await response.json();}catch{throw new Error(file+' contains invalid JSON. Restore a working version from GitHub history.');}}
  async readImage(file,ref){if(!/^assets\/images\/[\w./-]+\.(webp|png|jpe?g)$/i.test(file)||file.includes('..'))throw new Error('Unsupported image path');const response=await this.request('/contents/'+this.path(file).split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref),{raw:true});return URL.createObjectURL(await response.blob());}
  async retiredImageEntries(before,after,uploads){
    const used=referencedImages(after);
    // Never remove an image also being uploaded in this commit, or the built-in fallback.
    used.add('assets/images/products/templates.webp');
    for(const asset of uploads)used.add(imagePath(asset.path));
    const candidates=[...new Set([...before.products,...before.categories].map(item=>item.image))].filter(path=>
      typeof path==='string'&&/^assets\/images\/(products|categories)\/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(webp|png|jpe?g|gif|avif)$/i.test(path)&&!path.includes('..')&&!used.has(path)
    );
    if(!candidates.length)return [];
    // Inspect only the required folders at the exact commit we loaded. GitHub rejects
    // deletions of missing files. Non-recursive tree reads also avoid repository-wide limits.
    const trees=new Map();
    const readTree=sha=>{
      if(!trees.has(sha))trees.set(sha,this.request('/git/trees/'+encodeURIComponent(sha)).then(tree=>{
        if(tree.truncated||!Array.isArray(tree.tree))throw new Error('GitHub returned an incomplete image folder. Nothing was published. Try again or check the repository.');
        return new Map(tree.tree.map(entry=>[entry.path,entry]));
      }));
      return trees.get(sha);
    };
    const entries=[];
    for(const path of candidates){
      const parts=this.path(path).split('/');let sha=before.tree,entry;
      for(let index=0;index<parts.length;index++){
        entry=(await readTree(sha)).get(parts[index]);
        if(!entry)break;
        if(index<parts.length-1){if(entry.type!=='tree'||entry.mode!=='040000'){entry=undefined;break;}sha=entry.sha;}
      }
      // Keep symbolic links, directories and anything outside the two catalog folders.
      if(entry?.type==='blob'&&['100644','100755'].includes(entry.mode))entries.push({path:this.path(path),mode:entry.mode,type:'blob',sha:null});
    }
    return entries;
  }
  async publish(mutate,image,onProgress=()=>{}){
    onProgress(1,'Checking the latest repository version…');
    const snapshot=await this.snapshot();
    const result=mutate(structuredClone(snapshot));
    validateCatalog(result.products,result.categories);
    result.settings=normalizeSettings(result.settings);
    const settingsChanged=JSON.stringify(result.settings)!==JSON.stringify(snapshot.settings);
    const tree=[];
    const images=Array.isArray(image)?image:image?[image]:[];
    onProgress(2,images.length?'Uploading selected images…':'Keeping existing images…');
    for(const asset of images){
      if(!/^assets\/images\/[\w./-]+\.(webp|png|jpe?g)$/i.test(asset.path)||asset.path.includes('..'))throw new Error('Invalid upload path.');
      const blob=await this.request('/git/blobs',{method:'POST',body:{content:asset.base64,encoding:'base64'}});
      tree.push({path:this.path(asset.path),mode:'100644',type:'blob',sha:blob.sha});
    }
    for(const key of ['products','categories','settings'])if(JSON.stringify(result[key])!==JSON.stringify(snapshot[key]))tree.push({path:this.path(`data/${key}.json`),mode:'100644',type:'blob',content:JSON.stringify(result[key],null,2)+'\n'});
    if(settingsChanged){
      // Keep title, description, favicon, and static homepage copy crawlable without JavaScript.
      const pages=[['index.html','home'],['contact.html','contact'],['product.html','product'],['admin/index.html','admin']];
      const htmlFiles=await Promise.all(pages.map(async([file,page])=>{
        const html=await this.readText(file,snapshot.head);
        const doc=new DOMParser().parseFromString(html,'text/html');
        if(!doc.querySelector('script[type="module"]'))throw new Error('Expected store HTML missing from '+file+'. Upload the complete site update first.');
        applyPageSettings(doc,result.settings,page,page==='admin'?'../':'');
        return {path:this.path(file),mode:'100644',type:'blob',content:'<!doctype html>\n'+doc.documentElement.outerHTML+'\n'};
      }));
      tree.push(...htmlFiles);
    }
    // Image removals, new uploads and catalog edits become visible together only after
    // the final non-forced branch update succeeds. No separate delete requests are made.
    tree.push(...await this.retiredImageEntries(snapshot,result,images));
    if(!tree.length)throw new Error('There are no changes to publish.');
    onProgress(3,'Preparing one complete store commit…');
    const nextTree=await this.request('/git/trees',{method:'POST',body:{base_tree:snapshot.tree,tree}});
    const commit=await this.request('/git/commits',{method:'POST',body:{message:result.message,tree:nextTree.sha,parents:[snapshot.head]}});
    onProgress(4,'Publishing the commit to your branch…');
    try{await this.request('/git/refs/heads/'+encodeURIComponent(this.config.branch),{method:'PATCH',body:{sha:commit.sha,force:false}});}
    catch(error){
      // A response can be lost after GitHub accepts a write. Check before reporting failure.
      let current;try{current=await this.request('/git/ref/heads/'+encodeURIComponent(this.config.branch));}catch{throw new Error('GitHub’s final response was not received. Publishing status is unknown. Check the repository commit history and refresh the catalog before retrying.');}
      if(current.object.sha!==commit.sha)throw error;
    }
    onProgress(5,'Committed to GitHub. Waiting for GitHub Pages…');
    return {...result,head:commit.sha,tree:nextTree.sha,commitURL:`https://github.com/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}/commit/${commit.sha}`};
  }
}
export function uniqueSlug(title,items){const root=title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70).replace(/-$/,'')||'product';let slug=root,i=2;while(items.some(p=>p.slug===slug))slug=root+'-'+i++;return slug;}
export function assertUnchanged(current,original){if(!current||JSON.stringify(current)!==JSON.stringify(original))throw new Error('This item has changed since you opened it. Your edits were not published. Close the editor, refresh the catalog, and reopen the latest version.');}
