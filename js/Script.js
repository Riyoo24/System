/* ===== Tower of Dove - Landing page script ===== */

/* Change these to match your own pages */
const PAGES = {
  book: 'booking.html',   // opens with ?studio=A&date=2026-10-10&time=3:00%20PM
  rent: 'rent.html'       // opens with ?item=<index>
};

const $ = s => document.querySelector(s);

/* ---------- Data (replace with your backend later) ---------- */
/* [code, description, hourly rate, status, color 1, color 2] */
const S = [
  ['A', 'Drum and full band room', 350, 'Available',   '#C92C3E', '#3D0C14'],
  ['B', 'Vocal and acoustic booth', 250, 'Occupied',    '#C98512', '#33220A'],
  ['C', 'Mid-size band room',       300, 'Available',   '#8E161F', '#1E0A0F'],
  ['D', 'Production room',          280, 'Maintenance', '#4A4A55', '#16161A']
];

const DS = (n, kit, vip, p) => ({ n, cat: 'Drums', a: p, o: p, s: 1, ad: 1, ou: 1, d: { kit, vip } });

/* n = name, cat = category, a = add-on price, o = outside price, s = available stock,
   ad = add-on offered, ou = outside offered, d = drum set details */
const E = [
  { n: 'Electric guitar',    cat: 'Guitars',    a: 100, o: 250, s: 4, ad: 1, ou: 1 },
  { n: 'Guitar amplifier',   cat: 'Amplifiers', a: 150, o: 350, s: 4, ad: 1, ou: 1 },
  DS('Set A Drum Set', 'RDX drum set', 0, 2700),
  DS('Set B Drum Set', 'RDX drum set', 1, 3000),
  DS('Set C Drum Set', 'Steely drum set (high-end model)', 0, 2500),
  DS('Set D Drum Set', 'Steely drum set (high-end model)', 1, 2800),
  { n: 'Drum kit add-ons',   cat: 'Drums',      a: 120, o: 0,   s: 2, ad: 1, ou: 0 },
  { n: 'Keyboard',           cat: 'Keyboards',  a: 200, o: 500, s: 1, ad: 1, ou: 1 },
  { n: 'Multi-effects pedal', cat: 'Effects',   a: 80,  o: 150, s: 3, ad: 1, ou: 1 }
];
/* Optional per item: img (image URL), desc (short description) */

const SLOTS = ['10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM'];
const TAKEN = [3, 4, 8]; /* indexes of SLOTS already booked (sample data) */

/* ---------- Helpers ---------- */
const bd  = s => `<span class="b ${s.toLowerCase().replace(/ /g, '')}">${s}</span>`;
const fm  = n => '₱' + n.toLocaleString('en-US');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const isClosed = s => s[3] === 'Maintenance' || s[3] === 'Unavailable';

const ph = s => `<div class="ph" style="background:linear-gradient(135deg,${s[4]},${s[5]})">${s[0]}</div>`;

const PHICON = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/></svg>';
const eqImg = e => e.img
  ? `<div class="eqimg has"><img src="${esc(e.img)}" alt="${esc(e.n)}"></div>`
  : `<div class="eqimg" role="img" aria-label="No image yet">${PHICON}</div>`;
const descP = e => e.desc ? `<p class="mut" style="margin-top:4px">${esc(e.desc)}</p>` : '';

