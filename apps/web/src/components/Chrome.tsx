import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { repoUrl } from '../config';

export function HookMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="hook-mark">
      <path d="M14.5 3v10a4.5 4.5 0 1 1-9 0v-1.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M5.5 11.5 3.6 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="14.5" cy="3" r="1.6" fill="currentColor" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

type Theme = 'light' | 'dark' | null;

function readTheme(): Theme {
  try {
    const t = localStorage.getItem('kanca-tema');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
    try {
      if (theme) localStorage.setItem('kanca-tema', theme);
      else localStorage.removeItem('kanca-tema');
    } catch {}
  }, [theme]);

  const systemDark = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme ?? (systemDark ? 'dark' : 'light');
  const next = effective === 'dark' ? 'light' : 'dark';

  return (
    <button type="button" className="icon-button" onClick={() => setTheme(next)} aria-label={next === 'dark' ? t.theme.toDark : t.theme.toLight}>
      {effective === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
      )}
    </button>
  );
}

function LangToggle() {
  const { locale, setLocale, t } = useI18n();
  const next = locale === 'en' ? 'tr' : 'en';
  return (
    <button type="button" className="lang-button" onClick={() => setLocale(next)} aria-label={`${t.lang.label}: ${t.lang.other}`} lang={next}>
      {t.lang.otherCode}
    </button>
  );
}

export function TopBar() {
  const { t } = useI18n();
  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <Link to="/" className="wordmark" aria-label={t.nav.home}>
          <HookMark />
          <span>kanca</span>
        </Link>
        <nav className="nav" aria-label={t.nav.menu}>
          <NavLink to="/" end>{t.nav.analyze}</NavLink>
          <NavLink to="/method">{t.nav.method}</NavLink>
          <NavLink to="/about">{t.nav.about}</NavLink>
        </nav>
        <div className="topbar-tools">
          <LangToggle />
          <a className="icon-button" href={repoUrl} target="_blank" rel="noreferrer" aria-label={t.nav.source}>
            <GitHubMark />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <p>{t.footer.privacy}</p>
        <p className="footer-links">
          <a href={repoUrl} target="_blank" rel="noreferrer">{t.footer.license}</a>
          <Link to="/method">{t.footer.rules}</Link>
        </p>
      </div>
    </footer>
  );
}
