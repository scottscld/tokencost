// app.js — TokenCost.ai main application logic

// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  preset: 'chatbot',
  requestsPerDay: 10,
  outputTok: 100,
  emailSubmitted: false,
};

// Google Sheets webhook
const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbyRYucODMQokSM2J-wPMwIi6Y9QBbaeFRDSGBnDKtvt3rltgfLOGCjETMgMM0ko6C9SyA/exec';

// ─── SELECTION HANDLERS ───────────────────────────────────────────────────────
function selectUseCase(btn) {
  document.querySelectorAll('.use-case-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.preset = btn.dataset.preset;
}

function selectFreq(btn) {
  document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.requestsPerDay = parseInt(btn.dataset.requests);
}

function selectLength(btn) {
  document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.outputTok = parseInt(btn.dataset.output);
}

// ─── EMAIL MODAL ──────────────────────────────────────────────────────────────
function showEmailModal() {
  if (state.emailSubmitted) {
    // Already unlocked — just scroll to results and recalculate
    calculateAndShow();
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  document.getElementById('email-modal').classList.add('open');
  setTimeout(() => document.getElementById('modal-email').focus(), 100);
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
  const emailInput = document.getElementById('modal-email');
  const email = emailInput.value.trim();
  const errEl = document.getElementById('modal-error');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.style.display = 'block';
    emailInput.classList.add('invalid');
    emailInput.focus();
    return;
  }

  errEl.style.display = 'none';
  emailInput.classList.remove('invalid');

  // Log to Google Sheets
  logToSheets(email);

  // Mark as submitted
  state.emailSubmitted = true;

  // Close modal
  closeModal();

  // Show results
  calculateAndShow();

  // Scroll to results
  setTimeout(() => {
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
  }, 150);

  showToast('Results unlocked! Scroll down to see your breakdown.', 'success');
}

// ─── GOOGLE SHEETS LOGGING ────────────────────────────────────────────────────
function logToSheets(email) {
  const payload = {
    email: email,
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preset: state.preset,
    requestsPerDay: state.requestsPerDay,
  };

  fetch(SHEETS_WEBHOOK, {
    method: 'POST',
    mode: 'no-cors', // Google Apps Script requires no-cors
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(err => {
    // Silent fail — don't block the user if Sheets is down
    console.warn('[TokenCost] Sheets log failed:', err);
  });
}

// ─── CALCULATE & RENDER ───────────────────────────────────────────────────────
function calculateAndShow() {
  const preset = PRESETS[state.preset] || PRESETS.chatbot;
  const inputTok = preset.inputTok;
  const outputTok = state.outputTok;
  const requests = state.requestsPerDay;
  const DAYS = 30;

  // Daily totals
  const totalInputDay  = requests * inputTok;
  const totalOutputDay = requests * outputTok;
  const totalTokDay    = totalInputDay + totalOutputDay;

  // Reference model: Claude Sonnet (mid-tier, recognizable)
  const ref = MODELS.find(m => m.name === 'Claude Sonnet 4.6') || MODELS[0];
  const dailyCost   = costCalc(totalInputDay, totalOutputDay, ref);
  const monthlyCost = dailyCost * DAYS;
  const yearlyCost  = monthlyCost * 12;

  // Update summary cards
  document.getElementById('res-daily').textContent   = formatCost(dailyCost);
  document.getElementById('res-monthly').textContent = formatCost(monthlyCost);
  document.getElementById('res-yearly').textContent  = formatCost(yearlyCost);
  document.getElementById('res-tokens-day').textContent = fmtNum(totalTokDay);

  // Context note
  const presetNames = { chatbot:'Chatbot / Q&A', coding:'Coding Assistant', content:'Writing & Content', rag:'Document Analysis', agent:'AI Agent', image:'Exploring' };
  document.getElementById('results-model-note').textContent =
    `Showing costs for: ${presetNames[state.preset] || state.preset} · ${fmtNum(requests)} requests/day · ~${fmtNum(outputTok)}-token responses. Reference model: Claude Sonnet 4.6. See full table below for all models.`;

  // Build comparison table
  const tbody = document.getElementById('table-body');
  const rows = MODELS.map(m => ({
    ...m,
    daily:   costCalc(totalInputDay, totalOutputDay, m),
    monthly: costCalc(totalInputDay, totalOutputDay, m) * DAYS,
  })).sort((a, b) => a.monthly - b.monthly);

  tbody.innerHTML = rows.map((m, i) => `
    <tr class="${i === 0 ? 'best-value' : ''}">
      <td><span class="model-name">${m.name}</span></td>
      <td><span style="font-size:0.85rem;color:var(--muted);">${m.provider}</span></td>
      <td class="cost-cell" style="color:${i === 0 ? 'var(--success)' : i === rows.length - 1 ? 'var(--danger)' : 'var(--text)'}">
        ${formatCost(m.monthly)}
      </td>
      <td class="cost-cell">${formatCost(m.daily)}</td>
      <td>
        ${i === 0 ? '<span class="best-tag">CHEAPEST</span>' : ''}
        ${i === rows.length - 1 ? '<span class="pricey-tag">Most expensive</span>' : ''}
      </td>
    </tr>
  `).join('');

  // Show section
  const resultsSection = document.getElementById('results-section');
  resultsSection.style.display = 'block';
}

function costCalc(inputTok, outputTok, model) {
  return (inputTok / 1e6) * model.input + (outputTok / 1e6) * model.output;
}

function formatCost(n) {
  if (n < 0.0001) return '<$0.0001';
  if (n < 0.01)   return '$' + n.toFixed(4);
  if (n < 1)      return '$' + n.toFixed(3);
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

// ─── TOKEN COUNTER ────────────────────────────────────────────────────────────
function countTokens() {
  const text  = document.getElementById('token-input').value;
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const tokens = Math.round(chars / 4);

  document.getElementById('cnt-tokens').textContent = tokens.toLocaleString();
  document.getElementById('cnt-words').textContent  = words.toLocaleString();
  document.getElementById('cnt-chars').textContent  = chars.toLocaleString();

  // Cost as output tokens (higher, more conservative estimate)
  const cheap   = (tokens / 1e6) * 3.00;
  const mid     = (tokens / 1e6) * 10.00;
  const premium = (tokens / 1e6) * 75.00;

  document.getElementById('cnt-cost-cheap').textContent   = cheap   < 0.000001 ? '$0.00' : '$' + cheap.toFixed(6);
  document.getElementById('cnt-cost-mid').textContent     = mid     < 0.000001 ? '$0.00' : '$' + mid.toFixed(6);
  document.getElementById('cnt-cost-premium').textContent = premium < 0.000001 ? '$0.00' : '$' + premium.toFixed(6);
}

const EXAMPLE_TEXTS = {
  short: `Fix this React component: the button isn't triggering the onClick event on mobile. Here's the code:

function SubmitBtn({ onClick }) {
  return <button onClick={onClick}>Submit</button>;
}

I think it might be a touch event issue. How do I fix it?`,

  medium: `You are an expert product manager. I need help writing a product requirements document (PRD) for a new feature: an AI-powered email summarizer that reads a user's inbox and generates a daily digest.

The feature must:
1. Connect to Gmail and Outlook via OAuth
2. Categorize emails into: urgent, FYI, newsletters, and spam
3. Generate a 3-sentence summary per category
4. Send the digest at a user-defined time each morning
5. Allow the user to reply to emails directly from the digest

Please structure the PRD with sections for: Overview, Problem Statement, Goals, Non-Goals, User Stories, Technical Requirements, and Success Metrics.`,

  long: `EXECUTIVE SUMMARY
Your Q1 2026 digital marketing campaign generated $2.4M in attributed revenue across all channels, representing a 34% year-over-year improvement. Total spend was $380,000, yielding a blended ROAS of 6.3x. The standout performer was LinkedIn B2B advertising, which drove 42% of qualified pipeline at a CPL of $187 — well below the $250 benchmark. Google Search remained your highest-volume channel but saw margin compression due to increased competitor bidding on branded terms.

EMAIL MARKETING
Your email list of 84,000 subscribers generated 1.2M sends during Q1 with an average open rate of 28.4%, above the industry average of 21.3%. Click-through rates averaged 3.8%. Your nurture sequence for trial signups achieved a 22% conversion to paid plan within 30 days, up from 18% in Q4 2025.

PAID SOCIAL
Facebook and Instagram combined delivered 18M impressions and 94,000 clicks at an average CPC of $1.82. Retargeting audiences significantly outperformed cold audiences: retargeting ROAS was 11.2x vs. 3.1x for cold. Video ads with a 6-second hook outperformed static images by 67% on engagement rate.

SEO & ORGANIC
Organic search delivered 124,000 sessions in Q1, up 18% QoQ. Your top 5 landing pages account for 61% of organic traffic. Domain authority increased from 42 to 47. Three target keywords moved into position 1–3: "ai email assistant" (1.2M monthly searches), "email summarizer tool" (320K), and "inbox zero app" (87K).

RECOMMENDATIONS
1. Increase LinkedIn spend by 40% — it is your most efficient pipeline channel.
2. Launch a retargeting campaign on Meta for trial signups who did not convert within 7 days.
3. Build two new SEO content hubs targeting "email automation" and "inbox management" to capture adjacent traffic.
4. Test a 5-day email nurture sequence against your current 14-day sequence.`
};

function loadExample(key) {
  document.getElementById('token-input').value = EXAMPLE_TEXTS[key] || '';
  countTokens();
}

function clearCounter() {
  document.getElementById('token-input').value = '';
  countTokens();
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function toggleNav() {
  document.querySelector('.nav-links').classList.toggle('open');
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ─── KEYBOARD: close modal on Escape ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
