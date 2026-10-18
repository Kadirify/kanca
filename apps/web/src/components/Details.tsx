import type { Report } from '@kanca/engine/browser';
import { formatBytes } from '../lib/labels';
import { useI18n } from '../i18n';

const privateIp = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/;

export function HopChain({ report }: { report: Report }) {
  const { t } = useI18n();
  if (!report.hops.length) return null;
  const hops = [...report.hops].reverse();
  return (
    <section className="detail-block" aria-labelledby="hops">
      <h2 id="hops">{t.report.hops}</h2>
      <p className="detail-lede">{t.report.hopsLede}</p>
      <ol className="hops">
        {hops.map((h, i) => {
          const isPrivate = Boolean(h.ip && privateIp.test(h.ip));
          return (
            <li key={h.index} className={isPrivate ? 'is-flag' : undefined}>
              <span className="hop-step" aria-hidden="true">{i + 1}</span>
              <div>
                <p className="mono">
                  <span>{h.from ?? t.report.unknown}</span>
                  <span className="hop-arrow" aria-label={t.report.via}>→</span>
                  <span>{h.by ?? t.report.unknown}</span>
                </p>
                <p className="hop-meta">
                  {h.ip && <span className="mono">{h.ip}</span>}
                  {isPrivate && <span className="tag tone-medium">{t.report.privateNet}</span>}
                  {h.date && <span>{h.date}</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function LinksTable({ report }: { report: Report }) {
  const { t } = useI18n();
  const links = report.links.filter((l) => l.scheme === 'http' || l.scheme === 'https' || l.flags.includes('script-scheme'));
  if (!links.length) return null;
  return (
    <section className="detail-block" aria-labelledby="links">
      <h2 id="links">{t.report.links}</h2>
      <p className="detail-lede">{t.report.linksLede}</p>
      <div className="table-scroll">
        <table className="stack-mobile">
          <thead>
            <tr>
              <th scope="col">{t.report.shown}</th>
              <th scope="col">{t.report.target}</th>
              <th scope="col">{t.report.flags}</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l, i) => (
              <tr key={i}>
                <td data-label={t.report.shown}>{l.text && l.text !== l.href ? l.text : '—'}</td>
                <td data-label={t.report.target} className="mono break">
                  <b>{l.host}</b>
                  <span>{l.href.replace(/^https?:\/\/[^/]+/, '')}</span>
                </td>
                <td data-label={t.report.flags}>
                  <span className="tags">
                    {l.flags.length ? l.flags.map((f) => <span key={f} className="tag">{t.linkFlags[f] ?? f}</span>) : <span className="muted">—</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AttachmentsTable({ report }: { report: Report }) {
  const { t } = useI18n();
  if (!report.attachments.length) return null;
  return (
    <section className="detail-block" aria-labelledby="attachments">
      <h2 id="attachments">{t.report.attachments}</h2>
      <p className="detail-lede">{t.report.attachmentsLede}</p>
      <div className="table-scroll">
        <table className="stack-mobile">
          <thead>
            <tr>
              <th scope="col">{t.report.file}</th>
              <th scope="col">{t.report.type}</th>
              <th scope="col">{t.report.size}</th>
              <th scope="col">{t.report.flags}</th>
            </tr>
          </thead>
          <tbody>
            {report.attachments.map((a, i) => (
              <tr key={i}>
                <td data-label={t.report.file} className="mono break">{a.filename}</td>
                <td data-label={t.report.type} className="mono">{a.contentType}</td>
                <td data-label={t.report.size}>{formatBytes(a.size)}</td>
                <td data-label={t.report.flags}>
                  <span className="tags">
                    {a.flags.length ? a.flags.map((f) => <span key={f} className="tag">{t.attachmentFlags[f] ?? f}</span>) : <span className="muted">—</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
