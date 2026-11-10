import type { CSSProperties } from "react";
export type FontFormat = "woff2" | "woff" | "ttf" | "otf";
export type InvitationCustomFont = { id: string; ownerId: string; name: string; format: FontFormat };
export type CustomFontTheme = { customHeadingFont?: InvitationCustomFont; customBodyFont?: InvitationCustomFont };
export const fontBucket = "invitation-custom-fonts";
export const fontMaxBytes = 2 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function normalizeCustomFont(value: unknown): InvitationCustomFont | undefined {
  if (!value || typeof value !== "object") return undefined;
  const font = value as Record<string, unknown>;
  if (typeof font.id !== "string" || !uuid.test(font.id) || typeof font.ownerId !== "string" || !uuid.test(font.ownerId)
    || typeof font.name !== "string" || !font.name.trim() || font.name.length > 80
    || !["woff2", "woff", "ttf", "otf"].includes(font.format as string)) return undefined;
  return { id: font.id.toLowerCase(), ownerId: font.ownerId.toLowerCase(), name: font.name, format: font.format as FontFormat };
}
export const customFontFamily = (font: InvitationCustomFont) => `InvitationFont_${font.id.replace(/-/g, "")}`;
export const customFontPath = (font: InvitationCustomFont) => `${font.ownerId}/${font.id}.${font.format}`;
export function customFontUrl(font: InvitationCustomFont) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  const url = new URL(base);
  if (url.protocol !== "https:") return "";
  return `${url.origin}/storage/v1/object/public/${fontBucket}/${customFontPath(font)}`;
}
export function customFontRules(theme: CustomFontTheme) {
  const fonts = [normalizeCustomFont(theme.customHeadingFont), normalizeCustomFont(theme.customBodyFont)].filter((font): font is InvitationCustomFont => Boolean(font));
  return fonts.filter((font,index) => fonts.findIndex(item => item.id === font.id) === index).map(font => {
    const url = customFontUrl(font);
    if (!url) return "";
    const format = font.format === "ttf" ? "truetype" : font.format === "otf" ? "opentype" : font.format;
    return `@font-face{font-family:"${customFontFamily(font)}";src:url("${url}") format("${format}");font-style:normal;font-weight:400;font-display:swap;}`;
  }).join("");
}
export function customFontStyles(theme: CustomFontTheme): CSSProperties {
  const heading = normalizeCustomFont(theme.customHeadingFont);
  const body = normalizeCustomFont(theme.customBodyFont);
  return {
    ...(heading ? { "--custom-heading-font": `"${customFontFamily(heading)}",var(--invitation-font-family,Georgia,serif)` } : {}),
    ...(body ? { "--custom-body-font": `"${customFontFamily(body)}",var(--invitation-font-family,Georgia,serif)` } : {})
  } as CSSProperties;
}
export function customFontAttributes(theme: CustomFontTheme) {
  return {
    "data-custom-heading-font": normalizeCustomFont(theme.customHeadingFont) ? "true" : undefined,
    "data-custom-body-font": normalizeCustomFont(theme.customBodyFont) ? "true" : undefined
  };
}
