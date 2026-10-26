// Social networks for Settings > Social media and the footer icons.
// Brand marks come from simple-icons (CC0); LinkedIn and Daraz aren't in it, so they use a lucide fallback.
import {
  siBluesky, siDiscord, siFacebook, siGooglemaps, siInstagram, siMessenger, siPinterest, siReddit, siSnapchat,
  siTelegram, siThreads, siTiktok, siWhatsapp, siX, siYoutube, siEtsy, siGithub, siLinktree, siMedium, siQuora,
  siShopify, siSignal, siSpotify, siTrustpilot, siTumblr, siTwitch, siViber, siVimeo, siFoodpanda, siDailymotion,
} from "simple-icons";

type SI = { path: string; hex: string };
export type Network = { key: string; label: string; ph: string; color: string; icon: SI | "linkedin" | "daraz" | "link"; match?: RegExp };

const n = (key: string, label: string, ph: string, icon: SI | "linkedin" | "daraz", match: RegExp, color?: string): Network =>
  ({ key, label, ph, icon, match, color: color ?? `#${(icon as SI).hex}` });

/** Fixed fields in Settings (each is a settings key). Order = order in the footer. */
export const NETWORKS: Network[] = [
  n("facebook", "Facebook", "https://facebook.com/yourpage", siFacebook, /facebook\.com|fb\.(com|me)/),
  n("instagram", "Instagram", "https://instagram.com/yourpage", siInstagram, /instagram\.com|instagr\.am/, "#E4405F"),
  n("tiktok", "TikTok", "https://tiktok.com/@yourpage", siTiktok, /tiktok\.com/, "#000000"),
  n("youtube", "YouTube", "https://youtube.com/@yourchannel", siYoutube, /youtube\.com|youtu\.be/),
  n("whatsapp_channel", "WhatsApp channel", "https://whatsapp.com/channel/…", siWhatsapp, /whatsapp\.com|wa\.me/),
  n("x", "X (Twitter)", "https://x.com/yourpage", siX, /(^|\/\/|\.)(x|twitter)\.com/, "#000000"),
  n("threads", "Threads", "https://threads.net/@yourpage", siThreads, /threads\.(net|com)/, "#000000"),
  n("linkedin", "LinkedIn", "https://linkedin.com/company/yourpage", "linkedin", /linkedin\.com/, "#0A66C2"),
  n("pinterest", "Pinterest", "https://pinterest.com/yourpage", siPinterest, /pinterest\.|pin\.it/),
  n("snapchat", "Snapchat", "https://snapchat.com/add/yourname", siSnapchat, /snapchat\.com/, "#FFC400"),
  n("telegram", "Telegram", "https://t.me/yourchannel", siTelegram, /t\.me|telegram\./),
  n("messenger", "Messenger", "https://m.me/yourpage", siMessenger, /m\.me|messenger\.com/),
  n("google_maps", "Google Maps / reviews", "https://maps.app.goo.gl/…", siGooglemaps, /maps\.app\.goo\.gl|google\.[a-z.]+\/maps|g\.page/),
  n("daraz", "Daraz store", "https://www.daraz.pk/shop/…", "daraz", /daraz\./, "#F85606"),
  n("reddit", "Reddit", "https://reddit.com/r/…", siReddit, /reddit\.com/),
  n("discord", "Discord", "https://discord.gg/…", siDiscord, /discord\.(gg|com)/),
  n("bluesky", "Bluesky", "https://bsky.app/profile/…", siBluesky, /bsky\.app/),
];
export const SOCIAL_KEYS = NETWORKS.map((x) => x.key);

/** Extra brands only used to pick an icon for a custom link. */
const EXTRA: Network[] = [
  n("_etsy", "Etsy", "", siEtsy, /etsy\.com/), n("_github", "GitHub", "", siGithub, /github\.com/, "#181717"),
  n("_linktree", "Linktree", "", siLinktree, /linktr\.ee/), n("_medium", "Medium", "", siMedium, /medium\.com/, "#000000"),
  n("_quora", "Quora", "", siQuora, /quora\.com/), n("_shopify", "Shopify", "", siShopify, /myshopify\.com/),
  n("_signal", "Signal", "", siSignal, /signal\.(me|group)/), n("_spotify", "Spotify", "", siSpotify, /spotify\.com/),
  n("_trustpilot", "Trustpilot", "", siTrustpilot, /trustpilot\.com/), n("_tumblr", "Tumblr", "", siTumblr, /tumblr\.com/),
  n("_twitch", "Twitch", "", siTwitch, /twitch\.tv/), n("_viber", "Viber", "", siViber, /viber\.(com|me)/),
  n("_vimeo", "Vimeo", "", siVimeo, /vimeo\.com/), n("_foodpanda", "foodpanda", "", siFoodpanda, /foodpanda\./),
  n("_dailymotion", "Dailymotion", "", siDailymotion, /dailymotion\.com/, "#0A0A0A"),
];

export type CustomLink = { label: string; url: string };
export const LINK: Network = { key: "_link", label: "Link", ph: "", color: "#1d4fd8", icon: "link" };

/** Best icon for any URL (custom links): a known brand, else a plain link icon. */
export const networkFor = (url: string): Network => [...NETWORKS, ...EXTRA].find((x) => x.match?.test(url.toLowerCase())) ?? LINK;

/** Custom links saved as JSON in the social_custom setting. keepEmpty: the admin form, where a new row has no address yet. */
export const parseCustom = (raw?: string, keepEmpty = false): CustomLink[] => {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.url === "string" && (keepEmpty || validUrl(x.url))).map((x) => ({ label: String(x.label ?? ""), url: x.url })) : [];
  } catch { return []; }
};
export const validUrl = (u: string) => /^https?:\/\/\S+\.\S+/.test(u);
