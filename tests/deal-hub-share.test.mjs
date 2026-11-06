import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../dist/deal-hub-share.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(device={}){
 const document={activeElement:null,listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},removeEventListener(name){delete this.listeners[name];}};
 class Element {
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.hidden=false;this.isConnected=true;this.disabled=false;this.listeners={};}
  append(...items){for(const item of items){item.parent=this;this.children.push(item);}}
  replaceChildren(){this.children=[];}
  setAttribute(k,v){this.attrs[k]=v;}
  getAttribute(k){return this.attrs[k]??null;}
  contains(target){return target===this||this.children.some(child=>child.contains(target));}
  querySelectorAll(){return this.children.flatMap(child=>[...(child.tag==='button'?[child]:[]),...child.querySelectorAll()]);}
  querySelector(selector){return this.querySelectorAll().find(child=>!selector.includes(':disabled')||!child.disabled);}
  addEventListener(k,fn){this.listeners[k]=fn;} removeEventListener(k){delete this.listeners[k];}
  focus(){document.activeElement=this;}
 }
 document.createElement=tag=>new Element(tag);
 const state=vm.createContext({window:{DealLogicBriefing:{build:async()=>new Blob(['PK sample'])}},document,navigator:device,Blob,File,console});vm.runInContext(source,state);
 const root=new Element('div'),downloads=[],snapshot={project:{id:'redwood',name:'Redwood & Co',side:'Buyer'},issues:[{id:'ip',title:'IP gap',risk:'4/5'}],actions:[{issueId:'ip',title:'Review, title',instruction:'Review "rights"',notes:'Keep notes'}]};
 const control=state.window.DealLogicSharing.mount(root,{getSnapshot:()=>snapshot,download:(...args)=>downloads.push(args)});
 const buttons=()=>root.querySelectorAll(),click=name=>{const b=buttons().find(b=>b.textContent===name);assert.ok(b,name);assert.equal(b.disabled,false);b.onclick();};
 return {api:state.window.DealLogicSharing,state,root,document,snapshot,control,downloads,buttons,click};
}
test('CSV preserves BOM, quotes, notes and full export columns',async()=>{
 const h=harness(),text=await h.api.csvBlob(h.snapshot).arrayBuffer();assert.deepEqual([...new Uint8Array(text).slice(0,3)],[239,187,191]);
 const csv=new TextDecoder().decode(text);assert.match(csv,/"Review, title"/);assert.match(csv,/"Review ""rights"""/);assert.match(csv,/Keep notes/);assert.match(csv,/Source document/);
});
test('email subject and body use the deal name and correctly encode special characters',()=>{
 const h=harness();for(const kind of ['table','briefing']){const message=h.api.message(kind,h.snapshot);assert.match(message.title,/Redwood & Co/);const params=new URLSearchParams(message.mailto.split('?')[1]);assert.equal(params.get('subject'),message.title);assert.equal(params.get('body'),message.text);assert.match(message.text,/Please find attached/);}
});
test('native share is called directly on selection with a prepared file and prefilled title/text',async()=>{
 let payload;const device={canShare:()=>true,share:data=>{payload=data;return Promise.resolve();}},h=harness(device);
 h.click('Share');await tick();h.click('Briefing (.docx)');assert.ok(payload);assert.equal(payload.files[0].name,'deal-hub-briefing.docx');assert.match(payload.title,/briefing/);assert.match(payload.text,/Please find attached/);await tick();h.click('Share');await tick();h.click('Action table (.csv)');assert.equal(payload.files[0].name,'deal-hub-actions.csv');assert.equal(h.downloads.length,0);
});
test('unsupported desktop file sharing exposes download and prefilled email without auto-sending',async()=>{
 const h=harness();h.click('Share');await tick();h.click('Action table (.csv)');assert.equal(h.downloads.length,0);h.click('Download file');assert.equal(h.downloads[0][0],'deal-hub-actions.csv');const notice=h.root.children[1];assert.equal(notice.hidden,false);assert.match(notice.children.find(child=>child.tag==='a').attrs.href,/^mailto:/);
});
test('cancelling native sharing does not trigger download or email fallback',async()=>{
 const h=harness({canShare:()=>true,share:()=>Promise.reject({name:'AbortError'})});h.click('Share');await tick();h.click('Briefing (.docx)');await tick();assert.equal(h.downloads.length,0);assert.equal(h.root.children[1].hidden,true);assert.equal(h.buttons()[0].textContent,'Share');
});
test('share failure offers fallback and stale deal data is rebuilt before sharing',async()=>{
 let calls=0;const h=harness({canShare:()=>true,share:()=>{calls++;throw {name:'NotAllowedError'};}});h.click('Share');await tick();h.snapshot.project.name='New deal';h.click('Briefing (.docx)');assert.equal(calls,0);await tick();h.click('Briefing (.docx)');assert.equal(calls,1);await tick();assert.equal(h.root.children[1].hidden,false);const email=h.root.children[1].children.find(child=>child.tag==='a');assert.match(decodeURIComponent(email.attrs.href),/New deal/);
});
test('Escape and outside click collapse choices and destroy removes listeners',async()=>{
 const h=harness();h.click('Share');await tick();h.root.listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(h.buttons()[0].textContent,'Share');h.click('Share');h.document.listeners.click({target:{}});assert.equal(h.buttons()[0].textContent,'Share');h.control.destroy();assert.equal(h.document.listeners.click,undefined);
});
test('preparation failure leaves the table usable and supports a briefing retry',async()=>{
 const h=harness();let attempts=0;
 h.state.window.DealLogicBriefing.build=async()=>{if(++attempts===1)throw Error('offline');return new Blob(['PK']);};
 h.click('Share');await tick();assert.equal(h.buttons().find(b=>b.textContent==='Action table (.csv)').disabled,false);
 h.click('Retry Briefing (.docx)');await tick();assert.equal(h.buttons().find(b=>b.textContent==='Briefing (.docx)').disabled,false);
});
test('destroy cancels pending preparation and blocked capability checks fall back',async()=>{
 const h=harness();h.click('Share');h.control.destroy();await tick();assert.ok(h.buttons().find(b=>b.textContent==='Briefing (.docx)').disabled);
 assert.equal(h.api.canShareFile(new File(['x'],'x.csv'),{share(){},canShare(){throw Error('blocked');}}),false);
});
test('opening click remains inside the control after its button is replaced',()=>{
 const h=harness();h.click('Share');h.document.listeners.click({target:{},composedPath:()=>[h.root]});assert.ok(h.buttons().some(b=>b.textContent==='Briefing (.docx)'));
});
