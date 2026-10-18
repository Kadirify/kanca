import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider, useI18n } from './i18n';
import { Footer, TopBar } from './components/Chrome';
import { Home } from './pages/Home';
import { Report } from './pages/Report';
import { Method } from './pages/Method';
import { About } from './pages/About';
import './styles.css';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Shell() {
  const { t } = useI18n();
  return (
    <>
      <ScrollTop />
      <a href="#content" className="skip">{t.skip}</a>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/method" element={<Method />} />
        <Route path="/about" element={<About />} />
        <Route path="/rapor" element={<Navigate to="/report" replace />} />
        <Route path="/yontem" element={<Navigate to="/method" replace />} />
        <Route path="/hakkinda" element={<Navigate to="/about" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
);
