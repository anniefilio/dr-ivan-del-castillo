/* Pure calendar and availability rules. No patient data is stored here. */
(function (root) {
 'use strict';
 const ZONE = 'America/Mexico_City';
 const dateKey = value => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = name => parts.find(p => p.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
 };
 const parseDay = day => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Invalid date');
  const date = new Date(`${day}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) throw new Error('Invalid date');
  return date;
 };
 const addDays = (day, count) => {
  const date = parseDay(day); date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
 };
 const monthCells = month => {
  const first = parseDay(`${month}-01`);
  const offset = (first.getUTCDay() + 6) % 7;
  const start = addDays(`${month}-01`, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
 };
 const shiftMonth = (month, delta) => {
  const date = parseDay(`${month}-01`); date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
 };
 const validateSlots = (payload, day, now = Date.now()) => {
  if (payload?.date !== day || payload.timeZone !== ZONE || !Array.isArray(payload.slots)) throw new Error('Invalid availability');
  const ids = new Set();
  return payload.slots.filter(slot => {
   if (!slot || typeof slot.id !== 'string' || !slot.id.trim() || ids.has(slot.id)) return false;
   if (typeof slot.start !== 'string' || !/(Z|[+-]\d\d:\d\d)$/.test(slot.start)) return false;
   const start = Date.parse(slot.start);
   if (!Number.isFinite(start) || start <= now || dateKey(start) !== day) return false;
   ids.add(slot.id); return true;
  }).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
 };
 const confirmedBooking = (payload, slot) => payload?.status === 'confirmed' && typeof payload.reference === 'string' && !!payload.reference.trim() && payload.slotId === slot.id && Date.parse(payload.start) === Date.parse(slot.start);
 root.ClinicBookingCore = Object.freeze({ ZONE, dateKey, parseDay, addDays, monthCells, shiftMonth, validateSlots, confirmedBooking });
})(typeof window === 'undefined' ? globalThis : window);