const fdate = v => new Date(v + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const bookUrl = (studio, date, time) => {
  const q = new URLSearchParams();
  if (studio != null) q.set('studio', studio);
  if (date) q.set('date', date);
  if (time) q.set('time', time);
  const s = q.toString();
  return PAGES.book + (s ? '?' + s : '');
};

/* ---------- Render: "Right now at the studio" ---------- */
$('#nowl').innerHTML = S.map(s =>
  `<li><span><i class="lamp ${s[3] === 'Occupied' ? 'live' : ''}"></i>Studio ${s[0]}</span><small>${
    s[3] === 'Occupied' ? 'In session until 4:00 PM' : s[3] === 'Available' ? 'Open for bookings' : 'Closed today'
  }</small></li>`).join('');

/* ---------- Render: quick booking studio dropdown ---------- */
$('#qs').innerHTML = S.map((s, i) => `<option value="${i}">Studio ${s[0]}, ₱${s[2]}/hr</option>`).join('');

/* ---------- Render: studio cards ---------- */
$('#ls').innerHTML = S.map(s => {
  const off = isClosed(s);
  return `<div class="card">${ph(s)}
    <div class="row"><h3>Studio ${s[0]}</h3>${bd(s[3])}</div>
    <p class="mut">${s[1]}</p>
    <div class="row" style="margin-top:12px">
      <span><b>₱${s[2]}</b> <span class="mut">per hour</span></span>
      ${off
        ? '<button class="btn gold" disabled>Closed</button>'
        : `<a class="btn gold" href="${bookUrl(s[0])}">Book now</a>`}
    </div></div>`;
}).join('');

/* ---------- Render: equipment cards ---------- */
function landEq() {
  $('#le').innerHTML = E.map((e, i) => {
    const p = [];
    if (e.ad) p.push(`<div><span class="b addon">Add-on</span> ${fm(e.a)} ${e.d ? 'per rental' : 'per session'}</div>`);
    if (e.ou) p.push(`<div><span class="b out">Outside</span> ${fm(e.o)} ${e.d ? 'per rental' : 'per day, 8 hrs minimum'}</div>`);
    const sub = e.d
      ? `${e.d.kit}, ${e.d.vip ? 'VIP' : 'Basic'} set-up. 8 hrs minimum, no service.`
      : `${e.s} available`;
    return `<div class="card">${eqImg(e)}
      <p class="cat">${esc(e.cat || '')}</p>
      <h3>${esc(e.n)}</h3>${descP(e)}
      <p class="mut">${sub}</p>
      <div class="prices">${p.join('')}</div>
      <a class="btn gold full" style="margin-top:0" href="${PAGES.rent}?item=${i}">Rent</a></div>`;
  }).join('');
}
landEq();

/* ---------- Check availability ---------- */
function checkAvail() {
  const i = +$('#qs').value, s = S[i], dv = $('#qd').value, tm = $('#qt').value, box = $('#avail');
  box.hidden = false;

  if (!dv) {
    box.innerHTML = '<div class="card"><h3>Pick a date</h3><p class="mut">Choose a date, then check availability again.</p></div>';
    return;
  }

  const open = SLOTS.filter((t, k) => !TAKEN.includes(k));
  let h;

  if (isClosed(s)) {
    const alt = S.map((x, k) => [x, k]).filter(([x]) => !isClosed(x));
    h = `<div class="row"><h3>Studio ${s[0]} is closed</h3>${bd(s[3])}</div>
      <p class="mut">It is not taking bookings right now. These studios are open:</p>
      <div>${alt.map(([x, k]) => `<button type="button" class="chip" data-ps="${k}">Studio ${x[0]}, ₱${x[2]}/hr</button>`).join('')}</div>`;
  } else if (open.includes(tm)) {
    h = `<div class="row"><h3>Studio ${s[0]} is free on ${fdate(dv)} at ${tm}</h3>${bd('Available')}</div>
      <p class="mut">₱${s[2]} per hour. ${s[1]}.</p>
      <div><a class="btn gold" href="${bookUrl(s[0], dv, tm)}">Book this slot</a></div>`;
  } else {
    h = `<div class="row"><h3>Studio ${s[0]} is booked on ${fdate(dv)} at ${tm}</h3><span class="b unavailable">Booked</span></div>
      <p class="mut">These times are still open that day. Pick one to continue.</p>
      <div>${open.map(t => `<a class="chip" style="text-decoration:none" href="${bookUrl(s[0], dv, t)}">${t}</a>`).join('')}</div>`;
  }
  box.innerHTML = '<div class="card">' + h + '</div>';
}

/* Suggest another studio when the chosen one is closed */
$('#avail').addEventListener('click', e => {
  const b = e.target.closest('[data-ps]');
  if (!b) return;
  $('#qs').value = b.dataset.ps;
  checkAvail();
});

$('#qb').addEventListener('submit', e => { e.preventDefault(); checkAvail(); });
['#qs', '#qd', '#qt'].forEach(x =>
  $(x).addEventListener('change', () => { if (!$('#avail').hidden) checkAvail(); })
);