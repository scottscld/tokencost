// app.js — TokenCost.ai application logic

const state = {
  selectedModel: null,
  promptTokens: 0,
  answerTokens: 0,
  emailSubmitted: false,
};

const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbyRYucODMQokSM2J-wPMwIi6Y9QBbaeFRDSGBnDKtvt3rltgfLOGCjETMgMM0ko6C9SyA/exec';

function onCalcChange() {
  const modelName  = document.getElementById('calc-model').value;
  const promptText = document.getElementById('calc-prompt').value;
  const answerText = document.getElementById('calc-answer').value;

  state.promptTokens = Math.round(promptText.length / 4);
  // Only update answerTokens from textarea if no chip is selected
  const activeChip = document.querySelector('.answer-chip.active');
  if (!activeChip) {
    state.answerTokens = Math.round(answerText.length / 4);
  }

  const pWords = promptText.trim() ? promptText.trim().split(/\s+/).length : 0;
  const aWords = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  document.getElementById('prompt-token-count').textContent = state.promptTokens.toLocaleString() + ' tokens';
  document.getElementById('prompt-word-count').textContent  = pWords.toLocaleString() + ' words';
  document.getElementById('answer-token-count').textContent = state.answerTokens.toLocaleString() + ' tokens';
  document.getElementById('answer-word-count').textContent  = aWords.toLocaleString() + ' words';

  if (modelName) {
    state.selectedModel = MODELS.find(m => m.name === modelName);
    if (state.selectedModel) {
      const badge = document.getElementById('model-price-badge');
      badge.style.display = 'inline-flex';
      badge.innerHTML =
        '<div class="mpb-item"><span class="mpb-val">$' + state.selectedModel.input.toFixed(2) + '</span><span class="mpb-lbl">per 1M input tokens</span></div>' +
        '<span class="mpb-sep">|</span>' +
        '<div class="mpb-item"><span class="mpb-val">$' + state.selectedModel.output.toFixed(2) + '</span><span class="mpb-lbl">per 1M output tokens</span></div>';
    }
  }

  const btn  = document.getElementById('calc-btn');
  const note = document.getElementById('calc-cta-note');
  const hasAnswer = state.answerTokens > 0 || !!document.querySelector('.answer-chip.active');
  const ready = !!modelName && (state.promptTokens > 0 || hasAnswer);
  btn.disabled = !ready;

  if (!modelName) {
    note.textContent = 'Select a model above to get started';
  } else if (state.promptTokens === 0 && !hasAnswer) {
    note.textContent = 'Enter your question or pick an answer length above';
  } else {
    const single = costCalcDirect(state.promptTokens, state.answerTokens, state.selectedModel);
    note.textContent = 'This single exchange \u2248 ' + formatCost(single) + ' \u00b7 Free. No credit card.';
  }
}

function setAnswerChip(btn) {
  document.querySelectorAll('.answer-chip').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  state.answerTokens = parseInt(btn.dataset.tokens);
  document.getElementById('calc-answer').value = '';
  document.getElementById('answer-token-count').textContent = state.answerTokens.toLocaleString() + ' tokens';
  document.getElementById('answer-word-count').textContent  = Math.round(state.answerTokens * 0.75).toLocaleString() + ' words (est.)';
  onCalcChange();
}

function showEmailModal() {
  if (state.emailSubmitted) {
    calculateAndShow();
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  document.getElementById('email-modal').classList.add('open');
  setTimeout(function(){ document.getElementById('modal-email').focus(); }, 100);
}

function closeModal() {
  document.getElementById('email-modal').classList.remove('open');
  document.getElementById('modal-error').style.display = 'none';
  document.getElementById('modal-email').classList.remove('invalid');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('email-modal')) closeModal();
}

