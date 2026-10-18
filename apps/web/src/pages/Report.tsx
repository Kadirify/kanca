import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { layerNames } from '@kanca/engine/browser';
import { annotate } from '../lib/annotate';
import { loadSession, type Session } from '../lib/store';
import { formatDate } from '../lib/labels';
import { useI18n } from '../i18n';
import { VerdictStrip } from '../components/Verdict';
import { LayerBreakdown } from '../components/Layers';
import { FindingList } from '../components/Findings';
import { SourceView } from '../components/SourceView';
import { AttachmentsTable, HopChain, LinksTable } from '../components/Details';

export function Report() {
  const { t, l, locale } = useI18n();
  const location = useLocation();
  const session = useMemo<Session | null>(() => (location.state as Session | null) ?? loadSession(), [location.state]);
  const [active, setActive] = useState<string | null>(null);

  const annotated = useMemo(() => (session?.source ? annotate(session.source, session.report.findings) : null), [session]);

  if (!session) {
    return (
      <main id="content" className="wrap missing">
        <h1>{t.report.missingTitle}</h1>
        <p>{t.report.missingText}</p>
        <Link to="/" className="primary">{t.report.start}</Link>
      </main>
    );
  }

  const { report } = session;

  return (
    <main id="content" className="report">
      <div className="wrap report-actions">
        <Link to="/" className="link-button">{t.report.newAnalysis}</Link>
      </div>

      <div className="wrap">
        <VerdictStrip report={report} />
        <LayerBreakdown report={report} />
      </div>

      <div className={`wrap evidence-grid${annotated ? '' : ' no-source'}`}>
        <FindingList findings={report.findings} active={active} marked={annotated?.marked ?? new Set()} onSelect={setActive} />
        {annotated ? (
          <SourceView segments={annotated.segments} active={active} onSelect={setActive} />
        ) : (
          <aside className="source is-empty">
            <h2>{t.source.unavailableTitle}</h2>
            <p>{t.source.unavailableText}</p>
          </aside>
        )}
      </div>

      <div className="wrap details">
        <HopChain report={report} />
        <LinksTable report={report} />
        <AttachmentsTable report={report} />
        {report.skipped.length > 0 && (
          <section className="detail-block" aria-labelledby="skipped">
            <h2 id="skipped">{t.report.skipped}</h2>
            <ul className="skipped">
              {report.skipped.map((s) => (
                <li key={s.layer}>
                  <b>{l(layerNames[s.layer])}</b> {l(s.reason)}
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="report-foot">
          {t.report.foot(report.version, formatDate(report.analyzedAt, locale), report.network === 'dns')}{' '}
          <Link to="/method">{t.report.howScored}</Link>
        </p>
      </div>
    </main>
  );
}
