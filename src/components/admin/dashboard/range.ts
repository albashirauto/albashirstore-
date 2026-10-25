// Date ranges for the dashboard. `to` is exclusive (start of the day after the last day).

export type Range = { from: Date; to: Date };
export type Grain = "day" | "week" | "month";

export const PRESETS = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This week" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "lastmonth", label: "Last month" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom" },
] as const;
export type Preset = (typeof PRESETS)[number]["key"];

const day0 = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function presetRange(p: Preset, custom?: { from: string; to: string }): Range {
  const today = day0(new Date());
  const tomorrow = addDays(today, 1);
  switch (p) {
    case "all": return { from: new Date(2020, 0, 1), to: tomorrow };
    case "today": return { from: today, to: tomorrow };
    case "week": return { from: addDays(today, -((today.getDay() + 6) % 7)), to: tomorrow };
    case "yesterday": return { from: addDays(today, -1), to: today };
    case "7d": return { from: addDays(today, -6), to: tomorrow };
    case "30d": return { from: addDays(today, -29), to: tomorrow };
    case "month": return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: tomorrow };
    case "lastmonth": return { from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 1) };
    case "year": return { from: new Date(today.getFullYear(), 0, 1), to: tomorrow };
    case "custom": {
      const f = custom?.from ? day0(new Date(custom.from)) : addDays(today, -6);
      const t = custom?.to ? addDays(day0(new Date(custom.to)), 1) : tomorrow;
      return f < t ? { from: f, to: t } : { from: addDays(t, -1), to: addDays(f, 1) };
    }
  }
}

/** Same-length period right before, for "vs previous period". */
export const previous = (r: Range): Range => ({ from: new Date(r.from.getTime() - (r.to.getTime() - r.from.getTime())), to: r.from });

export const days = (r: Range) => Math.round((r.to.getTime() - r.from.getTime()) / 86400000);

export const autoGrain = (r: Range): Grain => (days(r) <= 31 ? "day" : days(r) <= 120 ? "week" : "month");

/** Split the range into chart buckets. Weeks start on Monday. */
export function buckets(r: Range, g: Grain): Range[] {
  const out: Range[] = [];
  let cur = new Date(r.from);
  if (g === "week") { const dow = (cur.getDay() + 6) % 7; cur = addDays(cur, -dow); }
  if (g === "month") cur = new Date(cur.getFullYear(), cur.getMonth(), 1);
  while (cur < r.to && out.length < 400) {
    const next = g === "day" ? addDays(cur, 1) : g === "week" ? addDays(cur, 7) : new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    out.push({ from: cur < r.from ? r.from : cur, to: next > r.to ? r.to : next });
    cur = next;
  }
  return out;
}

export const bucketLabel = (b: Range, g: Grain) =>
  g === "month" ? b.from.toLocaleDateString("en-PK", { month: "short", year: "2-digit" }) : b.from.toLocaleDateString("en-PK", { day: "numeric", month: "short" });

export const rangeLabel = (r: Range) => {
  if (r.from.getFullYear() <= 2020) return "All time";
  const last = addDays(r.to, -1);
  const f = (d: Date) => d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  return r.from.getTime() === last.getTime() ? f(r.from) : `${f(r.from)} – ${f(last)}`;
};

export const inRange = (iso: string, r: Range) => { const t = new Date(iso); return t >= r.from && t < r.to; };

/** yyyy-mm-dd for <input type="date"> */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
