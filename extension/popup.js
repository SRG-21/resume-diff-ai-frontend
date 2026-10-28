// Popup: sign in to your Resume Diff AI account, pick a saved resume, score the open job page.
const app = document.getElementById('app');
const store = {
  get: (k) => new Promise((r) => chrome.storage.local.get(k, (v) => r(v))),
  set: (o) => new Promise((r) => chrome.storage.local.set(o, r)),
  clear: () => new Promise((r) => chrome.storage.local.clear(r)),
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function api(path, init = {}) {
  const { apiUrl, token } = await store.get(['apiUrl', 'token']);
  const headers = { ...(init.headers || {}), Authorization: `Bearer ${token}` };
  const res = await fetch(`${apiUrl}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = body.detail;
    throw new Error(typeof d === 'string' ? d : (d && d.message) || `Request failed (${res.status})`);
  }
  return body;
}

// Runs inside the job page: grab the most likely job description text.
function readJobText() {
  const selectors = ['.jobs-description', '#jobDescriptionText', '[data-automation-id="jobPostingDescription"]',
    '#content .section-wrapper', '.posting-page', '[class*="job-description"]', '[class*="jobDescription"]', 'article', 'main'];
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el && el.innerText.trim().length > 200) return el.innerText.trim().slice(0, 20000);
  }
  return (window.getSelection().toString() || document.body.innerText).trim().slice(0, 20000);
}

async function renderLogin(error = '') {
  const { apiUrl = '' } = await store.get('apiUrl');
  app.innerHTML = `<h3>Sign in</h3>${error ? `<p class="err">${esc(error)}</p>` : ''}
    <input id="api" placeholder="API URL (https://…/api)" value="${esc(apiUrl)}">
    <input id="email" type="email" placeholder="Email"><input id="pw" type="password" placeholder="Password">
    <button id="go">Sign in</button><p class="muted">Use the same account as the website. Google-only accounts: set a password via "Forgot password".</p>`;
  document.getElementById('go').onclick = async () => {
    const url = document.getElementById('api').value.trim().replace(/\/$/, '');
    try {
      const res = await fetch(`${url}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.getElementById('email').value.trim(), password: document.getElementById('pw').value }) });
      const body = await res.json();
      if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Sign-in failed');
      await store.set({ apiUrl: url, token: body.access_token });
      renderMain();
    } catch (e) { renderLogin(e.message); }
  };
}

async function renderMain() {
  let resumes;
  try { resumes = (await api('/resumes')).items; }
  catch { return renderLogin('Please sign in again.'); }
  if (!resumes.length) {
    app.innerHTML = '<p>Save a resume on the website first (Resumes page), then come back.</p>';
    return;
  }
  app.innerHTML = `<label>Resume</label><select id="resume">${resumes.map((r) => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('')}</select>
    <button id="score">Score this job</button><div id="out"></div><p class="muted"><a href="#" id="signout">Sign out</a></p>`;
  document.getElementById('signout').onclick = async (e) => { e.preventDefault(); await store.clear(); renderLogin(); };
  document.getElementById('score').onclick = async (e) => {
    const btn = e.target; const out = document.getElementById('out');
    btn.disabled = true; out.textContent = 'Reading the page…';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const [{ result: text }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readJobText });
      if (!text || text.length < 100) throw new Error('Could not find a job description on this page. Select the text and try again.');
      out.textContent = 'Scoring…';
      const form = new FormData();
      form.append('jd_text', text);
      form.append('resume_id', document.getElementById('resume').value);
      const r = await api('/compare', { method: 'POST', body: form });
      out.innerHTML = `<div class="score">${r.matchPercent}%</div><div class="muted">${esc(r.jobTitle || '')} ${esc(r.company || '')}</div>
        <p>Missing:</p>${(r.missingSkills || []).slice(0, 12).map((s) => `<span class="chip">${esc(s)}</span>`).join('') || '–'}
        ${r.usage ? `<p class="muted">${r.usage.used} of ${r.usage.limit} scans used this month</p>` : ''}
        <p class="muted">Full report is saved in History on the website.</p>`;
    } catch (err) { out.innerHTML = `<p class="err">${esc(err.message)}</p>`; }
    btn.disabled = false;
  };
}

store.get('token').then(({ token }) => (token ? renderMain() : renderLogin()));
