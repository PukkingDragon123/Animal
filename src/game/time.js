// Day/time system: day counter + hour, named slots, deadlines, events.
export const SLOTS = [
  { id: 'morning', name: 'Morning', from: 6, to: 11.5 },
  { id: 'lunch', name: 'Lunch', from: 11.5, to: 13 },
  { id: 'afternoon', name: 'Afternoon', from: 13, to: 17.5 },
  { id: 'evening', name: 'Evening', from: 17.5, to: 20.5 },
  { id: 'night', name: 'Night', from: 20.5, to: 30 },
];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function slotOf(hour) { const h = hour < 6 ? hour + 24 : hour; return SLOTS.find((s) => h >= s.from && h < s.to) || SLOTS[4]; }
export function clockText(t) {
  const h = Math.floor(t.hour) % 24, m = Math.floor((t.hour % 1) * 60);
  return `Day ${t.day} · ${WEEKDAYS[(t.day - 1) % 7]} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
// Advance time; returns list of crossed slot ids and whether the day rolled over.
export function advance(t, hours) {
  const before = slotOf(t.hour).id;
  t.hour += hours;
  let rolled = false;
  while (t.hour >= 24) { t.hour -= 24; t.day++; rolled = true; }
  const after = slotOf(t.hour).id;
  return { changed: before !== after || rolled, rolled, slot: after };
}
export function setTime(t, day, hour) { t.day = day; t.hour = hour; }
export function deadlineLeft(t, dl) { return (dl.day - t.day) * 24 + (dl.hour - t.hour); }
