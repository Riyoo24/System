/* ===== Tower of Dove - Pure Username Authentication ===== */
const params = new URLSearchParams(location.search);

const SESSION_KEY = 'tod_user';
function saveSession(user) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch (e) {}
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

function fail(box, input, text) { 
  box.textContent = text; 
  box.hidden = false; 
  $$('input[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
  if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
}

/* ---------- Sign In with Username & Password ---------- */
$('#f-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const u = $('#lu').value.trim(), p = $('#lp').value;
  const box = $('#lerr');
  if (!u) return fail(box, $('#lu'), 'Enter your username.');
  if (!p) return fail(box, $('#lp'), 'Enter your password.');

  const k = u.toLowerCase();

  // Admin / Staff hardcoded check
  if (k === 'owner' || k === 'staff') {
    const userObj = k === 'owner' ? { role: 'owner', label: 'Owner' } : { role: 'staff', label: 'Staff' };
    saveSession(userObj);
    location.href = 'admin.html';
    return;
  }

  // Query custom users table in Supabase
  const { data, error } = await _supabase
    .from('users')
    .select('*')
    .eq('username', u)
    .eq('password', p)
    .maybeSingle();

  if (error || !data) {
    return fail(box, $('#lp'), 'Invalid username or password.');
  }

  saveSession({ 
    role: 'customer', 
    label: data.full_name,
    phone: data.phone_number,
    username: data.username
  });
  
  location.href = 'customer.html?tab=book';
});

$('#forgot').addEventListener('click', e => {
  e.preventDefault();
  const m = $('#fmsg');
  m.textContent = 'Password reset is not set up yet. Ask the studio staff to reset it for you.';
  m.hidden = false;
});

/* ---------- Registration with Custom Users Table ---------- */
$('#f-reg').addEventListener('submit', async (e) => {
  e.preventDefault();
  const box = $('#rerr');
  const name = $('#rg-name').value.trim(), phone = $('#rg-phone').value.replace(/[\s-]/g, '');
  const user = $('#rg-user').value.trim(), p1 = $('#rg-pass').value, p2 = $('#rg-pass2').value;

  if (!name) return fail(box, $('#rg-name'), 'Enter your full name.');
  if (!/^(09|\+639)\d{9}$/.test(phone)) return fail(box, $('#rg-phone'), 'Enter a valid mobile number, like 0917 123 4567.');
  if (user.length < 3) return fail(box, $('#rg-user'), 'Choose a username with at least 3 characters.');
  if (p1.length < 8) return fail(box, $('#rg-pass'), 'Your password needs at least 8 characters.');
  if (p1 !== p2) return fail(box, $('#rg-pass2'), 'The two passwords do not match.');

  // Check if username is already taken
  const { data: existingUser } = await _supabase
    .from('users')
    .select('username')
    .eq('username', user)
    .maybeSingle();

  if (existingUser) {
    return fail(box, $('#rg-user'), 'Username is already taken.');
  }

  // Insert new user into database table
  const { error } = await _supabase
    .from('users')
    .insert([{
      full_name: name,
      phone_number: phone,
      username: user,
      password: p1
    }]);

  if (error) {
    return fail(box, $('#rg-user'), 'Registration failed: ' + error.message);
  }

  saveSession({ role: 'customer', label: name, phone: phone, username: user });
  location.href = 'customer.html?tab=book';
});