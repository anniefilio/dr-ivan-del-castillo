(function () {
 'use strict';
 const app = document.querySelector('[data-native-booking]');
 if (!app || !window.ClinicBookingCore) return;
 const core = window.ClinicBookingCore;
 const find = selector => app.querySelector(selector);
 const calendar = find('[data-booking-days]');
 const monthTitle = find('[data-booking-month]');
 const dateTitle = find('[data-booking-date]');
 const status = find('[data-booking-status]');
 const slotList = find('[data-booking-slots]');
 const form = find('[data-booking-form]');
 const result = find('[data-booking-result]');
 const submit = form.querySelector('button[type="submit"]');
 const today = core.dateKey(Date.now()), lastDay = core.addDays(today, 90);
 let selectedDay = today, month = today.slice(0, 7), selectedSlot = null, slots = [];
 let requestNumber = 0, availabilityRequest, submitting = false, bookingLocked = false, requestKey;
 let endpoint = null;
 const rawEndpoint = app.dataset.bookingEndpoint.trim();
 if (rawEndpoint) {
  try {
   const parsed = new URL(rawEndpoint);
   if (parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.search && !parsed.hash) endpoint = parsed.href.replace(/\/$/, '');
  } catch {}
 }
 const longDate = day => new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeZone: 'UTC' }).format(core.parseDay(day));
 const timeLabel = start => new Intl.DateTimeFormat('es-MX', { timeZone: core.ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(start));
 const setStatus = text => { status.textContent = text; };
 const clearSelection = () => {
  selectedSlot = null; requestKey = null; form.hidden = true; result.hidden = true;
  form.reset(); submit.disabled = false;
 };
 function renderMonth(focusDay) {
  monthTitle.textContent = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(core.parseDay(`${month}-01`));
  find('[data-booking-prev]').disabled = month <= today.slice(0, 7);
  find('[data-booking-next]').disabled = month >= lastDay.slice(0, 7);
  calendar.replaceChildren();
  const inRange = core.monthCells(month).filter(day => day.startsWith(month) && day >= today && day <= lastDay);
  const active = focusDay || (selectedDay.startsWith(month) ? selectedDay : inRange[0]);
  for (const day of core.monthCells(month)) {
   if (!day.startsWith(month)) {
    const spacer = document.createElement('span'); spacer.setAttribute('aria-hidden', 'true'); calendar.append(spacer); continue;
   }
   const button = document.createElement('button');
   button.type = 'button'; button.dataset.bookingDay = day;
   button.textContent = String(Number(day.slice(-2)));
   button.setAttribute('aria-label', longDate(day));
   button.setAttribute('aria-pressed', String(day === selectedDay));
   if (day === today) button.setAttribute('aria-current', 'date');
   button.disabled = day < today || day > lastDay;
   button.tabIndex = day === active && !button.disabled ? 0 : -1;
   calendar.append(button);
  }
  if (focusDay) calendar.querySelector(`[data-booking-day="${focusDay}"]`)?.focus({ preventScroll: true });
 }
 async function loadAvailability() {
  const ownRequest = ++requestNumber, requestedDay = selectedDay;
  availabilityRequest?.abort(); availabilityRequest = new AbortController();
  const controller = availabilityRequest;
  clearSelection(); slots = []; slotList.replaceChildren();
  dateTitle.textContent = longDate(selectedDay);
  if (!endpoint) {
   setStatus('La reserva en línea estará disponible próximamente. Por ahora, solicita tu cita por WhatsApp.'); return;
  }
  setStatus('Consultando horarios disponibles…'); slotList.setAttribute('aria-busy', 'true');
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
   const response = await fetch(`${endpoint}/availability?date=${encodeURIComponent(requestedDay)}`, { signal: controller.signal, credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' } });
   if (!response.ok) throw new Error('Availability unavailable');
   const payload = await response.json();
   if (ownRequest !== requestNumber) return;
   slots = core.validateSlots(payload, requestedDay);
   if (!slots.length) { setStatus('No hay horarios disponibles para esta fecha. Elige otro día o contacta al consultorio.'); return; }
   setStatus('Selecciona un horario. Hora de Ciudad de México.');
   for (const slot of slots) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.bookingSlot = slot.id;
    button.textContent = timeLabel(slot.start); button.setAttribute('aria-pressed', 'false');
    slotList.append(button);
   }
  } catch (error) {
   if (ownRequest !== requestNumber) return;
   setStatus('No pudimos consultar la agenda. Intenta con otra fecha o solicita tu cita por WhatsApp.');
  } finally {
   window.clearTimeout(timeout);
   if (ownRequest === requestNumber) slotList.removeAttribute('aria-busy');
  }
 }
 calendar.addEventListener('click', event => {
  const button = event.target.closest('[data-booking-day]');
  if (!button || button.disabled || submitting || bookingLocked) return;
  selectedDay = button.dataset.bookingDay; renderMonth(); loadAvailability();
 });
 calendar.addEventListener('keydown', event => {
  const button = event.target.closest('[data-booking-day]');
  if (!button || submitting || bookingLocked) return;
  const movement = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (!(event.key in movement)) return;
  event.preventDefault(); const day = core.addDays(button.dataset.bookingDay, movement[event.key]);
  if (day < today || day > lastDay) return;
  month = day.slice(0, 7); renderMonth(day);
 });
 for (const [selector, step] of [['[data-booking-prev]', -1], ['[data-booking-next]', 1]]) {
  find(selector).addEventListener('click', () => {
   if (submitting || bookingLocked) return;
   const nextMonth = core.shiftMonth(month, step);
   if (nextMonth < today.slice(0, 7) || nextMonth > lastDay.slice(0, 7)) return;
   month = nextMonth; renderMonth();
  });
 }
 slotList.addEventListener('click', event => {
  const button = event.target.closest('[data-booking-slot]');
  if (!button || submitting || bookingLocked) return;
  selectedSlot = slots.find(slot => slot.id === button.dataset.bookingSlot);
  if (!selectedSlot) return;
  requestKey = crypto.randomUUID();
  slotList.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  find('[data-booking-selection]').textContent = `${longDate(selectedDay)}, ${timeLabel(selectedSlot.start)}. Hora de Ciudad de México.`;
  result.hidden = true; form.hidden = false;
 });
 form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || bookingLocked || !endpoint || !selectedSlot || !form.reportValidity()) return;
  const surname = form.elements.namedItem('surname');
  const name = form.elements.namedItem('name'), phone = form.elements.namedItem('phone'), email = form.elements.namedItem('email');
  name.setCustomValidity(name.value.trim().length >= 2 ? '' : 'Escribe tu nombre.');
  surname.setCustomValidity(surname.value.trim().length >= 2 ? '' : 'Escribe tus apellidos.');
  phone.setCustomValidity(/^\+?[\d\s()-]+$/.test(phone.value.trim()) && /^\d{10,15}$/.test(phone.value.replace(/\D/g, '')) ? '' : 'Escribe un teléfono de contacto válido.');
  if (!form.reportValidity()) return;
  submitting = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
  setStatus('Enviando tu solicitud de reserva…');
  const slot = selectedSlot;
  const bookingController = new AbortController();
  const bookingTimeout = window.setTimeout(() => bookingController.abort(), 20000);
  try {
   const response = await fetch(`${endpoint}/appointments`, { method: 'POST', signal: bookingController.signal, credentials: 'omit', cache: 'no-store', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Idempotency-Key': requestKey }, body: JSON.stringify({ slotId: slot.id, patient: { name: name.value.trim(), surname: surname.value.trim(), phone: phone.value.trim(), email: email.value.trim() }, privacyAccepted: true }) });
   if (response.status === 409) { submitting = false; await loadAvailability(); setStatus('Ese horario acaba de ocuparse. Selecciona otro horario disponible.'); return; }
   if (!response.ok) throw new Error('Reservation not confirmed');
   const payload = await response.json();
   if (!core.confirmedBooking(payload, slot)) throw new Error('Invalid confirmation');
   find('[data-booking-reference]').textContent = payload.reference;
   find('[data-booking-confirmed-date]').textContent = `${longDate(selectedDay)}, ${timeLabel(slot.start)}.`;
   form.reset(); form.hidden = true; slotList.replaceChildren();
   result.hidden = false; result.focus({ preventScroll: true });
   bookingLocked = true;
   setStatus('Tu cita está confirmada.');
  } catch {
   bookingLocked = true;
   setStatus('No pudimos verificar la confirmación. Contacta al consultorio antes de volver a enviar la solicitud.');
   // Keep resubmission disabled after an uncertain response to avoid duplicate bookings.
  } finally { window.clearTimeout(bookingTimeout); submitting = false; form.removeAttribute('aria-busy'); }
 });
 form.addEventListener('input', event => event.target.setCustomValidity?.(''));
 if (endpoint) find('.booking-pending').hidden = true;
 app.hidden = false; renderMonth(); loadAvailability();
})();
