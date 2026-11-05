import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source = await readFile(new URL('../dist/termination-rights.js', import.meta.url), 'utf8');
const issues = JSON.parse(await readFile(new URL('../dist/issues.json', import.meta.url), 'utf8'));
const issue = issues.find(i => i.id === 'termination-rights-and-material-breaches');
function setup() {
  let report;
  const card = {innerHTML:'', classList:{add(){}}};
  const context = vm.createContext({answers:{}, escapeLogicText: value => String(value), current:()=>issue, riskScore:()=>4, renderPanel(){}, renderLogic(){card.innerHTML='Other issue';}, exportReport(){report='Other export';}, areas:{'commercial-contracts':'Material Contracts'}, Blob:class {constructor(parts){report=parts.join('');}}, URL:{createObjectURL:()=> 'blob:test', revokeObjectURL(){}}, document:{querySelector: selector => selector === '#logic-card' ? card : null, createElement:()=>({click(){}})}});
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.testApi = {fields, ids, visibleIds, normalize}; })();'),context);
  return {...context.testApi,context,card,report:()=>report};
}
test('progressive reveal, early exit and invalid saved data',()=>{
  const {ids,visibleIds,normalize,fields}=setup();
  assert.equal(visibleIds({}).length,1);
  for(const [value] of fields[ids[0]].options) assert.equal(visibleIds({[ids[0]]:value}).length,value==='no'?1:2);
  const state=Object.fromEntries(ids.map(id=>[id,'unknown']));
  assert.equal(visibleIds(state).length,5);
  state[ids[1]]='obsolete'; normalize(state);
  assert.deepEqual(Object.keys(state),[ids[0]]);
  state[ids[0]]='no';state[ids[4]]='addressed';normalize(state);
  assert.deepEqual(Object.keys(state),[ids[0]]);
});
test('questionnaire exports exclude hidden answers and borrowed advice',()=>{
  const {ids,context,report,card}=setup();
  context.answers={[ids[0]]:'no',[ids[3]]:'fundamental'};
  context.exportReport();
  assert.match(report(),/Response: No/);
  assert.doesNotMatch(report(),/Response: Fundamental|Risk score:|Reasonableness/);
  context.renderLogic(issue);
  assert.match(card.innerHTML,/Answer all relevant questions/);
  assert.equal(context.riskScore(),1);
  context.renderLogic({id:'other'});assert.equal(card.innerHTML,'Other issue');
});
