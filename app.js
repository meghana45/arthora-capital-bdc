const state = {
  screen: 0,
  purpose: 'Working capital',
  requestedAmount: 800000,
  vintage: 48,
  incomeProfile: 'steady',
  monthlyRevenue: 350000,
  existingEmi: 18000,
  digitalShare: 70,
  itr: 'yes',
  gst: 'yes',
  tenure: 36,
  checkedDocs: new Set(['identity']),
  uploads: new Set(),
  eligibilityStatus: 'positive',
  accountCreated: false,
  loggedIn: false,
  applicationSubmitted: false,
  accountName: 'Aarohi Mehta',
  accountMobile: '9876543210',
  accountEmail: 'aarohi@studio.in',
  appStep: 1
};

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(value));
const screens = [...document.querySelectorAll('.screen')];
const journeyItems = [...document.querySelectorAll('#stepList li')];
const stepNames = ['Discover', 'Understand', 'Prepare', 'Decide', 'Apply'];
const input = id => document.getElementById(id);
const profileLabels = { steady: 'steady', seasonal: 'seasonal', mixed: 'mixed-payment', project: 'project-based' };

function goTo(screen) {
  if (screen === 3) renderDocuments();
  if (screen === 4) renderOffer();
  if (screen === 5) {
    if (getEligibility().status !== 'positive') screen = 2;
    else renderCompletion();
  }
  if (screen === 6) renderSignup();
  if (screen === 7) renderApplication();
  if (screen === 8) renderDashboard();

  state.screen = screen;
  document.body.classList.toggle('intro-active', screen === 0);
  document.body.classList.toggle('account-mode', screen >= 6);
  screens.forEach(el => el.classList.toggle('active', Number(el.dataset.screen) === screen));

  const progressIndex = Math.min(screen, 4);
  journeyItems.forEach((el, i) => {
    el.classList.toggle('active', i === progressIndex);
    el.classList.toggle('done', i < progressIndex);
  });
  input('mobileStep').textContent = `Step ${progressIndex + 1} of 5`;
  input('mobileLabel').textContent = stepNames[progressIndex];
  input('progressFill').style.width = `${(progressIndex + 1) * 20}%`;
  updateAccountActions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', event => {
  const next = event.target.closest('[data-next]');
  const back = event.target.closest('[data-back]');
  const appNext = event.target.closest('[data-app-next]');
  if (next) goTo(Number(next.dataset.next));
  if (back) goTo(Number(back.dataset.back));
  if (appNext) showApplicationStep(Number(appNext.dataset.appNext));
});

document.querySelectorAll('[data-choice]').forEach(group => {
  group.addEventListener('click', event => {
    const choice = event.target.closest('.choice');
    if (!choice) return;
    group.querySelectorAll('.choice').forEach(el => el.classList.remove('selected'));
    choice.classList.add('selected');
    state[group.dataset.choice] = choice.dataset.value;
    renderIncomeSignal();
  });
});

document.querySelectorAll('[data-toggle]').forEach(group => {
  group.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    group.querySelectorAll('button').forEach(el => el.classList.remove('selected'));
    button.classList.add('selected');
    state[group.dataset.toggle] = button.dataset.value;
    renderIncomeSignal();
  });
});

input('requestedAmount').addEventListener('input', e => state.requestedAmount = Number(e.target.value) || 0);
input('businessVintage').addEventListener('change', e => { state.vintage = Number(e.target.value); renderIncomeSignal(); });
input('monthlyRevenue').addEventListener('input', e => { state.monthlyRevenue = Number(e.target.value) || 0; renderIncomeSignal(); });
input('existingEmi').addEventListener('input', e => { state.existingEmi = Number(e.target.value) || 0; renderIncomeSignal(); });
input('digitalShare').addEventListener('input', e => {
  state.digitalShare = Number(e.target.value);
  input('digitalValue').textContent = `${state.digitalShare}%`;
  renderIncomeSignal();
});
input('tenureRange').addEventListener('input', e => { state.tenure = Number(e.target.value); renderOffer(); });

