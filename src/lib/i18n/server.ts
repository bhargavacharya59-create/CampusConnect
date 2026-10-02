import { cookies } from "next/headers";
import type { Lang } from "./translations";
import { LANG_COOKIE, parseLang } from "./lang";

/** The language the parent picked (server components and actions only). */
export function getServerLang(): Lang {
  return parseLang(cookies().get(LANG_COOKIE)?.value);
}
