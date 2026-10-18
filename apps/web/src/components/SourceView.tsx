import { useEffect, useRef } from 'react';
import { severityTone } from '../lib/labels';
import type { Segment } from '../lib/annotate';
import { useI18n } from '../i18n';

interface Props {
  segments: Segment[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

export function SourceView({ segments, active, onSelect }: Props) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !scroller.current) return;
    const el = scroller.current.querySelector<HTMLElement>(`mark[data-ids~="${active}"]`);
    if (!el) return;
    const box = scroller.current;
    const top = el.offsetTop - box.clientHeight / 3;
    box.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [active]);

  let order = 0;
  const firstActive = active ? segments.findIndex((s) => s.ids.includes(active)) : -1;
  return (
    <aside className="source" aria-label={t.source.title}>
      <div className="source-head">
        <h2>{t.source.title}</h2>
        {active && (
          <button type="button" className="link-button" onClick={() => onSelect(null)}>
            {t.source.clear}
          </button>
        )}
      </div>
      <div className="source-body" ref={scroller} tabIndex={0}>
        <pre className="mono">
          {segments.map((s, i) => {
            if (!s.ids.length || !s.severity) return <span key={i}>{s.text}</span>;
            const isActive = active ? s.ids.includes(active) : false;
            const dim = active && !isActive;
            return (
              <mark
                key={i}
                data-ids={s.ids.join(' ')}
                className={`tone-${severityTone[s.severity]}${isActive ? ' is-active' : ''}${i === firstActive ? ' is-first' : ''}${dim ? ' is-dim' : ''}`}
                style={{ ['--i' as string]: Math.min(order++, 30) }}
                onClick={() => onSelect(isActive ? null : s.ids[0])}
                title={s.ids.join(', ')}
              >
                {s.text}
                <span className="mark-code" aria-hidden="true">{active && isActive ? active : s.ids[0]}</span>
              </mark>
            );
          })}
        </pre>
      </div>
    </aside>
  );
}
