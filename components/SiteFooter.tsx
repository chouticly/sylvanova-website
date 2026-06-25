import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Company information">
      <p className="site-footer-line">
        <span className="site-footer-company">{COMPANY_NAME}</span>
        <span aria-hidden="true"> · </span>
        <span>{COMPANY_TAGLINE}</span>
      </p>
      <p className="site-footer-line">
        © {year} {COMPANY_NAME}. All rights reserved.
      </p>
    </footer>
  );
}
