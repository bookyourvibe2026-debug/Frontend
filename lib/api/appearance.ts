import { apiRequest } from "./client";
import { isThemeId, DEFAULT_THEME, type ThemeId } from "@/lib/themes";

/** Public — the live site-wide theme every visitor's browser should render, no auth required. */
export async function getSiteTheme(): Promise<ThemeId> {
  const res = await apiRequest<{ theme: string }>("/site-appearance");
  return isThemeId(res.theme) ? res.theme : DEFAULT_THEME;
}
