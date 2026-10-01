// Dates are stored as midnight UTC of the Indian calendar date, so a stored
// value always means "this calendar day in India" regardless of server timezone.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date in India, as midnight UTC. */
export function istToday(now: Date = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

/** Current time in India as minutes since midnight. */
export function istMinutesNow(now: Date = new Date()): number {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

/** 1 = Monday ... 7 = Sunday, for a date stored as midnight UTC. */
export function isoWeekday(d: Date): number {
  const w = d.getUTCDay();
  return w === 0 ? 7 : w;
}

/** Monday of the week containing `d`. */
export function weekStart(d: Date): Date {
  return addDays(d, -(isoWeekday(d) - 1));
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...opts });
const fmtDay = fmt({ weekday: "short", day: "numeric", month: "short" });
const fmtLong = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtShort = fmt({ day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** "Thu, 1 Oct" */
export const formatDay = (d: Date) => fmtDay.format(d);
/** "Thursday, 1 October 2026" */
export const formatLong = (d: Date) => fmtLong.format(d);
/** "1 Oct 2026" */
export const formatDate = (d: Date) => fmtShort.format(d);
/** Real timestamps (not calendar days): "1 Oct, 3:41 pm" in IST. */
export const formatDateTime = (d: Date) => fmtDateTime.format(d);

export function sameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}
