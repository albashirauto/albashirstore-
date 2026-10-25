/** YouTube watch / share / shorts / embed link -> 11-character video id (null if not YouTube). */
export const youtubeId = (url: string) => url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)?.[1] ?? null;
