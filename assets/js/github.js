import {validateCatalog} from './core.js';
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
    const [commit,products,categories]=await Promise.all([this.request('/git/commits/'+head),this.readJSON('data/products.json',head),this.readJSON('data/categories.json',head)]);
    validateCatalog(products,categories);
    return {head,tree:commit.tree.sha,products,categories};
  }
  async readJSON(file,ref){const response=await this.request('/contents/'+this.path(file).split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref),{raw:true});try{return await response.json();}catch{throw new Error(file+' contains invalid JSON. Restore a working version from GitHub history.');}}
  async readImage(file,ref){if(!/^assets\/images\/[\w./-]+\.(webp|png|jpe?g)$/i.test(file)||file.includes('..'))throw new Error('Unsupported image path');const response=await this.request('/contents/'+this.path(file).split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref),{raw:true});return URL.createObjectURL(await response.blob());}
  async publish(mutate,image,onProgress=()=>{}){
    onProgress(1,'Checking the latest repository version…');
    const snapshot=await this.snapshot();
    const result=mutate(structuredClone(snapshot));
    validateCatalog(result.products,result.categories);
    const tree=[];
    if(image){onProgress(2,'Uploading the product/category image…');const blob=await this.request('/git/blobs',{method:'POST',body:{content:image.base64,encoding:'base64'}});tree.push({path:this.path(image.path),mode:'100644',type:'blob',sha:blob.sha});}
    else onProgress(2,'Keeping the existing image…');
    for(const key of ['products','categories'])if(JSON.stringify(result[key])!==JSON.stringify(snapshot[key]))tree.push({path:this.path(`data/${key}.json`),mode:'100644',type:'blob',content:JSON.stringify(result[key],null,2)+'\n'});
    if(!tree.length)throw new Error('There are no changes to publish.');
    onProgress(3,'Preparing one complete catalog commit…');
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
