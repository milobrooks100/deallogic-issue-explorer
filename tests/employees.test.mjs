import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../dist/employees.js', import.meta.url), 'utf8');
const issues = JSON.parse(await readFile(new URL('../dist/issues.json', import.meta.url), 'utf8'));
const employee = issues.find(issue => issue.category === 'employees');
function setup() {
  const card = { innerHTML: '', classList: { add() {}, remove() {} } };
  let report;
  const context = vm.createContext({
    answers: {}, current: () => employee, areas: {employees: 'Employment'},
    riskScore: () => 4, renderPanel() {}, renderLogic() { card.innerHTML = 'Existing issue'; },
    exportReport() { report = 'Existing export'; },
    Blob: class { constructor(parts) { report = parts.join(''); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    document: { querySelector: selector => selector === '#logic-card' ? card : null, createElement: () => ({click() {}}) }
  });
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.employeeTest = { fields, ids, visibleIds, normalize, buildAnalysis, summaryCopy, implicationCopy }; })();'), context);
  return { context, card, getReport: () => report, ...context.employeeTest };
}
test('progressive reveal stops at unanswered, invalid or confirmed absence', () => {
  const { ids, visibleIds } = setup();
  assert.deepEqual(Array.from(visibleIds({})), [ids[0]]);
  assert.equal(visibleIds({[ids[0]]:'yes'}).length, 2);
  assert.equal(visibleIds({[ids[0]]:'no', [ids[1]]:'difficult'}).length, 1);
  assert.equal(visibleIds({[ids[0]]:'unknown'}).length, 2);
  assert.equal(visibleIds({[ids[0]]:'partly'}).length, 2);
  assert.equal(visibleIds({[ids[0]]:'invalid'}).length, 1);
});
test('obsolete dependent answers are removed from saved context', () => {
  const {ids, normalize} = setup();
  const responses = Object.fromEntries(ids.map(id => [id, 'yes']));
  responses[ids[0]] = 'no';
  normalize(responses);
  assert.deepEqual(responses, {[ids[0]]:'no'});
});
test('exports use visible current labels and never borrow litigation analysis', () => {
  const {context, ids, getReport, card} = setup();
  context.answers = {[ids[0]]:'no', [ids[1]]:'difficult'};
  context.exportReport();
  assert.match(getReport(), /Response: No/);
  assert.doesNotMatch(getReport(), /Difficult|Risk score|litigation/i);
  context.renderLogic(employee);
  assert.match(card.innerHTML, /Key deal implications/);
  assert.doesNotMatch(card.innerHTML, /Recommended actions|Limitation periods/);
  context.renderLogic({id:'other'});
  assert.equal(card.innerHTML, 'Existing issue');
});

test('legacy uncertainty selections migrate without losing later answers', () => {
  const {ids, normalize} = setup();
  const responses = Object.fromEntries(ids.map(id => [id, 'not-assessed']));
  responses[ids[1]] = 'manageable';
  normalize(responses);
  assert.deepEqual(responses, {
    [ids[0]]: 'unknown', [ids[1]]: 'manageable', [ids[2]]: 'unknown',
    [ids[3]]: 'unknown', [ids[4]]: 'unclear', [ids[5]]: 'unknown'
  });
});

test('all answer permutations produce complete prose or standby with at most three stable implications', () => {
  const {ids, fields, buildAnalysis, summaryCopy, implicationCopy} = setup();
  const stable = new Set(Object.values(implicationCopy));
  let checked = 0;
  function visit(index, responses) {
    if (index < ids.length) {
      const id = ids[index];
      for (const value of ['', ...fields[id].options.map(pair => pair[0])]) visit(index + 1, {...responses, [id]:value});
      return;
    }
    checked++;
    const result = buildAnalysis(responses);
    const complete = responses[ids[0]] === 'no' || ids.every(id => responses[id]);
    assert.equal(Boolean(result), Boolean(complete));
    if (!result) return;
    assert.ok(result.implications.length >= 1 && result.implications.length <= 3);
    assert.equal(new Set(result.implications).size, result.implications.length);
    result.implications.forEach(text => assert.ok(stable.has(text)));
    assert.doesNotMatch(result.summary, /undefined|Unanswered|not-assessed/);
    const active = responses[ids[0]] === 'no' ? ids.slice(0,1) : ids;
    assert.equal(result.summary, active.map(id => summaryCopy[id][responses[id]]).join(' '));
  }
  visit(0, {});
  assert.equal(checked, 15000);
});
test('adverse, uncertain and clear cases retain distinct consequence themes', () => {
  const {ids, buildAnalysis, implicationCopy} = setup();
  const responses = values => Object.fromEntries(ids.map((id,i) => [id, values[i]]));
  const adverse = buildAnalysis(responses(['yes','difficult','some-leaving','no','yes','none-agreed']));
  assert.deepEqual(Array.from(adverse.implications), [implicationCopy.continuity, implicationCopy.arrangements, implicationCopy.payments]);
  const uncertain = buildAnalysis(responses(['unknown','unknown','unknown','unknown','unclear','unknown']));
  assert.deepEqual(Array.from(uncertain.implications), [implicationCopy.dependenceUnknown, implicationCopy.arrangements, implicationCopy.paymentsUnknown]);
  const clear = buildAnalysis(responses(['partly','easy','all-staying','yes','no','not-needed']));
  assert.deepEqual(Array.from(clear.implications), [implicationCopy.clear]);
  const inconsistent = buildAnalysis(responses(['yes','difficult','some-leaving','no','no','not-needed']));
  assert.ok(inconsistent.implications.includes(implicationCopy.reassess));
});
test('cleared answers restore standby and report matches the completed analysis', () => {
  const {context, ids, buildAnalysis, card, getReport} = setup();
  context.answers = Object.fromEntries(ids.map((id,i) => [id, ['yes','manageable','some-undecided','partly','unclear','some-outstanding'][i]]));
  const result = buildAnalysis(context.answers);
  context.renderLogic(employee);
  assert.ok(card.innerHTML.includes(result.summary));
  context.exportReport();
  assert.ok(getReport().includes(result.summary));
  result.implications.forEach(text => assert.ok(getReport().includes(text)));
  context.answers = {};
  context.renderLogic(employee);
  assert.match(card.innerHTML, /Answer all relevant questions/);
  assert.doesNotMatch(card.innerHTML, /Key deal implications/);
});
