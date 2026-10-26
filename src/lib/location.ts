// Shop location from Store settings. Exact coordinates win over the map link, which wins over the address text.
type S = Record<string, string | undefined>;

export const coords = (s: S) => {
  const lat = Number(s.latitude), lng = Number(s.longitude);
  return s.latitude && s.longitude && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
};

/** Embedded Google map (no API key needed). */
export const mapEmbed = (s: S) => {
  const c = coords(s);
  return `https://maps.google.com/maps?q=${c ? `${c.lat},${c.lng}` : encodeURIComponent(s.address ?? "")}&z=${c ? 17 : 15}&output=embed`;
};

/** "Get directions" link. */
export const directionsUrl = (s: S) => {
  const c = coords(s);
  if (c) return `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
  return s.map_link || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address ?? "")}`;
};

/** Pull coordinates out of a pasted Google Maps link (…/@31.12,73.45,17z or ?q=31.12,73.45 or !3d31.12!4d73.45). */
export function coordsFromLink(link: string) {
  const m = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || link.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  return m ? { lat: m[1], lng: m[2] } : null;
}

/** Owners / contacts (Store settings > Team): contact1_… to contact4_… */
export const teamOf = (s: S) =>
  [1, 2, 3, 4].map((n) => ({
    name: s[`contact${n}_name`] ?? "", role: s[`contact${n}_role`] ?? "", phone: s[`contact${n}_phone`] ?? "", whatsapp: s[`contact${n}_whatsapp`] !== "no",
    photo: s[`contact${n}_photo`] ?? "", bio: s[`contact${n}_bio`] ?? "", quote: s[`contact${n}_quote`] ?? "",
  })).filter((p) => p.phone);
export type Owner = ReturnType<typeof teamOf>[number];
