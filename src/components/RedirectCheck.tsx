"use client";

import { useEffect } from "react";

/** On the 404 page: ask for a redirect (Admin > Redirects). Found = go there; not found = it is logged as a 404. */
export default function RedirectCheck() {
  useEffect(() => {
    fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname, ref: document.referrer }) })
      .then((r) => r.json())
      .then(({ to }: { to: string | null }) => { if (to && to !== window.location.pathname) window.location.replace(to + window.location.search + window.location.hash); })
      .catch(() => {});
  }, []);
  return null;
}
