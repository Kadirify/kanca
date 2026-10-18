import { thresholds, type Report } from '@kanca/engine/browser';
import { authTone, formatDate, verdictTone } from '../lib/labels';
import { useI18n } from '../i18n';

export function ScoreBar({ score }: { score: number }) {
  const { t } = useI18n();
  return (
    <div className="scorebar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={t.verdict.scoreLabel(score)}>
      <div className="scorebar-track">
        <span className="zone zone-low" style={{ width: `${thresholds.medium}%` }} />
        <span className="zone zone-medium" style={{ width: `${thresholds.high - thresholds.medium}%` }} />
        <span className="zone zone-high" style={{ width: `${100 - thresholds.high}%` }} />
        <span className="scorebar-fill" style={{ ['--score' as string]: `${score}%` }} />
      </div>
      <div className="scorebar-ticks" aria-hidden="true">
        <span style={{ left: 0 }}>0</span>
        <span style={{ left: `${thresholds.medium}%` }}>{thresholds.medium}</span>
        <span style={{ left: `${thresholds.high}%` }}>{thresholds.high}</span>
        <span style={{ left: '100%' }}>100</span>
      </div>
    </div>
  );
}

function AuthPill({ label, value }: { label: string; value: string | null }) {
  const { t } = useI18n();
  return (
    <span className={`pill tone-${authTone(value)}`}>
      <span>{label}</span>
      <b>{value ?? t.verdict.missing}</b>
    </span>
  );
}

export function VerdictStrip({ report }: { report: Report }) {
  const { t, locale } = useI18n();
  const tone = verdictTone[report.verdict];
  const scored = report.findings.filter((f) => f.weight > 0);
  const layers = new Set(scored.map((f) => f.layer)).size;
  const s = report.summary;

  const rows: [string, string | undefined, boolean][] = [
    [t.verdict.subject, s.subject || '—', false],
    [t.verdict.displayName, s.from?.name || '—', false],
    [t.verdict.from, s.from?.address ?? '—', true],
    [t.verdict.replyTo, s.replyTo?.address, true],
    [t.verdict.returnPath, s.returnPath?.address, true],
    [t.verdict.date, formatDate(s.date, locale), false],
  ];

  return (
    <section className={`verdict tone-${tone}`} aria-labelledby="verdict">
      <div className="verdict-score">
        <p className="score-number">
          <span>{report.score}</span>
          <small>/100</small>
        </p>
        <ScoreBar score={report.score} />
      </div>
      <div className="verdict-text">
        <h1 id="verdict">{t.verdict.title[report.verdict]}</h1>
        <p>
          {scored.length ? t.verdict.summary(scored.length, layers) : t.verdict.none} {t.verdict.advice[report.verdict]}
        </p>
      </div>
      <dl className="identity">
        {rows
          .filter(([, value]) => value !== undefined)
          .map(([label, value, mono]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={mono ? 'mono' : undefined}>{value}</dd>
            </div>
          ))}
      </dl>
      {s.hasHeaders && (
        <div className="auth">
          <AuthPill label="SPF" value={report.auth.spf} />
          <AuthPill label="DKIM" value={report.auth.dkim} />
          <AuthPill label="DMARC" value={report.auth.dmarc} />
        </div>
      )}
    </section>
  );
}
