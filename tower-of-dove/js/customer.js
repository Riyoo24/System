/* ===== Tower of Dove - customer page script (pages/customer.html) =====
   Needs js/data.js loaded first.
   Tabs: book | rent | bookings | rentals   (open with ?tab=rent etc.) */

const params = new URLSearchParams(location.search);

/* ---------- Sample data for the signed-in customer (replace with backend) ---------- */
const CUSTOMER = { name: 'Juan Dela Cruz', phone: '0917 123 4567' };

/* If the customer signed in on the login page, use their name */
try {
  const u = JSON.parse(sessionStorage.getItem('tod_user') || 'null');
  if (u && u.role === 'customer') {
    CUSTOMER.name = u.label || CUSTOMER.name;
    if (u.phone) CUSTOMER.phone = u.phone;
    $('#nm').value = CUSTOMER.name;
    $('#ph').value = CUSTOMER.phone;
    $('#oc').value = CUSTOMER.phone;
  }
} catch (e) { /* no session: keep the sample customer */ }

/* [ref, studio, date, time, duration, status, payment] */
const MY_BOOKINGS = [
  ['TOD-1043', 'Studio B', 'Oct 9',  '1:00 PM',  '3 hrs', 'Active',    'Verified'],
  ['TOD-1042', 'Studio A', 'Oct 10', '2:00 PM',  '2 hrs', 'Confirmed', 'Verified'],
  ['TOD-1044', 'Studio C', 'Oct 9',  '6:00 PM',  '2 hrs', 'Pending',   'Pending'],
  ['TOD-1046', 'Studio D', 'Oct 8',  '4:00 PM',  '2 hrs', 'Completed', 'Verified']
];

/* [equipment, qty, 'a' | 'o', session or dates, return, status] */
const MY_RENTALS = [
  ['Electric guitar',    1, 'a', 'Oct 9, 1:00 PM',    'Oct 9, 4:00 PM', 'In Use'],
  ['Guitar amplifier',   1, 'a', 'Oct 9, 1:00 PM',    'Oct 9, 4:00 PM', 'In Use'],
  ['Keyboard',           1, 'a', 'Oct 10, 2:00 PM',   'Oct 10, 4:00 PM', 'Pending'],
  ['Set B Drum Set',     1, 'o', 'Oct 12 to Oct 13', 'Oct 13',          'Approved'],
  ['Multi-effects pedal', 1, 'a', 'Oct 8, 4:00 PM',   'Oct 8, 6:00 PM', 'Returned']
];

let nextRef = 1048;

/* ---------- Tabs ---------- */
const TABS = { book: 'c-book', rent: 'c-rent', bookings: 'c-bk', rentals: 'c-rental' };

