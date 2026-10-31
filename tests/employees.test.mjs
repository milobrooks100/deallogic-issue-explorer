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
    riskScore: () => 4, riskNames: ['No risk','Low risk','Medium risk','High risk','Very high risk'], renderPanel() {}, renderLogic() { card.innerHTML = 'Existing issue'; },
    exportReport() { report = 'Existing export'; },
    Blob: class { constructor(parts) { report = parts.join(''); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    document: { querySelector: selector => selector === '#logic-card' ? card : null, createElement: () => ({click() {}}) }
  });
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.employeeTest = { fields, ids, visibleIds, normalize, buildAnalysis, summaryCopy, implicationCopy, assessRisk }; })();'), context);
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
  assert.doesNotMatch(getReport(), /Difficult|litigation/i);
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
  assert.equal(checked, 18000);
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

test('all planned departures appear in prose and trigger continuity implications', () => {
  const {ids, buildAnalysis, implicationCopy} = setup();
  const responses = Object.fromEntries(ids.map((id,i) => [id, ['yes','easy','all-leaving','yes','no','all-agreed'][i]]));
  const result = buildAnalysis(responses);
  assert.match(result.summary, /All identified key employees plan to leave the target/);
  assert.ok(result.implications.includes(implicationCopy.continuity));
  assert.ok(!result.implications.includes(implicationCopy.clear));
  responses[ids[5]] = 'not-needed';
  assert.ok(buildAnalysis(responses).implications.includes(implicationCopy.reassess));
});

test('risk matrix matches agreed examples and protected floors', () => {
  const {ids, assessRisk} = setup();
  const score = values => assessRisk(Object.fromEntries(ids.map((id,i) => [id, values[i]])));
  assert.equal(assessRisk({}), 1);
  assert.equal(score(['no']), 1);
  assert.equal(score(['yes','easy','all-staying','yes','no','all-agreed']), 2);
  assert.equal(score(['yes','easy','all-staying','yes','unclear','all-agreed']), 3);
  assert.equal(score(['yes','difficult','some-leaving','yes','no','all-agreed']), 4);
  assert.equal(score(['yes','easy','all-leaving','yes','no','all-agreed']), 3);
  assert.equal(score(['yes','difficult','all-leaving','no','yes','none-agreed']), 5);
  assert.equal(score(['yes','difficult','all-leaving','no','yes','all-agreed']), 4);
  assert.equal(score(['unknown','unknown','unknown','unknown','unclear','unknown']), 3);
  assert.equal(score(['partly','easy','all-staying','yes','no','not-needed']), 2);
  assert.equal(score(['yes','difficult','all-staying','yes','no','all-agreed']), 3);
});
test('all 18000 permutations respect bounds, active answers, floors and the exclusive very-high trigger', () => {
  const {ids, fields, assessRisk, visibleIds} = setup();
  let checked = 0;
  function visit(index, responses) {
    if (index < ids.length) {
      const id = ids[index];
      for (const value of ['', ...fields[id].options.map(pair => pair[0])]) visit(index+1, {...responses,[id]:value});
      return;
    }
    checked++;
    const visible = visibleIds(responses);
    const active = Object.fromEntries(ids.map(id => [id, visible.includes(id) ? responses[id] : '']));
    const score = assessRisk(responses);
    assert.equal(score, assessRisk(active));
    assert.ok(Number.isInteger(score) && score >= 1 && score <= 5);
    const [dependence,replacement,intentions,terms,payments,arrangements] = ids.map(id => active[id]);
    if (!dependence || dependence === 'no') { assert.equal(score,1); return; }
    assert.ok(score >= 2);
    const severe = dependence === 'yes' && replacement === 'difficult' && intentions === 'all-leaving'
      && terms === 'no' && arrangements && arrangements !== 'all-agreed';
    assert.equal(score === 5, Boolean(severe));
    if (replacement === 'unknown' || intentions === 'unknown' || terms === 'unknown'
      || payments === 'unclear' || ['some-outstanding','none-agreed','unknown'].includes(arrangements)) assert.ok(score >= 3);
    if (intentions === 'some-leaving' && replacement === 'difficult') assert.ok(score >= 4);
    if (intentions === 'all-leaving') assert.ok(score >= (replacement === 'easy' ? 3 : 4));
    if (arrangements === 'all-agreed') {
      const without = assessRisk({...responses,[ids[5]]:'some-outstanding'});
      assert.ok(score <= without);
    }
  }
  visit(0,{});
  assert.equal(checked,18000);
});
test('risk recomputes after remediation and matches the exported score', () => {
  const {context, ids, assessRisk, getReport} = setup();
  context.answers = Object.fromEntries(ids.map((id,i) => [id,['yes','difficult','all-leaving','no','yes','none-agreed'][i]]));
  assert.equal(context.riskScore(),5);
  context.exportReport();
  assert.match(getReport(), /Risk score: 5\/5 — Very high risk/);
  context.answers[ids[5]] = 'all-agreed';
  assert.equal(context.riskScore(),4);
  context.answers = {[ids[0]]:'no'};
  assert.equal(context.riskScore(),1);
  context.current = () => ({id:'other'});
  assert.equal(context.riskScore(),4);
});

test('unknown dependence starts at low risk while later concerns retain their floors', () => {
  const {ids, assessRisk} = setup();
  const answers = {[ids[0]]:'unknown'};
  assert.equal(assessRisk(answers),2);
  answers[ids[1]] = 'unknown';
  assert.equal(assessRisk(answers),3);
  assert.equal(assessRisk(Object.fromEntries(ids.map((id,i) => [id,['unknown','easy','all-staying','yes','no','not-needed'][i]]))),2);
});
