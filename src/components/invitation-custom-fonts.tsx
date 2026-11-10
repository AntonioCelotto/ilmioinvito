import { customFontRules, type CustomFontTheme } from "@/lib/fonts/shared";
export function InvitationCustomFonts({ theme }: { theme: CustomFontTheme }) {
  const rules = customFontRules(theme);
  return rules ? <style>{rules}</style> : null;
}