function submitModalEmail() {
  var emailInput = document.getElementById('modal-email');
  var email = emailInput.value.trim();
  var errEl = document.getElementById('modal-error');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.style.display = 'block';
    emailInput.classList.add('invalid');
    emailInput.focus();
    return;
  }
  errEl.style.display = 'none';
  emailInput.classList.remove('invalid');
  logToSheets(email);
  state.emailSubmitted = true;
  closeModal();
  calculateAndShow();
  setTimeout(function(){ document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' }); }, 150);
  showToast('Results unlocked! Scroll down to see your breakdown.', 'success');
}

function logToSheets(email) {
  var payload = {
    email: email,
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    model: state.selectedModel ? state.selectedModel.name : 'unknown',
    promptTokens: state.promptTokens,
    answerTokens: state.answerTokens,
  };
  fetch(SHEETS_WEBHOOK, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(function(err){ console.warn('[TokenCost] Sheets log failed:', err); });
}

function calculateAndShow() {
  var model = state.selectedModel;
  if (!model) return;

  var promptTok = state.promptTokens;
  var answerTok = state.answerTokens > 0 ? state.answerTokens
    : Math.round(document.getElementById('calc-answer').value.length / 4);

  var single = costCalcDirect(promptTok, answerTok, model);

  document.getElementById('res-daily').textContent   = formatCost(single);
  document.getElementById('res-monthly').textContent = formatCost(single * 100);
  document.getElementById('res-yearly').textContent  = formatCost(single * 1000);
  document.getElementById('res-tokens-day').textContent = (promptTok + answerTok).toLocaleString();

  document.querySelector('#results-section .result-card:nth-child(1) .result-label').textContent = 'Per Exchange';
  document.querySelector('#results-section .result-card:nth-child(2) .result-label').textContent = '100 Exchanges';
  document.querySelector('#results-section .result-card:nth-child(3) .result-label').textContent = '1,000 Exchanges';
  document.querySelector('#results-section .result-card:nth-child(4) .result-label').textContent = 'Total Tokens';

  document.getElementById('results-model-note').textContent =
    'Using ' + model.name + ' \u00b7 ' + promptTok.toLocaleString() + ' input tokens + ' + answerTok.toLocaleString() + ' output tokens per exchange. See all models below.';

  var tbody = document.getElementById('table-body');
  var rows = MODELS.map(function(m) {
    return Object.assign({}, m, {
      perExchange: costCalcDirect(promptTok, answerTok, m),
      per100: costCalcDirect(promptTok, answerTok, m) * 100,
    });
  }).sort(function(a, b){ return a.perExchange - b.perExchange; });

  tbody.innerHTML = rows.map(function(m, i) {
    var costColor = i === 0 ? 'var(--success)' : (i === rows.length - 1 ? 'var(--danger)' : 'var(--text)');
    var tag = i === 0 ? '<span class="best-tag">CHEAPEST</span>' : (i === rows.length - 1 ? '<span class="pricey-tag">Most expensive</span>' : '');
    return '<tr class="' + (i === 0 ? 'best-value' : '') + '">' +
      '<td><span class="model-name">' + m.name + '</span></td>' +
      '<td><span style="font-size:0.85rem;color:var(--muted);">' + m.provider + '</span></td>' +
      '<td class="cost-cell" style="color:' + costColor + '">' + formatCost(m.perExchange) + '</td>' +
      '<td class="cost-cell">' + formatCost(m.per100) + '</td>' +
      '<td>' + tag + '</td></tr>';
  }).join('');

  var ths = document.querySelectorAll('.comparison-table th');
  if (ths[2]) ths[2].textContent = 'Per Exchange';
  if (ths[3]) ths[3].textContent = '100 Exchanges';

  document.getElementById('results-section').style.display = 'block';
}

function costCalcDirect(inputTok, outputTok, model) {
  return (inputTok / 1e6) * model.input + (outputTok / 1e6) * model.output;
}

function formatCost(n) {
  if (n < 0.0001) return '<$0.0001';
  if (n < 0.01)   return '$' + n.toFixed(5);
  if (n < 1)      return '$' + n.toFixed(4);
  if (n < 100)    return '$' + n.toFixed(2);
  if (n < 10000)  return '$' + Math.round(n).toLocaleString();
  return '$' + (Math.round(n / 100) / 10).toFixed(1) + 'K';
}

function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

// Token counter
function countTokens() {
  var text   = document.getElementById('token-input').value;
  var chars  = text.length;
  var words  = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  var tokens = Math.round(chars / 4);
  document.getElementById('cnt-tokens').textContent = tokens.toLocaleString();
  document.getElementById('cnt-words').textContent  = words.toLocaleString();
  document.getElementById('cnt-chars').textContent  = chars.toLocaleString();
  var cheap   = (tokens / 1e6) * 3.00;
  var mid     = (tokens / 1e6) * 10.00;
  var premium = (tokens / 1e6) * 75.00;
  document.getElementById('cnt-cost-cheap').textContent   = cheap   < 0.000001 ? '$0.00' : '$' + cheap.toFixed(6);
  document.getElementById('cnt-cost-mid').textContent     = mid     < 0.000001 ? '$0.00' : '$' + mid.toFixed(6);
  document.getElementById('cnt-cost-premium').textContent = premium < 0.000001 ? '$0.00' : '$' + premium.toFixed(6);
}

var EXAMPLE_TEXTS = {
  short: 'Fix this React component: the button isn\'t triggering the onClick event on mobile.\n\nfunction SubmitBtn({ onClick }) {\n  return <button onClick={onClick}>Submit</button>;\n}\n\nI think it might be a touch event issue. How do I fix it?',
  medium: 'You are an expert product manager. I need help writing a product requirements document (PRD) for an AI-powered email summarizer.\n\nThe feature must:\n1. Connect to Gmail and Outlook via OAuth\n2. Categorize emails into: urgent, FYI, newsletters, and spam\n3. Generate a 3-sentence summary per category\n4. Send the digest at a user-defined time each morning\n5. Allow the user to reply to emails directly from the digest\n\nPlease structure the PRD with: Overview, Problem Statement, Goals, Non-Goals, User Stories, Technical Requirements, and Success Metrics.',
  long: 'EXECUTIVE SUMMARY\nYour Q1 2026 digital marketing campaign generated $2.4M in attributed revenue, a 34% YoY improvement. Total spend was $380,000, yielding a blended ROAS of 6.3x. LinkedIn B2B drove 42% of qualified pipeline at a CPL of $187.\n\nEMAIL MARKETING\nYour list of 84,000 subscribers generated 1.2M sends with an average open rate of 28.4%, above the industry average of 21.3%. Click-through rates averaged 3.8%.\n\nPAID SOCIAL\nFacebook and Instagram delivered 18M impressions and 94,000 clicks at a CPC of $1.82. Retargeting ROAS was 11.2x vs. 3.1x for cold audiences.\n\nSEO\nOrganic search delivered 124,000 sessions in Q1, up 18% QoQ. Three target keywords moved into position 1-3.\n\nRECOMMENDATIONS\n1. Increase LinkedIn spend by 40%.\n2. Launch a retargeting campaign for unconverted trial signups.\n3. Build two new SEO content hubs.\n4. Test a 5-day email nurture sequence.'
};

function loadExample(key) {
  document.getElementById('token-input').value = EXAMPLE_TEXTS[key] || '';
  countTokens();
}

function clearCounter() {
  document.getElementById('token-input').value = '';
  countTokens();
}

function toggleNav() {
  document.querySelector('.nav-links').classList.toggle('open');
}

function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || 'success') + ' show';
  setTimeout(function(){ t.className = 'toast'; }, 3500);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});