function showTab(name) {
  const id = TABS[name] || TABS.book;
  $$('.cnav [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === id));
  $$('.pg').forEach(p => p.classList.toggle('on', p.id === id));
  window.scrollTo(0, 0);
}
$$('.cnav [data-t]').forEach(b => b.addEventListener('click', () => {
  const name = Object.keys(TABS).find(k => TABS[k] === b.dataset.t);
  showTab(name);
  history.replaceState(null, '', '?tab=' + name);
}));

/* ---------- Header ---------- */
$('#who').textContent = 'Signed in as ' + CUSTOMER.name;

/* ---------- Tables ---------- */
const ST = /^(Pending|Confirmed|Active|Completed|Rejected|Cancelled|Verified|Approved|In Use|Returned|Overdue)$/;
const TY = { a: '<span class="b addon">Add-on</span>', o: '<span class="b out">Outside</span>' };
const tbl = (head, rows) =>
  `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${
    rows.map(r => `<tr>${r.map(c => `<td>${ST.test(c) ? bd(c) : c}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;

/* ======================================================================
   BOOK A STUDIO
   ====================================================================== */
const book = {
  studio: S.findIndex(s => !isClosed(s)),
  slot: null,
  dur: 2
};

/* Pre-select from the link (?studio=A&date=...&time=...) */
if (studioIndex(params.get('studio')) > -1 && !isClosed(S[studioIndex(params.get('studio'))])) {
  book.studio = studioIndex(params.get('studio'));
}
if (params.get('date')) $('#bd').value = params.get('date');

function renderStudios() {
  $('#cs').innerHTML = S.map((s, i) => `
    <div class="card pick ${i === book.studio ? 'sel' : ''} ${isClosed(s) ? 'off' : ''}" data-i="${i}" ${isClosed(s) ? 'aria-disabled="true"' : ''}>
      ${ph(s)}
      <div class="row"><h3>Studio ${s[0]}</h3>${bd(s[3])}</div>
      <p class="mut">${s[1]}</p>
      <p style="margin-top:6px"><b>₱${s[2]}</b> <span class="mut">per hour</span></p>
    </div>`).join('');
}

/* A start time works only if every hour of the session is free and ends before closing */
function slotFits(i, dur) {
  if (i + dur > SLOTS.length) return false;
  for (let k = i; k < i + dur; k++) if (TAKEN.includes(k)) return false;
  return true;
}

function renderSlots() {
  if (book.slot !== null && !slotFits(book.slot, book.dur)) book.slot = null;
  $('#slots').innerHTML = SLOTS.map((t, i) =>
    `<button type="button" data-s="${i}" class="${i === book.slot ? 'sel' : ''}" ${slotFits(i, book.dur) ? '' : 'disabled'}>${t}</button>`
  ).join('');
}

function updateSummary() {
  const s = S[book.studio], total = s[2] * book.dur;
  $('#sumS').textContent = 'Studio ' + s[0];
  $('#sumR').textContent = 'Rate: ' + fm(s[2]) + ' per hour';
  $('#tot').textContent = fm(total);
  $('#hold').textContent = book.slot === null
    ? 'Pick a start time. Payment starts as Pending until staff verify it.'
    : `Slot held for ${SLOTS[book.slot]}. Payment starts as Pending until staff verify it.`;
  $('#grw').hidden = $('#pm').value !== 'GCash';
}

$('#cs').addEventListener('click', e => {
  const c = e.target.closest('.pick');
  if (!c || isClosed(S[c.dataset.i])) return;
  book.studio = +c.dataset.i;
  renderStudios(); updateSummary();
});
$('#slots').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  book.slot = +b.dataset.s;
  renderSlots(); updateSummary();
});
$('#dur').addEventListener('change', e => { book.dur = +e.target.value; renderSlots(); updateSummary(); });
$('#pm').addEventListener('change', updateSummary);

/* URL time (?time=3:00 PM) */
const wantedTime = SLOTS.indexOf(params.get('time'));
if (wantedTime > -1 && slotFits(wantedTime, book.dur)) book.slot = wantedTime;

$('#bf').addEventListener('submit', e => {
  e.preventDefault();
  const msg = $('#bmsg'), s = S[book.studio];
  const fail = t => { msg.className = 'alert'; msg.textContent = t; msg.hidden = false; };

  if (!$('#bd').value) return fail('Pick a date.');
  if (book.slot === null) return fail('Pick a start time.');
  if (!$('#nm').value.trim()) return fail('Enter your name.');
  if (!$('#ph').value.trim()) return fail('Enter your phone number.');
  const gcash = $('#pm').value === 'GCash';
  if (gcash && !/^\d{13}$/.test($('#gr').value.replace(/\s/g, ''))) return fail('Enter the 13-digit GCash reference number.');

  const ref = 'TOD-' + nextRef++;
  const d = new Date($('#bd').value + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  MY_BOOKINGS.unshift([ref, 'Studio ' + s[0], d, SLOTS[book.slot], book.dur + (book.dur > 1 ? ' hrs' : ' hr'), 'Pending', 'Pending']);
  renderMyBookings(); renderAttachOptions();

  msg.className = 'okmsg';
  msg.textContent = `Booking ${ref} submitted. Staff will confirm it once your payment is verified.`;
  msg.hidden = false;
  book.slot = null; $('#gr').value = '';
  renderSlots(); updateSummary();
});

renderStudios(); renderSlots(); updateSummary();

/* ======================================================================
   RENT EQUIPMENT
   ====================================================================== */
let rm = 'addon';     /* 'addon' or 'out' */
let cart = {};        /* { equipmentIndex: { q, h } } */
const px = e => rm === 'addon' ? e.a : e.o;

function renderEquipment() {
  $('#eq').innerHTML = E.map((e, i) => {
    const on = rm === 'addon' ? e.ad : e.ou;
    const ok = on && e.s > 0;
    const unit = e.d ? 'per rental, 8 hrs minimum' : rm === 'addon' ? 'per session' : 'per day, 8 hrs minimum';

    const info = e.d
      ? `<p class="mut">${e.d.kit}, ${e.d.vip ? 'VIP' : 'Basic'} set-up</p>${descP(e)}
         <details class="dset"><summary>What's included</summary><ul>
           <li>Cymbals (Trojan B8): ${e.d.vip ? '2 crash, 1 ride, hi-hat, splash' : '1 crash, 1 ride, hi-hat'}</li>
           <li>Hardware: stands, throne, carpet</li><li>Skins: Remo and Evans</li>
           <li>Minimum rent: 8 hours</li><li>No service</li></ul></details>`
      : `${descP(e)}<p class="mut">${e.s} available</p>`;

    const ctl = e.d
      ? '<span class="mut" style="white-space:nowrap">8 hrs</span>'
      : `<input class="qty" type="number" min="1" max="${e.s}" value="1" aria-label="Quantity for ${esc(e.n)}" data-q="${i}" ${ok ? '' : 'disabled'}>`;

    return `<div class="card" data-e="${i}" style="${on ? '' : 'opacity:.55'}">
      ${eqImg(e)}
      <p class="cat">${esc(e.cat || '')}</p>
      <div class="row"><h3>${esc(e.n)}</h3>${e.s < 2 && !e.d ? bd('Low') : ''}</div>
      ${info}
      <p style="margin-top:6px">${e.ad ? '<span class="b addon">Add-on</span> ' : ''}${e.ou ? '<span class="b out">Outside</span>' : ''}</p>
      <div class="row" style="margin-top:10px;flex-wrap:wrap">
        <span><b>${on ? fm(px(e)) : 'Not offered'}</b> <span class="mut">${on ? unit : ''}</span></span>
        <span class="row" style="margin-left:auto">${ctl}<button type="button" class="btn sm" data-add="${i}" ${ok ? '' : 'disabled'}>Add</button></span>
      </div></div>`;
  }).join('');
  renderCart();
}

function renderCart() {
  const keys = Object.keys(cart);
  const total = keys.reduce((a, i) => a + cart[i].q * px(E[i]), 0);

  $('#bundle-tag-wrap').innerHTML = rm === 'out' && keys.length >= 2
    ? `<div class="bundle-tag">Rental bundle, ${keys.length} items</div>` : '';

  $('#cart').innerHTML = keys.length
    ? keys.map(i => `<li>
        <span>${esc(E[i].n)} ${E[i].d ? '(8 hrs)' : 'x ' + cart[i].q}
          <button type="button" class="lk" data-rm="${i}" aria-label="Remove ${esc(E[i].n)}">remove</button></span>
        <span>${fm(cart[i].q * px(E[i]))}</span></li>`).join('')
    : '<li><span class="mut">Nothing added yet</span><span></span></li>';

  $('#ctt').textContent = fm(total);
  $('#fa').hidden = rm !== 'addon';
  $('#fo').hidden = rm === 'addon';
  $('#rmh').textContent = rm === 'addon'
    ? 'Used inside the studio you booked. Tied to your booking reference. Priced per session; drum sets are priced per rental.'
    : 'Taken out of the studio. Minimum rent is 8 hours. Priced per day; drum sets are priced per rental (8 hours, no service). You get an OUT reference instead of a booking reference.';
  $$('#rm button').forEach(x => x.classList.toggle('on', x.dataset.m === rm));
  gateRequest();
}

/* Outside rentals need a valid ID, and something in the cart */
function gateRequest() {
  const empty = Object.keys(cart).length === 0;
  const needId = rm === 'out' && !$('#vf').files.length;
  $('#rq').disabled = empty || needId;
}

/* Attach-to-booking dropdown lists bookings that can still take add-ons */
function renderAttachOptions() {
  const usable = MY_BOOKINGS.filter(b => b[5] === 'Confirmed' || b[5] === 'Pending' || b[5] === 'Active');
  $('#lb').innerHTML = usable.length
    ? usable.map(b => `<option value="${b[0]}">${b[0]} - ${b[1]}, ${b[2]} ${b[3]}</option>`).join('')
    : '<option value="">No bookings yet. Book a studio first.</option>';
}

$('#rm').addEventListener('click', e => {
  const m = e.target.dataset.m;
  if (!m) return;
  rm = m; cart = {};
  $('#rmsg').hidden = true;
  renderEquipment();
});
$('#eq').addEventListener('click', e => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  const i = b.dataset.add, q = $('[data-q="' + i + '"]');
  const max = E[i].s;
  cart[i] = { q: q ? Math.min(Math.max(+q.value || 1, 1), max) : 1, h: E[i].d ? 8 : null };
  renderCart();
});
$('#cart').addEventListener('click', e => {
  const b = e.target.closest('[data-rm]');
  if (!b) return;
  delete cart[b.dataset.rm];
  renderCart();
});
$('#vf').addEventListener('change', gateRequest);

$('#rq').addEventListener('click', () => {
  const msg = $('#rmsg');
  const fail = t => { msg.className = 'alert'; msg.textContent = t; msg.hidden = false; };

  if (rm === 'addon') {
    if (!$('#lb').value) return fail('Book a studio first, then attach equipment to it.');
  } else {
    if (!$('#pd').value || !$('#rd').value) return fail('Choose a pick-up date and a return date.');
    if ($('#rd').value < $('#pd').value) return fail('The return date cannot be before the pick-up date.');
    if (!$('#oc').value.trim()) return fail('Enter a contact number.');
  }

  const when = rm === 'addon'
    ? (MY_BOOKINGS.find(b => b[0] === $('#lb').value) || [])[2] + ', ' + (MY_BOOKINGS.find(b => b[0] === $('#lb').value) || [])[3]
    : fdate($('#pd').value).replace(/^\w+, /, '') + ' to ' + fdate($('#rd').value).replace(/^\w+, /, '');
  const ret = rm === 'addon' ? 'End of session' : fdate($('#rd').value).replace(/^\w+, /, '');

  Object.keys(cart).forEach(i => MY_RENTALS.unshift([E[i].n, cart[i].q, rm === 'addon' ? 'a' : 'o', when, ret, 'Pending']));
  const ref = rm === 'addon' ? $('#lb').value : 'OUT-' + nextRef++;
  cart = {};
  renderEquipment(); renderMyRentals();

  msg.className = 'okmsg';
  msg.textContent = `Rental request sent (${ref}). Staff will approve it shortly.`;
  msg.hidden = false;
});

/* Highlight a card when arriving from the landing page (?item=3) */
function highlightItem() {
  const i = params.get('item');
  if (i === null) return;
  const c = $('#eq .card[data-e="' + i + '"]');
  if (c) { c.classList.add('hl'); setTimeout(() => c.scrollIntoView({ block: 'center' }), 50); }
}

renderEquipment(); renderAttachOptions();

/* ======================================================================
   MY BOOKINGS / MY RENTAL
   ====================================================================== */
const A = (label, cls, ref) => `<button type="button" class="btn sm ${cls}" data-act="${label}" data-ref="${ref}">${label}</button>`;

function renderMyBookings() {
  $('#mybk').innerHTML = tbl(
    ['Reference', 'Studio', 'Date', 'Time', 'Duration', 'Status', 'Payment', ''],
    MY_BOOKINGS.map(b => [
      ...b,
      b[5] === 'Confirmed' || b[5] === 'Pending' ? A('Reschedule', '', b[0]) + A('Cancel', 'line', b[0]) : ''
    ])
  );
}

function renderMyRentals() {
  $('#myrent').innerHTML = tbl(
    ['Equipment', 'Qty', 'Rent type', 'Session or dates', 'Return date', 'Status'],
    MY_RENTALS.map(r => [r[0], String(r[1]), TY[r[2]], r[3], r[4], r[5]])
  );
}

$('#mybk').addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const row = MY_BOOKINGS.find(x => x[0] === b.dataset.ref);
  if (!row) return;
  if (b.dataset.act === 'Cancel') {
    row[5] = 'Cancelled';
    renderMyBookings(); renderAttachOptions();
  } else {
    /* Reschedule: send the customer to the booking tab to pick a new time */
    showTab('book');
    const m = $('#bmsg');
    m.className = 'hold';
    m.textContent = `Rescheduling ${row[0]}: pick a new date and time, then submit. Changes close 24 hours before your session.`;
    m.hidden = false;
  }
});

/* Guest lookup */
$('#find').addEventListener('click', () => {
  const ref = $('#fref').value.trim().toUpperCase(), box = $('#fres');
  const hit = MY_BOOKINGS.find(b => b[0] === ref);
  box.hidden = false;
  if (!ref || !$('#fph').value.trim()) { box.className = 'alert'; box.textContent = 'Enter both the booking reference and your phone number.'; return; }
  if (hit) { box.className = 'okmsg'; box.textContent = `${hit[0]}: ${hit[1]}, ${hit[2]} at ${hit[3]} (${hit[4]}). Status: ${hit[5]}.`; }
  else { box.className = 'alert'; box.textContent = 'No booking found with that reference and phone number.'; }
});

renderMyBookings(); renderMyRentals();

/* ---------- Open the right tab from the link ---------- */
showTab(params.get('tab') || 'book');
highlightItem();
