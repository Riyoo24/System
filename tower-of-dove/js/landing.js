/* ===== Tower of Dove - landing page script (index.html) =====
   Needs js/data.js loaded first. */

/* ---------- "Right now at the studio" ---------- */
$('#nowl').innerHTML = S.map(s =>
  `<li><span><i class="lamp ${s[3] === 'Occupied' ? 'live' : ''}"></i>Studio ${s[0]}</span><small>${
    s[3] === 'Occupied' ? 'In session until 4:00 PM' : s[3] === 'Available' ? 'Open for bookings' : 'Closed today'
  }</small></li>`).join('');

/* ---------- Quick booking dropdown ---------- */
$('#qs').innerHTML = S.map((s, i) => `<option value="${i}">Studio ${s[0]}, ₱${s[2]}/hr</option>`).join('');

/* ---------- Studio cards ---------- */
$('#ls').innerHTML = S.map(s => `<div class="card">${ph(s)}
    <div class="row"><h3>Studio ${s[0]}</h3>${bd(s[3])}</div>
    <p class="mut">${s[1]}</p>
    <div class="row" style="margin-top:12px">
      <span><b>₱${s[2]}</b> <span class="mut">per hour</span></span>
      ${isClosed(s)
        ? '<button class="btn gold" disabled>Closed</button>'
        : `<a class="btn gold" href="${bookUrl(s[0])}">Book now</a>`}
    </div></div>`).join('');

/* ---------- Equipment cards ---------- */
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
    <a class="btn gold full" style="margin-top:0" href="${rentUrl(i)}">Rent</a></div>`;
}).join('');

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
