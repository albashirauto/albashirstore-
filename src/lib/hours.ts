// Opening hours from Store settings, one line per day group, e.g.
//   Saturday – Thursday: 8:00 am – 8:00 pm
//   Friday: 8:00 am – 1:00 pm
//   Sunday: Closed
// Lines are shown as typed; when they can be read, the site also shows "Open now / Closed" (Pakistan time).

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const LABEL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "8:00 am" | "8 pm" | "20:00" -> minutes after midnight */
function minutes(t: string) {
  const m = t.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  return h > 24 || min > 59 ? null : h * 60 + min;
}

const day = (s: string) => DAYS.indexOf(s.trim().toLowerCase().slice(0, 3));

/** Week schedule: index 0 = Sunday, null = closed that day. Returns null if any line can't be read. */
export function parseHours(text?: string) {
  const lines = (text ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const week: ({ open: number; close: number } | null)[] = Array(7).fill(null);
  for (const line of lines) {
    const m = line.match(/^([a-z]+)(?:\s*[–—-]\s*([a-z]+))?\s*:\s*(.+)$/i);
    if (!m) return null;
    const from = day(m[1]), to = m[2] ? day(m[2]) : from;
    if (from < 0 || to < 0) return null;
    let slot: { open: number; close: number } | null = null;
    if (!/^closed$/i.test(m[3].trim())) {
      const t = m[3].split(/\s*[–—-]\s*|\s+to\s+/i);
      const open = t.length === 2 ? minutes(t[0]) : null, close = t.length === 2 ? minutes(t[1]) : null;
      if (open === null || close === null || close <= open) return null;
      slot = { open, close };
    }
    for (let d = from; ; d = (d + 1) % 7) { week[d] = slot; if (d === to) break; }
  }
  return week;
}

const clock = (m: number) => {
  const h = Math.floor(m / 60) % 24, min = m % 60;
  return `${h % 12 || 12}${min ? `:${String(min).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
};

/** Is the shop open right now (Asia/Karachi)? Null when the hours can't be read. */
export function openStatus(text?: string, now = new Date()) {
  const week = parseHours(text);
  if (!week) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
    .formatToParts(now).map((p) => [p.type, p.value]));
  const today = day(parts.weekday), at = Number(parts.hour) * 60 + Number(parts.minute);
  const slot = week[today];
  if (slot && at >= slot.open && at < slot.close) return { open: true, text: `Closes ${clock(slot.close)}`, soon: slot.close - at <= 60 };
  for (let i = 0; i < 8; i++) {
    const d = (today + i) % 7, s = week[d];
    if (!s || (i === 0 && at >= s.open)) continue;
    return { open: false, text: `Opens ${clock(s.open)}${i === 0 ? "" : i === 1 ? " tomorrow" : ` ${LABEL[d]}`}`, soon: false };
  }
  return { open: false, text: "", soon: false };
}
