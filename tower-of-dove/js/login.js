/* ===== Tower of Dove - login / register script (pages/login.html) =====
   Needs js/data.js loaded first.

   DEMO ONLY: there is no real authentication here. Any username and password
   works. Replace signIn() with a call to your backend when you have one.
     username "owner"  -> owner dashboard
     username "staff"  -> staff dashboard
     anything else     -> customer page */

const params = new URLSearchParams(location.search);

/* ---------- Session (sessionStorage, wrapped in try/catch) ---------- */
const SESSION_KEY = 'tod_user';
function saveSession(user) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch (e) { /* private mode: ignore */ }
}

/* ---------- Log in / Register switch ---------- */
function authMode(mode) {
  $$('[data-at]').forEach(b => {
    const on = b.dataset.at === mode;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
  $('#f-login').hidden = mode !== 'login';
  $('#f-reg').hidden = mode !== 'reg';
  $('#lerr').hidden = true;
  $('#rerr').hidden = true;
  document.title = (mode === 'login' ? 'Log in' : 'Register') + ' | Tower of Dove';
  history.replaceState(null, '', mode === 'reg' ? '?mode=reg' : location.pathname);
}
$$('[data-at]').forEach(b => b.addEventListener('click', () => authMode(b.dataset.at)));
authMode(params.get('mode') === 'reg' ? 'reg' : 'login');

/* ---------- Show / hide password ---------- */
$$('.pw-toggle').forEach(b => b.addEventListener('click', () => {
  const input = $('#' + b.dataset.for), show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  b.textContent = show ? 'Hide' : 'Show';
  b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}));

/* ---------- Sign in ---------- */
function signIn(user) {
  saveSession(user);
  const target = user.role === 'customer' ? 'customer.html?tab=book' : 'admin.html';
  location.href = target;
}

function fail(box, input, text) {
  box.textContent = text;
  box.hidden = false;
  $$('input[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
  if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
}

$('#f-login').addEventListener('submit', e => {
  e.preventDefault();
  const u = $('#lu').value.trim(), p = $('#lp').value;
  const box = $('#lerr');
  if (!u) return fail(box, $('#lu'), 'Enter your username.');
  if (!p) return fail(box, $('#lp'), 'Enter your password.');

  const k = u.toLowerCase();
  signIn(k === 'owner' ? { role: 'owner', label: 'Owner' }
       : k === 'staff' ? { role: 'staff', label: 'Staff' }
       : { role: 'customer', label: u });
});

$('#forgot').addEventListener('click', e => {
  e.preventDefault();
  const m = $('#fmsg');
  m.textContent = 'Password reset is not set up yet. Ask the studio staff to reset it for you.';
  m.hidden = false;
});

/* ---------- Register ---------- */
$('#f-reg').addEventListener('submit', e => {
  e.preventDefault();
  const box = $('#rerr');
  const name = $('#rg-name').value.trim(), phone = $('#rg-phone').value.replace(/[\s-]/g, '');
  const user = $('#rg-user').value.trim(), p1 = $('#rg-pass').value, p2 = $('#rg-pass2').value;

  if (!name) return fail(box, $('#rg-name'), 'Enter your full name.');
  if (!/^(09|\+639)\d{9}$/.test(phone)) return fail(box, $('#rg-phone'), 'Enter a valid mobile number, like 0917 123 4567.');
  if (user.length < 3) return fail(box, $('#rg-user'), 'Choose a username with at least 3 characters.');
  if (p1.length < 8) return fail(box, $('#rg-pass'), 'Your password needs at least 8 characters.');
  if (p1 !== p2) return fail(box, $('#rg-pass2'), 'The two passwords do not match.');

  signIn({ role: 'customer', label: name, phone: $('#rg-phone').value.trim() });
});
