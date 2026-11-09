import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import { inflateRawSync } from 'node:zlib';
function entries(bytes) {
  const files={};
  for(let pos=0;pos<bytes.length-46;pos++){
    if(bytes.readUInt32LE(pos)!==0x02014b50)continue;
    const size=bytes.readUInt32LE(pos+20), length=bytes.readUInt16LE(pos+28), offset=bytes.readUInt32LE(pos+42);
    const name=bytes.subarray(pos+46,pos+46+length).toString();
    const start=offset+30+bytes.readUInt16LE(offset+26)+bytes.readUInt16LE(offset+28);
    const body=bytes.subarray(start,start+size);
    files[name]=(bytes.readUInt16LE(pos+10)===8?inflateRawSync(body):body).toString();
  }
  return files;
}
import test from 'node:test';
import assert from 'node:assert/strict';
const fontData=await readFile(new URL('../dist/vendor/fonts/Inter.ttf',import.meta.url));
const logoData=await readFile(new URL('../dist/deal-lens-logo.png',import.meta.url));
const context = vm.createContext({ URL, fetch:async url=>({ok:true,arrayBuffer:async()=>{const data=String(url).endsWith('.png')?logoData:fontData;return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);}}), Blob, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, setTimeout, clearTimeout, console });
vm.runInContext(await readFile(new URL('../dist/vendor/docx.js',import.meta.url),'utf8'),context);
context.document={currentScript:{src:'https://example.test/briefing-export.js'}};
vm.runInContext(await readFile(new URL('../dist/briefing-export.js',import.meta.url),'utf8'),context);
test('browser bundle packs populated and empty deals into native Word files', async () => {
  for (const data of [{project:{name:'Project Redwood',side:'Balanced'},issues:[{id:'staff',title:'Key Employee Retention and Employment Terms',risk:'3/5 · Medium risk',summary:'Some key employees remain undecided about staying after completion.',answers:{private:'DO NOT EXPORT'}},{id:'debt',title:'Debt Facilities Requiring Repayment',risk:'5/5 · Very high risk',summary:'The lender has declined consent, or its required terms remain unmet.'}],actions:[{issueId:'debt',title:'Lender consent or waiver',priority:'Required',dealPhase:'Closing Condition',status:'To Review',side:'Balanced',instruction:'Obtain effective written consent or a waiver covering the transaction where a facility will continue.',notes:'Confirm the completion timetable.'},{issueId:'staff',title:'Review employment contracts',priority:'Recommended',dealPhase:'Due Diligence',status:'To Review',instruction:'Review contracts, amendments and incentive arrangements.'},{issueId:'orphan',title:'Custom & unassigned action',instruction:'Retain <all> saved actions.'}]},{}]) {
    const blob=await context.DealLogicBriefing.build({...data,date:new Date('2026-11-06T12:00:00Z')});
    const bytes=Buffer.from(await blob.arrayBuffer());
    assert.equal(bytes.subarray(0,2).toString(),'PK');
    const files=entries(bytes), xml=files['word/document.xml'];
    assert.ok(files['[Content_Types].xml'].includes('wordprocessingml.document.main+xml'));
    assert.ok(files['word/styles.xml'].includes('Inter'));
    const header=files['word/header1.xml'], footer=files['word/footer1.xml'];
    assert.ok(header.includes('<w:drawing>') && header.includes('Deal Lens layered mark'));
    assert.ok(!header.includes('Deal Lens  ·'));
    assert.ok(Object.keys(files).some(name=>name.startsWith('word/media/') && name.endsWith('.png')));
    assert.ok(footer.includes(`Deal Hub Briefing · ${data.project?.name || 'Deal workspace'} · `));
    assert.match(footer, /PAGE/);
    assert.match(footer, /w:jc w:val="right"/);
    assert.ok(Object.keys(files).some(name=>name.endsWith('.odttf')));
    assert.ok(!xml.includes('Recorded responses') && !xml.includes('DO NOT EXPORT'));
    if(data.issues){
      assert.ok(xml.indexOf('Debt Facilities Requiring Repayment')<xml.indexOf('Key Employee Retention'));
      assert.ok(xml.includes('Custom &amp; unassigned action') && xml.includes('Retain &lt;all&gt; saved actions.'));
      assert.ok(xml.includes('Confirm the completion timetable.'));
    }else assert.ok(xml.includes('No saved issues or actions'));

    if(process.env.BRIEFING_SAMPLE && data.issues) await writeFile(process.env.BRIEFING_SAMPLE,bytes);
  }
});
