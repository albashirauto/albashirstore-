"use client";

import { useEffect } from "react";
import { resolveMissing } from "@/app/actions";

/** On the 404 page: ask the database for a redirect (Admin > Redirects). Found = go there; not found = it is logged as a 404. */
export default function RedirectCheck() {
  useEffect(() => {
    resolveMissing(window.location.pathname, document.referrer).then((to) => {
      if (to && to !== window.location.pathname) window.location.replace(to + window.location.search + window.location.hash);
    }).catch(() => {});
  }, []);
  return null;
}