document.querySelector('.why-toggle').addEventListener('click', e => {
  const card = e.currentTarget.closest('.why-card');
  card.classList.toggle('open');
  const open = card.classList.contains('open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
  e.currentTarget.querySelector('em').textContent = open ? '−' : '＋';
});

function getDocuments() {
  const docs = [
    { id: 'identity', title: 'PAN and identity proof', note: 'Used for KYC only after you choose to apply', tag: 'Required' },
    { id: 'bank', title: 'Last 12 months of bank statements', note: state.incomeProfile === 'seasonal' ? 'A full year helps us see your high and low seasons fairly' : 'Helps confirm cash flow, not just a single month', tag: 'Best evidence' },
    { id: 'itr', title: state.itr === 'yes' ? 'Latest income-tax return' : 'Alternate income evidence', note: state.itr === 'yes' ? 'Business or individual ITR with computation' : 'Invoices, ledger or accountant-certified financials can help', tag: state.itr === 'yes' ? 'Required' : 'Alternative' }
  ];
  if (state.gst === 'yes') docs.push({ id: 'gst', title: 'Recent GSTR-3B returns', note: 'Used to understand sales trends alongside bank credits', tag: 'Strengthens case' });
  else docs.push({ id: 'business', title: 'Business existence proof', note: 'Udyam, shop licence, professional registration or recent invoices', tag: 'Choose one' });
  if (state.incomeProfile === 'project') docs.push({ id: 'contracts', title: 'Recent contracts or invoices', note: 'Helps connect project milestones to incoming payments', tag: 'Recommended' });
  if (state.incomeProfile === 'mixed') docs.push({ id: 'upi', title: 'UPI or payment-platform statement', note: 'Adds digital sales evidence beyond the primary bank account', tag: 'Recommended' });
  return docs;
}

function renderDocuments() {
  input('documentIntro').textContent = `Based on a ${profileLabels[state.incomeProfile]}, ${state.gst === 'yes' ? 'GST-registered' : 'non-GST'} business, these are the most useful documents.`;
  const list = input('documentList');
  const docs = getDocuments();
  list.innerHTML = docs.map(doc => `
    <label class="document-item ${state.checkedDocs.has(doc.id) ? 'checked' : ''}">
      <input type="checkbox" data-doc="${doc.id}" ${state.checkedDocs.has(doc.id) ? 'checked' : ''} />
      <span class="check"></span>
      <span class="document-copy"><strong>${doc.title}</strong><small>${doc.note}</small></span>
      <span class="document-tag">${doc.tag}</span>
    </label>`).join('');
  list.querySelectorAll('input').forEach(box => box.addEventListener('change', e => {
    e.target.checked ? state.checkedDocs.add(e.target.dataset.doc) : state.checkedDocs.delete(e.target.dataset.doc);
    e.target.closest('.document-item').classList.toggle('checked', e.target.checked);
    updateReadiness();
  }));
  updateReadiness();
}

function getReadiness() {
  const docs = getDocuments();
  return docs.filter(doc => state.checkedDocs.has(doc.id)).length / docs.length;
}

function updateReadiness() {
  const score = Math.max(15, Math.round(getReadiness() * 100));
  input('readinessScore').textContent = `${score}%`;
  input('readinessRing').style.setProperty('--score', score);
}

function baseOfferModel() {
  const patternFactor = { steady: 3.0, seasonal: 2.5, mixed: 2.3, project: 2.6 }[state.incomeProfile];
  const vintageFactor = state.vintage < 12 ? .55 : state.vintage < 24 ? .78 : state.vintage < 60 ? 1 : 1.12;
  const evidenceFactor = (state.itr === 'yes' ? 1 : .82) * (state.digitalShare >= 60 ? 1 : state.digitalShare >= 30 ? .9 : .78);
  const obligationFactor = Math.max(.42, 1 - (state.existingEmi / Math.max(state.monthlyRevenue, 1)) * 1.8);
  const rawCapacity = Math.max(0, state.monthlyRevenue * patternFactor * vintageFactor * evidenceFactor * obligationFactor);
  const capacity = Math.max(100000, Math.floor(rawCapacity / 50000) * 50000);
  const amount = Math.min(Math.max(100000, state.requestedAmount), capacity, 5000000);
  let rate = { steady: 17.5, seasonal: 18.7, mixed: 19.2, project: 18.4 }[state.incomeProfile];
  if (state.vintage < 24) rate += 1.1;
  if (state.digitalShare < 50) rate += .7;
  if (state.itr === 'no') rate += .9;
  return { amount, rate, rateHigh: rate + 1.2, capacity, rawCapacity };
}

function getEligibility() {
  const offer = baseOfferModel();
  const readiness = getReadiness();
  const debtRatio = state.existingEmi / Math.max(state.monthlyRevenue, 1);
  const requestedRatio = state.requestedAmount / Math.max(offer.rawCapacity, 1);
  let score = 0;

  score += state.vintage >= 24 ? 2 : state.vintage >= 12 ? 1 : 0;
  score += debtRatio <= .15 ? 2 : debtRatio <= .30 ? 1 : 0;
  score += state.digitalShare >= 60 ? 2 : state.digitalShare >= 30 ? 1 : 0;
  score += state.itr === 'yes' ? 1 : 0;
  score += state.gst === 'yes' ? 1 : 0;
  score += requestedRatio <= 1 ? 2 : requestedRatio <= 1.4 ? 1 : 0;
  score += readiness >= .6 ? 2 : readiness >= .25 ? 1 : 0;

  const critical = state.monthlyRevenue < 50000 || debtRatio > .42 || (state.vintage < 12 && state.itr === 'no' && state.digitalShare < 30) || requestedRatio > 2;
  const status = score >= 7 && !critical ? 'positive' : 'negative';
  const confidence = status === 'positive'
    ? Math.max(62, Math.min(94, Math.round(54 + score * 3 + readiness * 12)))
    : Math.max(28, Math.min(61, Math.round(24 + score * 4 + readiness * 8)));

  const vintageTone = state.vintage >= 24 ? 'positive' : state.vintage >= 12 ? 'review' : 'negative';
  const debtTone = debtRatio <= .15 ? 'positive' : debtRatio <= .30 ? 'review' : 'negative';
  const evidenceTone = state.digitalShare >= 60 || state.itr === 'yes' ? 'positive' : state.digitalShare >= 30 || state.gst === 'yes' ? 'review' : 'negative';
  const amountTone = requestedRatio <= 1 ? 'positive' : requestedRatio <= 1.4 ? 'review' : 'negative';
  const documentTone = readiness >= .6 ? 'positive' : readiness >= .25 ? 'review' : 'negative';

  const signals = [
    {
      tone: vintageTone,
      title: state.vintage >= 24 ? 'Established business track record' : state.vintage >= 12 ? 'Business history is building' : 'Limited operating history',
      note: state.vintage >= 24 ? 'More than two years of continuity is a strong underwriting signal.' : state.vintage >= 12 ? 'One full year helps, but a longer record could improve the offer.' : 'Most business-loan products need at least 12 months of operating history.'
    },
    {
      tone: debtTone,
      title: debtRatio <= .15 ? 'Current repayment load looks comfortable' : debtRatio <= .30 ? 'Existing EMIs need a closer look' : 'High existing repayment load',
      note: debtRatio <= .15 ? `Existing EMIs use about ${Math.round(debtRatio * 100)}% of stated monthly revenue.` : debtRatio <= .30 ? `About ${Math.round(debtRatio * 100)}% of stated revenue already supports EMIs.` : 'Existing EMIs are high relative to stated monthly revenue.'
    },
    {
      tone: evidenceTone,
      title: evidenceTone === 'positive' ? 'Income can be verified' : evidenceTone === 'review' ? 'Some income evidence is available' : 'Income visibility is limited',
      note: state.digitalShare >= 60 ? `${state.digitalShare}% of receipts are digitally visible, supported by ${state.itr === 'yes' ? 'filed tax returns' : 'alternate documents'}.` : state.itr === 'yes' ? 'Filed returns support the profile even though fewer receipts are digitally visible.' : 'More bank, UPI, invoice or tax evidence would improve assessment confidence.'
    },
    {
      tone: amountTone,
      title: amountTone === 'positive' ? 'Requested amount fits estimated capacity' : amountTone === 'review' ? 'A lower amount may fit better' : 'Requested amount is above estimated capacity',
      note: amountTone === 'positive' ? 'The requested amount is supported by the stated revenue and obligations.' : `Based on current inputs, an amount closer to ${money(offer.capacity)} may be more realistic.`
    },
    {
      tone: documentTone,
      title: documentTone === 'positive' ? 'Document path is ready' : documentTone === 'review' ? 'Some documents are ready' : 'Core documents are still missing',
      note: `${Math.round(readiness * 100)}% of the tailored evidence checklist is marked available.`
    }
  ];

  return { ...offer, status, score, confidence, readiness, debtRatio, requestedRatio, signals };
}

function offerModel() {
  return getEligibility();
}

function emi(principal, annualRate, months) {
  const r = annualRate / 1200;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

function signalListMarkup(signals) {
  const icon = { positive: '✓', review: '!', negative: '×' };
  return signals.map(signal => `<li class="signal-${signal.tone}"><span class="reason-icon">${icon[signal.tone]}</span><p><strong>${signal.title}</strong><small>${signal.note}</small></p><em>${signal.tone === 'positive' ? 'Positive' : signal.tone === 'review' ? 'Review' : 'Needs work'}</em></li>`).join('');
}

function renderIncomeSignal() {
  const debtRatio = state.existingEmi / Math.max(state.monthlyRevenue, 1);
  const card = input('liveSignal');
  let tone = 'positive';
  let title = 'Good signal';
  let copy = 'Digital transaction history can help validate revenue even when monthly income changes.';
  if (debtRatio > .30) {
    tone = 'negative';
    title = 'Signal to review';
    copy = 'Existing EMIs are high compared with stated monthly revenue and may reduce eligible capacity.';
  } else if (state.digitalShare < 30 && state.itr === 'no') {
    tone = 'review';
    title = 'More proof could help';
    copy = 'Bank, UPI, invoice or tax evidence can make irregular business income easier to verify.';
  } else if (state.vintage < 12) {
    tone = 'review';
    title = 'Early-stage business';
    copy = 'Most products need at least 12 months of operating history, but your evidence can still be reviewed.';
  }
  card.className = `signal-card signal-${tone}`;
  input('liveSignalIcon').textContent = tone === 'positive' ? '✓' : '!';
  input('liveSignalTitle').textContent = title;
  input('liveSignalCopy').textContent = copy;
}

function renderOffer() {
  const offer = offerModel();
  state.eligibilityStatus = offer.status;
  const isPositive = offer.status === 'positive';
  const monthly = emi(offer.amount, offer.rate, state.tenure);
  const totalInterest = monthly * state.tenure - offer.amount;

  input('resultBanner').classList.toggle('negative', !isPositive);
  input('resultIcon').textContent = isPositive ? '✓' : '!';
  input('resultEyebrow').textContent = isPositive ? 'Your eligibility looks positive' : 'Not eligible to apply right now';
  input('resultTitle').textContent = isPositive ? 'Your business profile shows a strong initial fit.' : 'A few signals need to become stronger first.';
  input('resultCopy').textContent = isPositive ? 'This is an indicative offer—not a final sanction. Review the signals and offer logic before applying.' : 'This is an early eligibility result, not a credit rejection. No bureau enquiry has been made.';
  input('positiveResult').hidden = !isPositive;
  input('negativeResult').hidden = isPositive;

  input('offerAmount').textContent = money(offer.amount);
  input('rateValue').textContent = `${offer.rate.toFixed(1)}%–${offer.rateHigh.toFixed(1)}%`;
  input('tenureValue').textContent = `${state.tenure} months`;
  input('tenureText').textContent = `${state.tenure} months`;
  input('emiValue').textContent = money(monthly);
  input('principalExplain').textContent = money(offer.amount);
  input('interestExplain').textContent = money(totalInterest);
  input('confidenceScore').textContent = offer.confidence;
  input('confidenceLabel').textContent = offer.confidence >= 82 ? 'High application confidence' : 'Promising application confidence';
  input('confidenceCopy').textContent = `${offer.signals.filter(signal => signal.tone === 'positive').length} positive signals support a clear verification path.`;
  input('reasonList').innerHTML = signalListMarkup(offer.signals);
  input('negativeReasonList').innerHTML = signalListMarkup(offer.signals.filter(signal => signal.tone !== 'positive'));
  input('recheckWindow').textContent = state.vintage < 12 ? 'When the business completes 12 months' : 'After 2–3 stronger statement months';

  const resultPrimary = input('resultPrimary');
  resultPrimary.dataset.next = isPositive ? '5' : '2';
  resultPrimary.innerHTML = isPositive ? 'Continue with this offer <span>→</span>' : 'Improve my profile <span>→</span>';
}

function renderCompletion() {
  const offer = offerModel();
  input('finalAmount').textContent = money(offer.amount);
  input('finalRate').textContent = `${offer.rate.toFixed(1)}%–${offer.rateHigh.toFixed(1)}%`;
  input('finalTenure').textContent = `${state.tenure} months`;
  input('finalReadiness').textContent = `${offer.confidence}%`;
}

input('emiExplain').addEventListener('click', () => {
  input('emiExplanation').classList.toggle('open');
  input('emiExplain').querySelector('b').textContent = input('emiExplanation').classList.contains('open') ? '−' : '＋';
});

input('demoButton').addEventListener('click', () => {
  Object.assign(state, { purpose: 'Working capital', requestedAmount: 800000, vintage: 48, incomeProfile: 'steady', monthlyRevenue: 350000, existingEmi: 18000, digitalShare: 70, itr: 'yes', gst: 'yes', tenure: 36 });
  state.checkedDocs = new Set(['identity', 'bank', 'itr', 'gst']);
  goTo(4);
  showToast('Sample business profile loaded');
});

input('restartButton').addEventListener('click', () => goTo(1));
input('submitPrototype').addEventListener('click', () => goTo(6));

function renderSignup() {
  const offer = offerModel();
  input('signupAmount').textContent = money(offer.amount);
  input('signupForm').hidden = false;
  input('verificationForm').hidden = true;
}

input('signupForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!input('accountConsent').checked) return showToast('Please confirm consent to create the prototype account');
  state.accountName = input('accountName').value.trim() || 'Aarohi Mehta';
  state.accountMobile = input('accountMobile').value.trim();
  state.accountEmail = input('accountEmail').value.trim();
  input('applicationName').value = state.accountName;
  input('verificationTarget').textContent = state.accountMobile.replace(/(\d{5})(\d{5})/, '$1 $2');
  input('signupForm').hidden = true;
  input('verificationForm').hidden = false;
  input('signupOtp').focus();
});

input('verificationForm').addEventListener('submit', event => {
  event.preventDefault();
  if (input('signupOtp').value !== '2468') return showToast('Use the prototype code 2468');
  state.accountCreated = true;
  state.loggedIn = true;
  showToast('Account verified — eligibility profile saved');
  goTo(7);
});

input('editSignup').addEventListener('click', () => {
  input('signupForm').hidden = false;
  input('verificationForm').hidden = true;
});
input('signupToLogin').addEventListener('click', () => goTo(9));

function renderApplication() {
  const offer = offerModel();
  input('applicationName').value = state.accountName;
  input('carriedProfile').textContent = `${money(state.monthlyRevenue)} monthly revenue · ${state.vintage >= 60 ? '5+ years' : state.vintage >= 24 ? '2–5 years' : state.vintage >= 12 ? '1–2 years' : 'under 1 year'} in business · ${state.digitalShare}% digital receipts`;
  input('reviewAmount').textContent = money(offer.amount);
  input('reviewPurpose').textContent = state.purpose;
  input('reviewRate').textContent = `${offer.rate.toFixed(1)}%–${offer.rateHigh.toFixed(1)}%`;
  input('reviewTenure').textContent = `${state.tenure} months`;
  showApplicationStep(state.appStep || 1);
  renderUploads();
}

function showApplicationStep(step) {
  state.appStep = step;
  document.querySelectorAll('[data-app-panel]').forEach(panel => panel.classList.toggle('active', Number(panel.dataset.appPanel) === step));
  document.querySelectorAll('[data-app-step]').forEach(button => {
    const buttonStep = Number(button.dataset.appStep);
    button.classList.toggle('active', buttonStep === step);
    button.classList.toggle('done', buttonStep < step);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-app-step]').forEach(button => button.addEventListener('click', () => showApplicationStep(Number(button.dataset.appStep))));

input('uploadList').addEventListener('click', event => {
  const button = event.target.closest('.upload-item');
  if (!button) return;
  const name = button.dataset.upload;
  state.uploads.has(name) ? state.uploads.delete(name) : state.uploads.add(name);
  renderUploads();
});

function renderUploads() {
  document.querySelectorAll('.upload-item').forEach(button => {
    const added = state.uploads.has(button.dataset.upload);
    button.classList.toggle('uploaded', added);
    button.querySelector('.upload-symbol').textContent = added ? '✓' : '＋';
    button.querySelector('b').textContent = added ? 'Added' : 'Add file';
  });
  input('uploadCounter').textContent = `${state.uploads.size} of 3 added`;
}

input('submitApplication').addEventListener('click', () => {
  if (!input('kycConsent').checked || !input('bureauConsent').checked) return showToast('Please confirm both consent items to continue');
  state.applicationSubmitted = true;
  state.loggedIn = true;
  showToast('Prototype application submitted for verification');
  goTo(8);
});

function renderDashboard() {
  const offer = offerModel();
  const monthly = emi(offer.amount, offer.rate, state.tenure);
  const firstName = (state.accountName || 'Aarohi').split(' ')[0];
  input('dashboardFirstName').textContent = firstName;
  input('dashboardAmount').textContent = money(offer.amount);
  input('dashboardEmi').textContent = `${money(monthly)}/month · ${state.tenure} months`;
  const remaining = Math.max(0, 3 - state.uploads.size);
  input('taskTitle').textContent = remaining ? `Add ${remaining} remaining document${remaining === 1 ? '' : 's'}` : 'Documents are ready for verification';
  input('taskCopy').textContent = remaining ? 'Complete the evidence checklist to avoid delays during verification.' : 'Your document set is complete. We’ll notify you when verification moves forward.';
  input('dashboardTask').textContent = remaining ? 'Review documents →' : 'View application →';
}

function updateAccountActions() {
  input('loginButton').hidden = state.loggedIn;
  input('accountButton').hidden = !state.loggedIn;
  input('accountButton').querySelector('span').textContent = (state.accountName || 'AM').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
}

input('homeLink').addEventListener('click', event => { event.preventDefault(); goTo(0); });
input('loginButton').addEventListener('click', () => goTo(9));
input('accountButton').addEventListener('click', () => goTo(8));
input('logoutButton').addEventListener('click', () => {
  state.loggedIn = false;
  updateAccountActions();
  showToast('You have been logged out');
  goTo(9);
});

input('loginForm').addEventListener('submit', event => {
  event.preventDefault();
  if (input('loginOtpWrap').hidden) {
    input('loginOtpWrap').hidden = false;
    input('loginSubmit').innerHTML = 'Verify & log in <span>→</span>';
    input('loginOtp').focus();
    return;
  }
  if (input('loginOtp').value !== '2468') return showToast('Use the prototype code 2468');
  state.loggedIn = true;
  state.accountCreated = true;
  state.applicationSubmitted = true;
  state.uploads = new Set(['PAN']);
  showToast('Secure login successful');
  goTo(8);
});
input('loginToEligibility').addEventListener('click', () => goTo(1));
input('dashboardTask').addEventListener('click', () => { state.appStep = 2; goTo(7); });
input('dashboardHelp').addEventListener('click', () => { input('supportModal').hidden = false; input('closeSupport').focus(); });

const supportModal = input('supportModal');
input('supportButton').addEventListener('click', () => { supportModal.hidden = false; input('closeSupport').focus(); });
function closeSupport() { supportModal.hidden = true; input('supportButton').focus(); }
input('closeSupport').addEventListener('click', closeSupport);
input('supportDone').addEventListener('click', closeSupport);
supportModal.addEventListener('click', e => { if (e.target === supportModal) closeSupport(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !supportModal.hidden) closeSupport(); });

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  input('toast').textContent = message;
  input('toast').classList.add('show');
  toastTimer = setTimeout(() => input('toast').classList.remove('show'), 2800);
}

renderIncomeSignal();
goTo(0);
