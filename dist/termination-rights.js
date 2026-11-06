/* Material Contracts questionnaire using the existing Change-of-Control presentation. */
(() => {
  const issueId = "termination-rights-and-material-breaches";
  const isTermination = issue => issue?.id === issueId;
  const escape = escapeLogicText;
  const fields = {
  "contract-termination-issue": {
    "options": [
      [
        "yes",
        "Yes"
      ],
      [
        "suspected",
        "Suspected"
      ],
      [
        "no",
        "No"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Review key customer, supplier and other commercial contracts, performance records and correspondence. Include breaches by either party and rights allowing the counterparty to terminate without a breach. Transaction-triggered change-of-control provisions are covered separately."
  },
  "contract-termination-type": {
    "options": [
      [
        "breach",
        "Breach"
      ],
      [
        "termination-right",
        "Termination right"
      ],
      [
        "both",
        "Both"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Select Breach for an actual or suspected failure to meet contractual obligations. Select Termination right where the counterparty has, or may have, a right to end the contract. Select Both where both apply, including termination rights arising from a breach."
  },
  "contract-termination-stage": {
    "options": [
      [
        "no-notice",
        "No formal notice"
      ],
      [
        "breach-notice",
        "Breach notice received"
      ],
      [
        "termination-notice",
        "Termination notice received"
      ],
      [
        "ended",
        "Contract ended"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Check notices, correspondence, effective dates and any deadline to remedy a breach or respond. Where more than one answer applies, select the furthest stage reached. No formal notice does not establish that the contract is secure."
  },
  "contract-termination-impact": {
    "options": [
      [
        "minimal",
        "Minimal"
      ],
      [
        "manageable",
        "Manageable"
      ],
      [
        "significant",
        "Significant"
      ],
      [
        "fundamental",
        "Fundamental"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Consider lost revenue, replacement costs, potential liabilities, business disruption and the effect on valuation or completion. Assess the consequences of both the breach and any loss of the contract."
  },
  "contract-termination-resolution": {
    "options": [
      [
        "addressed",
        "Already addressed"
      ],
      [
        "yes",
        "Yes"
      ],
      [
        "partly",
        "Partly"
      ],
      [
        "no",
        "No"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Check whether any necessary cure, waiver, settlement, continued supply or replacement arrangements can be put in place before completion. Select Already addressed only where the arrangements are effective and any remaining consequences have been addressed."
  }
};
  const ids = Object.keys(fields);
  const valid = (id, value) => fields[id].options.some(([key]) => key === value);
  function visibleIds(state) {
    const visible = [];
    for (const id of ids) {
      visible.push(id);
      if (!valid(id, state[id]) || (id === ids[0] && state[id] === "no")) break;
    }
    return visible;
  }
  function normalize(state) {
    const visible = visibleIds(state);
    Object.keys(state).forEach(id => {
      if (!visible.includes(id) || !valid(id, state[id])) delete state[id];
    });
  }
  function questionMarkup({id, question}) {
    const field = fields[id];
    return `<div class="question"><div class="question-top"><label for="${id}">${escape(question)}</label><button class="info" type="button" aria-label="Guidance: ${escape(question)}">i<span class="tooltip" id="${id}-guidance" role="tooltip">${escape(field.guidance)}</span></button></div><select id="${id}" aria-describedby="${id}-guidance"><option value="" ${!answers[id] ? "selected" : ""}>Unanswered</option>${field.options.map(([value, label]) => `<option value="${value}" ${answers[id] === value ? "selected" : ""}>${escape(label)}</option>`).join("")}</select></div>`;
  }
  // Recompute from reachable answers; ordinary adjustments cap at 4 before floors.
  function assessRisk(state) {
    const visible = visibleIds(state);
    const active = id => visible.includes(id) && valid(id, state[id]) ? state[id] : undefined;
    const [existence, type, stage, impact, resolution] = ids.map(active);
    if (!existence || existence === "no") return 1;
    let score = existence === "yes" ? 3 : existence === "suspected" ? 2 : 1;
    let floor = existence === "unknown" ? 1 : 2;
    const atLeast = value => { floor = Math.max(floor, value); };
    // Type does not add points: a breach and its termination right may be one issue.
    if (stage === "breach-notice") { score += 1; atLeast(3); }
    if (["termination-notice", "ended"].includes(stage)) { score += 1; atLeast(4); }
    if (impact === "minimal") score -= 1;
    if (impact === "significant") atLeast(4);
    if (impact === "fundamental") atLeast(5);
    if (resolution === "addressed") {
      atLeast(2);
      if ([type, stage, impact].every(value => value && value !== "unknown")) score -= 1;
    }
    if (resolution === "partly") atLeast(3);
    if (resolution === "no") { score += 1; atLeast(3); }
    return Math.max(floor, Math.min(4, Math.max(1, score)));
  }
  const summaryCopy = {
    existence: {
      yes: "A breach or termination risk has been identified under a material contract.",
      suspected: "A breach or termination risk is suspected under a material contract, but has not been confirmed.",
      unknown: "It is unclear whether a material contract is affected by a breach or termination risk."
    },
    type: {
      breach: "The recorded concern relates to a breach.",
      "termination-right": "The recorded concern relates to a counterparty termination right.",
      both: "The recorded concern relates to both a breach and a counterparty termination right.",
      unknown: "The nature of the concern is unknown."
    },
    stage: {
      "no-notice": "No formal notice has been reported.",
      "breach-notice": "A breach notice has been received.",
      "termination-notice": "A termination notice has been received.",
      ended: "The contract has ended.",
      unknown: "The stage reached is unknown."
    },
    impact: {
      minimal: "The likely impact on the target or deal is assessed as minimal.",
      manageable: "The likely impact on the target or deal is assessed as manageable.",
      significant: "The likely impact on the target or deal is assessed as significant.",
      fundamental: "The likely impact on the target or deal is assessed as fundamental.",
      unknown: "The likely impact on the target or deal is unknown."
    },
    resolution: {
      addressed: "The issue and its consequences are reported to have been addressed.",
      yes: "The issue and its consequences are expected to be capable of being addressed before completion.",
      partly: "The issue and its consequences can only partly be addressed before completion.",
      no: "The issue and its consequences cannot be addressed before completion.",
      unknown: "It is unclear whether the issue and its consequences can be addressed before completion."
    }
  };
  const implicationCopy = {
    absent: "No specific completion protection is indicated by these answers; wider contract compliance remains unconfirmed.",
    fundamental: "The issue may undermine the deal; reassess whether it can proceed and on what terms.",
    significant: "The issue may materially affect operations or value; reflect the exposure in the deal terms.",
    uncertain: "Clarify the issue and its impact before agreeing how the deal risk is allocated.",
    ended: "Contract continuity has been lost; assess replacement arrangements and any remaining exposure.",
    termination: "Contract continuity is at risk; confirm the termination timetable and available alternatives.",
    breach: "The breach notice may create time-sensitive dependencies; confirm response and cure deadlines.",
    stageUnknown: "Confirm the contract’s current status and any deadlines affecting completion.",
    outstanding: "Allocate responsibility and costs for unresolved matters continuing after completion.",
    planned: "The completion timetable depends on the planned remedial or replacement arrangements being delivered.",
    readinessUnknown: "Confirm the resolution timetable before deciding whether the target is ready for completion.",
    residualImpact: "Reconcile the reported resolution with the continuing impact before treating the exposure as closed.",
    addressed: "Confirm the resolution is effective and covers any remaining liabilities or continuity needs."
  };
  function buildAnalysis(state) {
    const visible = visibleIds(state);
    if (!visible.every(id => valid(id, state[id]))) return null;
    const [existence, type, stage, impact, resolution] = ids.map(id => state[id]);
    if (existence === "no") return {
      summary: "No breach or termination risk has been identified under a material contract on the recorded assessment. This does not confirm wider contract compliance or the absence of other contractual risks.",
      implications: [implicationCopy.absent]
    };
    const summary = [summaryCopy.existence[existence], summaryCopy.type[type], summaryCopy.stage[stage], summaryCopy.impact[impact], summaryCopy.resolution[resolution]].join(" ");
    // One statement per theme, with explicit precedence rather than truncation.
    const implications = [];
    if (impact === "fundamental") implications.push(implicationCopy.fundamental);
    else if (impact === "significant") implications.push(implicationCopy.significant);
    else if (existence !== "yes" || type === "unknown" || impact === "unknown") implications.push(implicationCopy.uncertain);

    if (stage === "ended") implications.push(implicationCopy.ended);
    else if (stage === "termination-notice") implications.push(implicationCopy.termination);
    else if (stage === "breach-notice") implications.push(implicationCopy.breach);
    else if (stage === "unknown") implications.push(implicationCopy.stageUnknown);

    if (["partly", "no"].includes(resolution)) implications.push(implicationCopy.outstanding);
    else if (resolution === "yes") implications.push(implicationCopy.planned);
    else if (resolution === "unknown") implications.push(implicationCopy.readinessUnknown);
    else if (["significant", "fundamental"].includes(impact)) implications.push(implicationCopy.residualImpact);
    else implications.push(implicationCopy.addressed);
    return {summary, implications};
  }
  const tieOrder = ['TR02','TR11','TR01','TR03','TR04','TR08','TR07','TR06','TR05','TR09','TR10'];
  function chooseActions(state, perspective) {
    if (!visibleIds(state).every(id => valid(id,state[id]))) return [];
    const [exist,type,stage,impact,resolution] = ids.map(id => state[id]);
    if (exist === 'no') return [];
    const side = ['Buyer','Seller'].includes(perspective) ? perspective : 'Balanced';
    const buyer = side === 'Buyer', seller = side === 'Seller';
    const notice = ['breach-notice','termination-notice'].includes(stage);
    const ended = stage === 'ended', threatened = ended || stage === 'termination-notice';
    const identified = exist === 'yes' || notice || ended;
    const open = resolution !== 'addressed', serious = ['significant','fundamental'].includes(impact);
    const outstanding = ['partly','no'].includes(resolution);
    const req='Required', rec='Recommended', opt='Consider';
    const result=[];
    const registry=window.DealLogicActionRegistry;
    function add(id,priority,title,description) {
      const action=registry.forSide(registry.actionFor(issueId,'','',id),side);
      result.push({...action,priority,title:title||action.title,description:description||action.description});
    }
    const drill = !seller && exist==='yes' && type!=='unknown' && threatened && (impact==='unknown'||resolution==='unknown');
    add('TR01',exist!=='yes'||[type,stage,impact].includes('unknown')?req:rec,
      drill && 'Test the first day without the contract',drill && (ended
        ? 'Ask the business owner what actually stopped, who was affected and how the fallback performed; identify any remaining gaps.'
        : 'Ask the business owner what would stop on day one, who would be affected and whether the fallback would work in time.'));
    if (open && (notice||ended)) add('TR02',req,ended && 'Review the termination and surviving obligations',ended && 'Check termination validity, surviving obligations and claim deadlines, and preserve evidence of the parties’ performance.');
    if (identified && open) {
      const pause=!buyer && notice && serious && outstanding;
      const title=pause?'Agree a pause with the counterparty':ended?'Secure replacement or reinstatement':null;
      const description=pause?'If the contract is still live, seek written agreement on which steps the counterparty will pause, until when, and what each party must do meanwhile.'
        :ended?({Buyer:'Require evidence of effective reinstatement or a workable replacement before relying on future contract value.',Seller:'Negotiate reinstatement or replacement while controlling costs and concessions.',Balanced:'Agree an effective reinstatement or replacement and allocate responsibility for delivery and costs.'})[side]:null;
      add('TR03',serious||threatened?req:rec,title,description);
    }
    if (!open) add('TR04',buyer||serious||[type,stage,impact].includes('unknown')?req:rec,null,serious && 'Verify the resolution and reconcile the continuing impact before treating the exposure as closed.');
    if (impact!=='minimal') add('TR05',rec);
    add('TR06',identified?(buyer?rec:req):(buyer?opt:rec));
    if (identified && open) add('TR07',rec);
    if (open && serious) add('TR08',buyer?req:seller?opt:rec);
    else if (open && threatened && ['manageable','unknown'].includes(impact)) add('TR08',buyer?rec:opt);
    if (identified && open && serious) add('TR09',seller?opt:rec);
    else if (identified && impact==='manageable' && (outstanding||resolution==='unknown')) add('TR09',opt);
    if (identified && serious) add('TR10',rec);
    else if (identified && impact==='manageable' && outstanding) add('TR10',opt);
    if (impact==='fundamental') add('TR11',req);
    const rank={Required:0,Recommended:1,Consider:2};
    return result.sort((a,b)=>rank[a.priority]-rank[b.priority] || tieOrder.indexOf(a.id)-tieOrder.indexOf(b.id)).slice(0,7);
  }
  const actionsMarkup = actions => actions.length ? actions.map(action => `<div class="logic-action" data-action-id="${action.id}"><span class="logic-icon" aria-hidden="true"></span><div><span class="logic-priority" data-level="${action.priority.toLowerCase()}">${action.priority}</span><strong>${escape(action.title)}</strong><span>${escape(action.description)}</span></div></div>`).join("") : `<p>No issue-specific actions are indicated by the recorded answer.</p>`;
  const previousRiskScore = riskScore;
  riskScore = function () { return isTermination(current()) ? assessRisk(answers) : previousRiskScore(); };
  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isTermination(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    card.classList.add("coc-deal-logic");
    const analysis = buildAnalysis(answers);
    const side = getTransactionSide();
    if (!analysis) {
      card.classList.add("logic-standby");
      card.innerHTML = '<h3>Apply deal logic</h3><p>Answer all relevant questions to generate your deal analysis.</p>';
      document.dispatchEvent(new CustomEvent("termination-rights-logic-rendered"));
      return;
    }
    card.classList.remove("logic-standby");
    card.innerHTML = `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${escape(analysis.summary)}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${analysis.implications.map(text => `<li>${escape(text)}</li>`).join("")}</ul></section><section class="logic-section"><div class="logic-section-heading"><h4>Recommended actions</h4><div class="logic-side-picker" aria-label="Transaction side selector"><button type="button" class="active" data-logic-side-toggle>${escape(side)}</button></div></div>${actionsMarkup(chooseActions(answers, side))}</section>`;
    document.dispatchEvent(new CustomEvent("termination-rights-logic-rendered"));
  };
  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    if (isTermination(current())) {
      const previous = JSON.stringify(answers);
      normalize(answers);
      if (JSON.stringify(answers) !== previous) DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
    }
    previousRenderPanel();
    const issue = current();
    if (!isTermination(issue)) return;
    const card = document.querySelector(".content-grid > .card");
    if (!card) return;
    const heading = card.querySelector("h3");
    card.replaceChildren(heading);
    const visible = visibleIds(answers);
    card.insertAdjacentHTML("beforeend", issue.key_questions.filter(question => visible.includes(question.id)).map(questionMarkup).join(""));
    visible.forEach(id => {
      document.getElementById(id).onchange = event => {
        answers[id] = event.target.value;
        ids.slice(ids.indexOf(id) + 1).forEach(next => delete answers[next]);
        normalize(answers);
        DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
        renderPanel();
        document.getElementById(id)?.focus();
      };
    });
  };
  const previousExportReport = exportReport;
  exportReport = function () {
    const issue = current();
    if (!isTermination(issue)) return previousExportReport();
    normalize(answers);
    const visible = visibleIds(answers);
    const lines = issue.key_questions.filter(question => visible.includes(question.id)).map(({id, question}) => `- ${question}\n  Response: ${fields[id].options.find(([value]) => value === answers[id])?.[1] || "Unanswered"}`);
    const analysis = buildAnalysis(answers);
    const analysisLines = analysis ? ["", "SUMMARY", analysis.summary, "", "KEY DEAL IMPLICATIONS", ...analysis.implications.map(text => `- ${text}`)] : [];
    const selected = analysis ? chooseActions(answers, getTransactionSide()) : [];
    const actionLines = analysis ? ["", `RECOMMENDED ACTIONS — ${getTransactionSide()}`, ...(selected.length ? selected.map(action => `- ${action.priority}: ${action.title}\n  ${action.description}`) : ["No issue-specific actions are indicated by the recorded answer."])] : [];
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, `Risk score: ${assessRisk(answers)}/5 — ${riskNames[assessRisk(answers) - 1]}`, "", "DILIGENCE ANSWERS", ...lines, ...analysisLines, ...actionLines, "", "NOTE", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], {type: "text/plain"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue.id}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
})();
