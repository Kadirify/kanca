import { useState } from 'react';
import { layerNames, type Finding, type Severity } from '@kanca/engine/browser';
import { severityTone } from '../lib/labels';
import { useI18n } from '../i18n';

const groups: Severity[] = ['critical', 'high', 'medium', 'low'];

interface Props {
  findings: Finding[];
  active: string | null;
  marked: Set<string>;
  onSelect: (id: string | null) => void;
}

interface RowProps {
  finding: Finding;
  index: number;
  active: boolean;
  marked: boolean;
  onSelect: Props['onSelect'];
}

function FindingRow({ finding, index, active, marked, onSelect }: RowProps) {
  const { t, l } = useI18n();
  const [open, setOpen] = useState(false);
  const domId = `finding-${finding.id}-${index}`;
  return (
    <li className={`finding tone-${severityTone[finding.severity]}${active ? ' is-active' : ''}`}>
      <button
        type="button"
        className="finding-head"
        aria-expanded={open}
        aria-controls={domId}
        onClick={() => {
          setOpen((o) => !o);
          onSelect(active ? null : finding.id);
        }}
      >
        <span className="code mono">{finding.id}</span>
        <span className="finding-title">
          <strong>{l(finding.title)}</strong>
          <span className="finding-detail">{l(finding.detail)}</span>
        </span>
        <span className="finding-side">
          <span className="weight">+{finding.weight}</span>
          {marked && <span className="marked-dot" title={t.findings.marked} aria-label={t.findings.marked} />}
        </span>
      </button>
      <div id={domId} className="finding-body" hidden={!open}>
        <p>{l(finding.why)}</p>
        {finding.evidence.length > 0 && (
          <ul className="evidence">
            {finding.evidence.map((e, i) => (
              <li key={i} className="mono">{e}</li>
            ))}
          </ul>
        )}
        <p className="finding-meta">{t.findings.meta(l(layerNames[finding.layer]), t.severity[finding.severity], finding.weight)}</p>
      </div>
    </li>
  );
}

export function FindingList({ findings, active, marked, onSelect }: Props) {
  const { t } = useI18n();
  const info = findings.filter((f) => f.severity === 'info');
  const scored = findings.filter((f) => f.severity !== 'info');

  if (!scored.length && !info.length) {
    return (
      <div className="empty">
        <h2>{t.findings.emptyTitle}</h2>
        <p>{t.findings.emptyText}</p>
      </div>
    );
  }

  let index = 0;
  const row = (f: Finding) => {
    const i = index++;
    return <FindingRow key={`${f.id}-${i}`} index={i} finding={f} active={active === f.id} marked={marked.has(f.id)} onSelect={onSelect} />;
  };

  return (
    <div className="findings">
      {groups.map((g) => {
        const items = scored.filter((f) => f.severity === g);
        if (!items.length) return null;
        return (
          <section key={g} className="finding-group" aria-label={t.findings.group(t.severity[g])}>
            <h2>
              {t.severity[g]}
              <span>{items.length}</span>
            </h2>
            <ol>{items.map(row)}</ol>
          </section>
        );
      })}
      {info.length > 0 && (
        <section className="finding-group is-info" aria-label={t.severity.info}>
          <h2>
            {t.severity.info}
            <span>{info.length}</span>
          </h2>
          <ol>{info.map(row)}</ol>
        </section>
      )}
    </div>
  );
}
