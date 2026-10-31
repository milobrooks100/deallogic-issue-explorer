import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../dist/employees.js', import.meta.url), 'utf8');
const issues = JSON.parse(await readFile(new URL('../dist/issues.json', import.meta.url), 'utf8'));
const employee = issues.find(issue => issue.category === 'employees');
function setup() {
  const card = { innerHTML: '', classList: { add() {} } };
  let report;
  const context = vm.createContext({
    answers: {}, current: () => employee, areas: {employees: 'Employees'},
    riskScore: () => 4, renderPanel() {}, renderLogic() { card.innerHTML = 'Existing issue'; },
    exportReport() { report = 'Existing export'; },
    Blob: class { constructor(parts) { report = parts.join(''); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    document: { querySelector: selector => selector === '#logic-card' ? card : null, createElement: () => ({click() {}}) }
  });
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.employeeTest = { fields, ids, visibleIds, normalize }; })();'), context);
  return { context, card, getReport: () => report, ...context.employeeTest };
}
test('progressive reveal stops at unanswered, invalid or confirmed absence', () => {
  const { ids, visibleIds } = setup();
  assert.deepEqual(Array.from(visibleIds({})), [ids[0]]);
  assert.equal(visibleIds({[ids[0]]:'yes'}).length, 2);
  assert.equal(visibleIds({[ids[0]]:'no', [ids[1]]:'difficult'}).length, 1);
  assert.equal(visibleIds({[ids[0]]:'unknown'}).length, 2);
  assert.equal(visibleIds({[ids[0]]:'not-assessed'}).length, 2);
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
  assert.match(card.innerHTML, /Answer all relevant questions/);
  assert.doesNotMatch(card.innerHTML, /Recommended actions|Limitation periods/);
  context.renderLogic({id:'other'});
  assert.equal(card.innerHTML, 'Existing issue');
});
