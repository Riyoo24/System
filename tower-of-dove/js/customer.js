/* ===== Tower of Dove - customer page script (pages/customer.html) ===== */
const params = new URLSearchParams(location.search);

/* ---------- Customer Session Data ---------- */
let CUSTOMER = { name: 'Guest User', phone: '' };

let MY_BOOKINGS = [];
let MY_RENTALS = [];
let nextRef = 1048;

/* ---------- Session Loader ---------- */
function initSession() {
  try {
    const u = JSON.parse(sessionStorage.getItem('tod_user') || 'null');
    if (u && u.role === 'customer') {
      CUSTOMER.name = u.label || 'Customer';
      if (u.phone) CUSTOMER.phone = u.phone;
    }
  } catch (e) {}

  const whoEl = $('#who');
  if (whoEl) whoEl.textContent = 'Signed in as ' + CUSTOMER.name;

  if ($('#nm')) $('#nm').value = CUSTOMER.name;
  if ($('#ph')) $('#ph').value = CUSTOMER.phone;
  if ($('#oc')) $('#oc').value = CUSTOMER.phone;
}

/* ---------- Tabs ---------- */
const TABS = { book: 'c-book', rent: 'c-rent', bookings: 'c-bk', rentals: 'c-rental' };

function showTab(name) {
  const id = TABS[name] || TABS.book;
  $$('.cnav [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === id));$$
('.pg').forEach(p => p.classList.toggle('on', p.id === id));
  window.scrollTo(0, 0);
}

/* ---------- Tables Helper ---------- */
const ST = /^(Pending|Confirmed|Active|Completed|Rejected|Cancelled|Verified|Approved|In Use|Returned|Overdue)$/;
const TY = { a: '<span class="b addon">Add-on</span>', o: '<span class="b out">Outside</span>' };
const tbl = (head, rows) =>
  `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${
    rows.map(r => `<tr>${r.map(c => `<td>${ST.test(c) ? bd(c) : c}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;

/* ---------- Fetch Live Data from Supabase ---------- */
async function loadCustomerData() {
  try {
    const { data: bData } = await _supabase.from('reservations').select('*').order('id', { ascending: false });
    if (bData) {
      MY_BOOKINGS = bData.map(b => [
        b.reference_code, b.studio_name, b.booking_date, b.time_slot, b.duration, b.status, b.payment_status
      ]);
    }

    const { data: rData } = await _supabase.from('rentals').select('*').order('id', { ascending: false });
    if (rData) {
      MY_RENTALS = rData.map(r => [
        r.equipment_name, r.quantity, r.rent_type, r.session_dates, r.return_date, r.status
      ]);
    }
  } catch (e) {
    console.warn('Could not load live bookings from Supabase', e);
  } finally {
    renderMyBookings();
    renderMyRentals();
    renderAttachOptions();
    await updateTakenSlots();
  }
}

/* ======================================================================
   BOOK A STUDIO
   ====================================================================== */
const book = {
  studio: 0,
  slot: null,
  dur: 2
};

function renderStudios() {
  const csEl = $('#cs');
  if (!csEl || !Array.isArray(S)) return;

  csEl.innerHTML = S.map((s, i) => {
    const closed = s[3] !== 'Available';
    return `
      <div class="card pick ${i === book.studio ? 'sel' : ''} ${closed ? 'off' : ''}" data-i="${i}" style="cursor: ${closed ? 'not-allowed' : 'pointer'}">
        ${ph(s)}
        <div class="row"><h3>Studio ${s[0]}</h3>${bd(s[3])}</div>
        <p class="mut">${s[1]}</p>
        <p style="margin-top:6px"><b>₱${s[2]}</b> <span class="mut">per hour</span></p>
      </div>`;
  }).join('');
}

function slotFits(i, dur) {
  if (i + dur > SLOTS.length) return false;
  for (let k = i; k < i + dur; k++) if (TAKEN.includes(k)) return false;
  return true;
}

function renderSlots() {
  if (book.slot !== null && !slotFits(book.slot, book.dur)) book.slot = null;
  const slotsEl = $('#slots');
  if (slotsEl) {
    slotsEl.innerHTML = SLOTS.map((t, i) =>
      `<button type="button" data-s="${i}" class="${i === book.slot ? 'sel' : ''}" ${slotFits(i, book.dur) ? '' : 'disabled'}>${t}</button>`
    ).join('');
  }
}

async function updateTakenSlots() {
  const dateInput = $('#bd');
  if (!dateInput || !dateInput.value || !S[book.studio]) return;

  // Format date to match Supabase storage format (e.g. "Oct 10")
  const [year, month, day] = dateInput.value.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const selectedDateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const selectedStudioName = 'Studio ' + S[book.studio][0];

  try {
    const { data, error } = await _supabase
      .from('reservations')
      .select('time_slot, duration, status')
      .eq('booking_date', selectedDateFormatted)
      .eq('studio_name', selectedStudioName)
      .neq('status', 'Cancelled');

    // Reset TAKEN array for clean evaluation
    TAKEN = [];

    if (data && data.length > 0) {
      data.forEach(res => {
        // Normalize time slot string formatting
        const normTime = res.time_slot.trim();
        const startIndex = SLOTS.findIndex(s => s.toLowerCase() === normTime.toLowerCase());

        if (startIndex > -1) {
          const durHours = parseInt(res.duration) || 1;
          for (let i = startIndex; i < startIndex + durHours; i++) {
            if (!TAKEN.includes(i)) TAKEN.push(i);
          }
        }
      });
    }
  } catch (e) {
    console.warn('Could not fetch taken slots from Supabase', e);
  } finally {
    renderSlots();
  }
}

function updateSummary() {
  if (!S[book.studio]) return;
  const s = S[book.studio], total = s[2] * book.dur;
  if ($('#sumS')) $('#sumS').textContent = 'Studio ' + s[0];
  if ($('#sumR')) $('#sumR').textContent = 'Rate: ' + fm(s[2]) + ' per hour';
  if ($('#tot')) $('#tot').textContent = fm(total);
  if ($('#hold')) {
    $('#hold').textContent = book.slot === null
      ? 'Pick a start time. Payment starts as Pending until staff verify it.'
      : `Slot held for ${SLOTS[book.slot]}. Payment starts as Pending until staff verify it.`;
  }
  if ($('#grw')) $('#grw').hidden = $('#pm').value !== 'GCash';
}

/* ======================================================================
   RENT EQUIPMENT
   ====================================================================== */
let rm = 'addon';
let cart = {};
const px = e => rm === 'addon' ? e.a : e.o;

function renderEquipment() {
  const eqEl = $('#eq');
  if (!eqEl) return;

  eqEl.innerHTML = E.map((e, i) => {
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

  if ($('#bundle-tag-wrap')) {
    $('#bundle-tag-wrap').innerHTML = rm === 'out' && keys.length >= 2
      ? `<div class="bundle-tag">Rental bundle, ${keys.length} items</div>` : '';
  }

  if ($('#cart')) {
    $('#cart').innerHTML = keys.length
      ? keys.map(i => `<li>
          <span>${esc(E[i].n)} ${E[i].d ? '(8 hrs)' : 'x ' + cart[i].q}
            <button type="button" class="lk" data-rm="${i}" aria-label="Remove ${esc(E[i].n)}">remove</button></span>
          <span>${fm(cart[i].q * px(E[i]))}</span></li>`).join('')
      : '<li><span class="mut">Nothing added yet</span><span></span></li>';
  }

  if ($('#ctt')) $('#ctt').textContent = fm(total);
  if ($('#fa')) $('#fa').hidden = rm !== 'addon';
  if ($('#fo')) $('#fo').hidden = rm === 'addon';
  if ($('#rmh')) {
    $('#rmh').textContent = rm === 'addon'
      ? 'Used inside the studio you booked. Tied to your booking reference.'
      : 'Taken out of the studio. Minimum rent is 8 hours.';
  }
  
  const rmEl = $('#rm'); if (rmEl) { $$('#rm button').forEach(x => {
      const mode = x.dataset.m || (x.textContent.toLowerCase().includes('outside') ? 'out' : 'addon');
      x.classList.toggle('on', mode === rm);
    });
  }
}

function renderAttachOptions() {
  const lbEl = $('#lb');
  if (!lbEl) return;
  const usable = MY_BOOKINGS.filter(b => b[5] === 'Confirmed' || b[5] === 'Pending' || b[5] === 'Active');
  lbEl.innerHTML = usable.length
    ? usable.map(b => `<option value="${b[0]}">${b[0]} - ${b[1]}, ${b[2]} ${b[3]}</option>`).join('')
    : '<option value="">No bookings yet. Book a studio first.</option>';
}

function renderMyBookings() {
  const mybkEl = $('#mybk');
  if (!mybkEl) return;
  mybkEl.innerHTML = tbl(
    ['Reference', 'Studio', 'Date', 'Time', 'Duration', 'Status', 'Payment', ''],
    MY_BOOKINGS.map(b => [
      ...b,
      b[5] === 'Confirmed' || b[5] === 'Pending' ? `<button type="button" class="btn sm line" data-act="Cancel" data-ref="${b[0]}">Cancel</button>` : ''
    ])
  );
}

function renderMyRentals() { 
  const myrentEl = $('#myrent'); if (!myrentEl) return; myrentEl.innerHTML = tbl(['Equipment', 'Qty', 'Rent type', 'Session or dates', 'Return date', 'Status'], MY_RENTALS.map(r => [r[0], String(r[1]), TY[r[2]], r[3], r[4], r[5]])); }  /* ====================================================================== INITIALIZATION & EVENT LISTENERS ====================================================================== */ document.addEventListener('DOMContentLoaded', async () => { initSession();    if (studioIndex(params.get('studio')) > -1 && S[studioIndex(params.get('studio'))][3] === 'Available') { book.studio = studioIndex(params.get('studio')); } else { const firstOpen = S.findIndex(s => s[3] === 'Available'); if (firstOpen > -1) book.studio = firstOpen; }    renderStudios(); updateSummary(); renderEquipment(); await loadCustomerData();    $$('.cnav [data-t]').forEach(b => b.addEventListener('click', () => {
    const name = Object.keys(TABS).find(k => TABS[k] === b.dataset.t);
    showTab(name);
    history.replaceState(null, '', '?tab=' + name);
  }));

  /* Studio Selection Handler */
  const csEl = $('#cs');
  if (csEl) {
    csEl.addEventListener('click', async e => {
      const c = e.target.closest('.pick');
      if (!c) return;

      const idx = Number(c.dataset.i);
      const selectedStudio = S[idx];

      if (selectedStudio && selectedStudio[3] === 'Available') {
        book.studio = idx;
        renderStudios();
        await updateTakenSlots();
        updateSummary();
      }
    });
  }

  /* Slot Selection Handler */
  const slotsEl = $('#slots');
  if (slotsEl) {
    slotsEl.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      book.slot = +b.dataset.s;
      renderSlots(); updateSummary();
    });
  }

  const durEl = $('#dur');
  if (durEl) durEl.addEventListener('change', e => { book.dur = +e.target.value; renderSlots(); updateSummary(); });
  
  const bdEl = $('#bd');
  if (bdEl) bdEl.addEventListener('change', async () => { await updateTakenSlots(); });

  const pmEl = $('#pm');
  if (pmEl) pmEl.addEventListener('change', updateSummary);

  /* Rental Mode Switch Handler */
  const rmContainer = $('#rm');
  if (rmContainer) {
    rmContainer.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      const m = btn.dataset.m || (btn.textContent.toLowerCase().includes('outside') ? 'out' : 'addon');
      rm = m; 
      cart = {};
      
      const msg = $('#rmsg');
      if (msg) msg.hidden = true;
      
      renderEquipment();
    });
  }

  /* Equipment Add to Cart Handler */
  const eqContainer = $('#eq');
  if (eqContainer) {
    eqContainer.addEventListener('click', e => {
      const addBtn = e.target.closest('[data-add]');
      if (!addBtn) return;
      
      const i = addBtn.dataset.add;
      const qtyInput = document.querySelector(`[data-q="${i}"]`);
      const max = E[i].s;
      
      cart[i] = { 
        q: qtyInput ? Math.min(Math.max(parseInt(qtyInput.value) || 1, 1), max) : 1, 
        h: E[i].d ? 8 : null 
      };
      
      renderCart();
    });
  }

  /* Cart Item Removal Handler */
  const cartContainer = $('#cart');
  if (cartContainer) {
    cartContainer.addEventListener('click', e => {
      const rmBtn = e.target.closest('[data-rm]');
      if (!rmBtn) return;
      
      delete cart[rmBtn.dataset.rm];
      renderCart();
    });
  }

  /* Studio Booking Form Submission */
  const bfEl = $('#bf');
  if (bfEl) {
    bfEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('#bmsg'), s = S[book.studio];
      const fail = t => { if(msg) { msg.className = 'alert'; msg.textContent = t; msg.hidden = false; } };

      if (!$('#bd').value) return fail('Pick a date.');
      if (book.slot === null) return fail('Pick a start time.');
      if (!$('#nm').value.trim()) return fail('Enter your name.');
      if (!$('#ph').value.trim()) return fail('Enter your phone number.');

      const ref = 'TOD-' + nextRef++;
      const [year, month, day] = $('#bd').value.split('-').map(Number);
      const d = new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const studioName = 'Studio ' + s[0];
      const customerName = $('#nm').value.trim();
      const phone = $('#ph').value.trim();
      const timeSlot = SLOTS[book.slot];
      const durationStr = book.dur + (book.dur > 1 ? ' hrs' : ' hr');

      const { error } = await _supabase.from('reservations').insert([{
        reference_code: ref,
        studio_name: studioName,
        customer_name: customerName,
        phone_number: phone,
        booking_date: d,
        time_slot: timeSlot,
        duration: durationStr,
        status: 'Pending',
        payment_status: 'Pending'
      }]);

      if (error) return fail('Failed to submit reservation: ' + error.message);

      if (msg) {
        msg.className = 'okmsg';
        msg.textContent = `Booking ${ref} submitted successfully!`;
        msg.hidden = false;
      }

      book.slot = null;
      await loadCustomerData();
      updateSummary();
    });
  }

  /* Equipment Rental Form Submission Handler */
  const rfEl = $('#rf');
  if (rfEl) {
    rfEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('#rmsg');
      const fail = t => { if(msg) { msg.className = 'alert'; msg.textContent = t; msg.hidden = false; } };

      const cartKeys = Object.keys(cart);
      if (cartKeys.length === 0) return fail('Please add at least one item to your cart.');

      let sessionOrDates = '';
      let returnDate = '-';

      if (rm === 'addon') {
        const lbVal = $('#lb') ? $('#lb').value : '';
        if (!lbVal) return fail('Please select a studio booking to attach your rental to.');
        sessionOrDates = 'Booking Ref: ' + lbVal;
      } else {
        const os = $('#os') ? $('#os').value : '';
        const oe = $('#oe') ? $('#oe').value : '';
        if (!os || !oe) return fail('Please select start and return dates for outside rental.');
        sessionOrDates = os;
        returnDate = oe;
      }

      const rentalInserts = cartKeys.map(i => ({
        equipment_name: E[i].n,
        quantity: cart[i].q,
        rent_type: rm === 'addon' ? 'a' : 'o',
        session_dates: sessionOrDates,
        return_date: returnDate,
        status: 'Pending'
      }));

      const { error } = await _supabase.from('rentals').insert(rentalInserts);

      if (error) return fail('Failed to submit rental request: ' + error.message);

      if (msg) {
        msg.className = 'okmsg';
        msg.textContent = 'Rental request submitted successfully!';
        msg.hidden = false;
      }

      cart = {};
      renderCart();
      await loadCustomerData();
    });
  }

  /* My Bookings Cancellation Handler */
  const mybkEl = $('#mybk');
  if (mybkEl) {
    mybkEl.addEventListener('click', async e => {
      const btn = e.target.closest('[data-act="Cancel"]');
      if (!btn) return;

      const refCode = btn.dataset.ref;
      if (!confirm(`Are you sure you want to cancel and delete booking ${refCode}?`)) return;

      const { error } = await _supabase
        .from('reservations')
        .delete()
        .eq('reference_code', refCode);

      if (error) {
        alert('Failed to delete booking: ' + error.message);
        return;
      }

      await loadCustomerData();
    });
  }

  showTab(params.get('tab') || 'book');
});