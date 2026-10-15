/* ===== Tower of Dove - shared data and helpers =====
   Loaded first on every page (before landing.js / customer.js).
   Later this is the one file you swap for real backend calls. */

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- Page links (work from the root and from /pages) ---------- */
const IN_PAGES = location.pathname.includes('/pages/');
const PAGES = {
  home:     IN_PAGES ? '../index.html' : 'index.html',
  customer: IN_PAGES ? 'customer.html' : 'pages/customer.html'
};

/* ---------- Studios ---------- */
/* [code, description, hourly rate, status, color 1, color 2] */
const S = [
  ['A', 'Drum and full band room', 350, 'Available', '#C92C3E', '#3D0C14', 'images/studio.jpg'],
  ['B', 'Vocal and acoustic booth', 250, 'Occupied', '#C98512', '#33220A', 'images/studio.jpg'],
  ['C', 'Mid-size band room', 300, 'Available', '#8E161F', '#1E0A0F', 'images/studio.jpg'],
  ['D', 'Production room', 280, 'Maintenance', '#4A4A55', '#16161A', 'images/studio.jpg']
];

/* ---------- Equipment ---------- */
const DS = (n, kit, vip, p, img) => ({ n, cat: 'Drums', a: p, o: p, s: 1, ad: 1, ou: 1, img, d: { kit, vip } });

/* n = name, cat = category, a = add-on price, o = outside price, s = available stock,
   ad = add-on offered, ou = outside offered, d = drum set details
   Optional per item: img (image URL), desc (short description) */
const E = [
  { n: 'Electric guitar',     cat: 'Guitars',    a: 100, o: 250, s: 4, ad: 1, ou: 1,img: 'images/electric guitar.jpg' },
  { n: 'Guitar amplifier',    cat: 'Amplifiers', a: 150, o: 350, s: 4, ad: 1, ou: 1, img: 'images/electric guitar.jpg' },
  DS('Set A Drum Set', 'RDX drum set', 0, 2700,'images/drums.jpg'),
  DS('Set B Drum Set', 'RDX drum set', 1, 3000,'images/drums.jpg'),
  DS('Set C Drum Set', 'Steely drum set (high-end model)', 0, 2500,'images/drums.jpg'),
  DS('Set D Drum Set', 'Steely drum set (high-end model)', 1, 2800,'images/drums.jpg'),
  { n: 'Drum kit add-ons',    cat: 'Drums',      a: 120, o: 0,   s: 2, ad: 1, ou: 1,img: 'images/electric guitar.jpg' },
  { n: 'Keyboard',            cat: 'Keyboards',  a: 200, o: 500, s: 1, ad: 1, ou: 1, img: 'images/electric guitar.jpg' },
  { n: 'Multi-effects pedal', cat: 'Effects',    a: 80,  o: 150, s: 3, ad: 1, ou: 1, img: 'images/electric guitar.jpg' }
];

/* ---------- Time slots ---------- */
const SLOTS = ['10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM'];
const TAKEN = [3, 4, 8]; /* indexes of SLOTS already booked (sample data) */

/* ---------- Helpers ---------- */
const fm  = n => '₱' + n.toLocaleString('en-US');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const bd  = s => `<span class="b ${s.toLowerCase().replace(/ /g, '')}">${s}</span>`;
const isClosed = s => s[3] === 'Maintenance' || s[3] === 'Unavailable';
const studioIndex = code => S.findIndex(s => s[0] === code);

const ph = s => s[6] 
  ? `<div class="ph has-img" style="overflow:hidden;padding:0;"><img src="${IN_PAGES ? '../' : ''}${esc(s[6])}" alt="Studio ${s[0]}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:8px;"></div>`
  : `<div class="ph" style="background:linear-gradient(135deg,${s[4]},${s[5]})">${s[0]}</div>`;

const PHICON = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/></svg>';
const eqImg = e => e.img
  ? `<div class="eqimg has"><img src="${IN_PAGES ? '../' : ''}${esc(e.img)}" alt="${esc(e.n)}"></div>`
  : `<div class="eqimg" role="img" aria-label="No image yet">${PHICON}</div>`;
const descP = e => e.desc ? `<p class="mut" style="margin-top:4px">${esc(e.desc)}</p>` : '';

const fdate = v => new Date(v + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

/* Links into the customer page. Customer page reads these query values. */
const bookUrl = (studio, date, time) => {
  const q = new URLSearchParams({ tab: 'book' });
  if (studio) q.set('studio', studio);
  if (date) q.set('date', date);
  if (time) q.set('time', time);
  return PAGES.customer + '?' + q;
};
const rentUrl = item => PAGES.customer + '?tab=rent' + (item != null ? '&item=' + item : '');
