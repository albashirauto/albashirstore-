/** How a brand logo fills its box: stretch (default) · cover = fill and crop · contain = original shape. */
export type LogoFit = "stretch" | "cover" | "contain";

export const fitClass = (fit?: string | null) => (fit === "contain" ? "object-contain" : fit === "cover" ? "object-cover" : "object-fill");
export const isContain = (fit?: string | null) => fit === "contain";
