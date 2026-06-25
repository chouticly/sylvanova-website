import { SITE_NAME } from "@/lib/constants";

export const VISIT_MARKER = "sylvanova-has-visited";

export const PAGE_TITLE = `${SITE_NAME} — Welcome Home!`;

export function hasVisitedBefore(): boolean {
  if (typeof window === "undefined") return false;

  return (
    localStorage.getItem(VISIT_MARKER) === "1" ||
    document.cookie.includes(`${VISIT_MARKER}=1`)
  );
}

export function markVisited(): void {
  localStorage.setItem(VISIT_MARKER, "1");
  document.cookie = `${VISIT_MARKER}=1; path=/; max-age=31536000; SameSite=Lax`;
}

export function syncVisitMarker(): void {
  const hasVisited = hasVisitedBefore();

  if (!hasVisited) {
    markVisited();
    return;
  }

  if (localStorage.getItem(VISIT_MARKER) !== "1") {
    localStorage.setItem(VISIT_MARKER, "1");
  }

  if (!document.cookie.includes(`${VISIT_MARKER}=1`)) {
    document.cookie = `${VISIT_MARKER}=1; path=/; max-age=31536000; SameSite=Lax`;
  }
}

/** Runs before paint so visit state is recorded without a title flash. */
export function getWelcomeTitleBootstrapScript(): string {
  const title = JSON.stringify(PAGE_TITLE);
  const key = JSON.stringify(VISIT_MARKER);

  return `(function(){try{var k=${key},v=localStorage.getItem(k)==="1"||document.cookie.indexOf(k+"=1")!==-1;document.title=${title};if(!v)localStorage.setItem(k,"1");if(localStorage.getItem(k)==="1"&&document.cookie.indexOf(k+"=1")===-1)document.cookie=k+"=1; path=/; max-age=31536000; SameSite=Lax"}catch(e){}})();`;
}
