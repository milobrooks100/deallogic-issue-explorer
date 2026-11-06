import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/workspace-redesign.js',import.meta.url),'utf8');
const feature=source.slice(source.indexOf('  // Keep existing issue colours'),source.indexOf('  const paths'));
function setup(){
 let handler, focused=false, renders=0;
 const context=vm.createContext({issues:JSON.parse(readFileSync(new URL('../dist/issues.json',import.meta.url),'utf8')),selectedId:'chosen',openArea:'commercial-contracts',answers:{saved:'yes'},document:{addEventListener:(type,fn)=>handler=fn,querySelector:()=>({focus(){focused=true;}})},requestAnimationFrame:fn=>fn(),renderMap(){renders++;},renderPanel(){renders++;}});
 vm.runInContext(feature+';globalThis.feature={issueColour,issuePalette,issueColourOrder};',context);
 return {context,...context.feature,click:()=>handler({target:{closest:()=>true}}),focused:()=>focused,renders:()=>renders};
}
test('issue palette uses 13 distinct slots and cycles while preserving existing assignments',()=>{
 const {context,issueColour,issuePalette,issueColourOrder}=setup();
 assert.equal(new Set(issuePalette).size,13);
 const before=issueColourOrder.map(id=>issueColour(id));
 const additions=Array.from({length:20},(_,i)=>({id:'future-'+i}));
 context.issues.unshift(...additions);
 assert.deepEqual(issueColourOrder.map(id=>issueColour(id)),before);
 const colours=[...issueColourOrder,...additions.map(x=>x.id)].map(issueColour);
 assert.equal(new Set(colours.slice(0,13)).size,13);
 assert.equal(colours[13],colours[0]);assert.equal(colours[26],colours[0]);
});
test('Deal areas returns to overview and focuses its heading',()=>{
 const {context,click,focused,renders}=setup();click();
 assert.equal(context.selectedId,null);assert.equal(context.openArea,null);
 assert.equal(Object.keys(context.answers).length,0);
 assert.equal(renders(),2);assert.equal(focused(),true);
});
