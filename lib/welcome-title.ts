import { SITE_NAME } from "@/lib/constants";

export const VISIT_MARKER = "sylvanova-has-visited";

export function getWelcomeTitle(hasVisited: boolean): string {
  return `${SITE_NAME} — ${hasVisited ? "Welcome Back!" : "Welcome Home!"}`;
}

/** Runs before paint so the tab title matches visit state immediately. */
export function getWelcomeTitleBootstrapScript(): string {
  const siteName = JSON.stringify(SITE_NAME);
  const key = JSON.stringify(VISIT_MARKER);

  return `(function(){try{var k=${key},v=localStorage.getItem(k)==="1"||document.cookie.indexOf(k+"=1")!==-1;document.title=${siteName}+" — "+(v?"Welcome Back!":"Welcome Home!");if(!v)localStorage.setItem(k,"1");if(localStorage.getItem(k)==="1"&&document.cookie.indexOf(k+"=1")===-1)document.cookie=k+"=1; path=/; max-age=31536000; SameSite=Lax"}catch(e){}})();`;
}
