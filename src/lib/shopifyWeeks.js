import { shopifyConfig } from '../config/shopify';

const CYCLE_LENGTH = 13;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function mondayOf(dateLike) {
  let d;
  if (typeof dateLike === 'string') {
    // "YYYY-MM-DD" must be parsed as a LOCAL date, not handed to
    // `new Date(string)` -- that parses date-only ISO strings as UTC
    // midnight, which in any negative UTC-offset timezone (all of the US)
    // rolls back to the previous local calendar day, and therefore the
    // previous Monday once floored here. This silently added one extra
    // week to every week-collection lookup (confirmed 2026-07-14: the
    // config's weekCollectionAnchor.deliveryDate string was hitting this
    // exact bug, making every computed week number 1 too high).
    const [y, m, day] = dateLike.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(dateLike);
  }
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Menu-rotation position for a given offset (in weeks) from the configured
// anchor. Wraps 1..13 per the handoff doc's 13-week cycle (section 3c).
function collectionNumberForOffset(weeksFromAnchor) {
  const { number } = shopifyConfig.weekCollectionAnchor;
  const zeroBased = ((number - 1 + weeksFromAnchor) % CYCLE_LENGTH + CYCLE_LENGTH) % CYCLE_LENGTH;
  return zeroBased + 1;
}

// Earliest Monday the kitchen can still deliver for, given today's date, as
// a Date. Mirrors handoff doc section 4a's buffer-day cutoff exactly
// (Mon/Tue orders push to the following Monday).
function earliestDeliverableMondayDate(now) {
  const d = new Date(now);
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  return mondayOf(d);
}

export function earliestDeliverableMonday(now = new Date()) {
  return formatDate(earliestDeliverableMondayDate(now));
}

// Returns the earliest orderable week's collection plus `lookaheadWeeks - 1`
// weeks after it, each with its handle and the Monday it will deliver on.
// Menus are only released ~2 weeks ahead, so this starts from the earliest
// deliverable Monday (buffer-aware), not "today's calendar week" -- the
// current calendar week is usually already past its ordering cutoff and
// shouldn't be offered. Confirmed against a live report of a real user
// seeing an unorderable "current week" tab (2026-07-08): today (a Tuesday)
// was showing "Week of Jul 6" alongside Jul 13/20, when only Jul 13/20
// should appear.
export function getWeekPlan(now = new Date(), lookaheadWeeks = 2) {
  const anchorMonday = mondayOf(shopifyConfig.weekCollectionAnchor.deliveryDate);
  const startMonday = earliestDeliverableMondayDate(now);
  const weeksFromAnchor = Math.round((startMonday - anchorMonday) / MS_PER_WEEK);

  const weeks = [];
  for (let i = 0; i < lookaheadWeeks; i++) {
    const weekNumber = collectionNumberForOffset(weeksFromAnchor + i);
    const monday = new Date(startMonday);
    monday.setDate(monday.getDate() + 7 * i);
    weeks.push({
      id: `w${i + 1}`,
      handle: `week-${weekNumber}`,
      weekNumber,
      deliveryDate: formatDate(monday),
      label: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    });
  }
  return weeks;
}

// _setWeek for a real order: the later of (a) the kitchen's earliest
// deliverable Monday and (b) the Monday belonging to the menu week the
// customer actually selected meals from -- so the delivery date always
// matches the menu those meals came from, never falls inside the kitchen's
// cutoff buffer. Unverified combined case; see note on getWeekPlan above.
export function setWeekForSelection(selectedWeekDeliveryDate, now = new Date()) {
  const earliest = earliestDeliverableMonday(now);
  return selectedWeekDeliveryDate > earliest ? selectedWeekDeliveryDate : earliest;
}
