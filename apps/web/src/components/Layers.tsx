import { layerCaps, layerNames, layerOrder, type Report } from '@kanca/engine/browser';
import { useI18n } from '../i18n';

export function LayerBreakdown({ report }: { report: Report }) {
  const { t, l } = useI18n();
  return (
    <section className="layers" aria-label={t.layers.label}>
      <ul>
        {layerOrder.map((layer) => {
          const r = report.layers[layer];
          const cap = layerCaps[layer];
          const skipped = report.skipped.find((s) => s.layer === layer);
          const scored = r.findings.filter((f) => f.weight > 0).length;
          const state = r.score > 0 ? 'hit' : skipped ? 'skip' : 'clean';
          return (
            <li key={layer} className={`layer is-${state}`} title={skipped ? l(skipped.reason) : undefined}>
              <span className="layer-name">{l(layerNames[layer])}</span>
              <span className="layer-meter" aria-hidden="true">
                <span style={{ width: `${(r.score / cap) * 100}%` }} />
              </span>
              <span className="layer-value">
                {state === 'hit' && (
                  <>
                    <b>{r.score}</b>
                    <small>/{cap}</small>
                  </>
                )}
                {state === 'skip' && <small>{t.layers.skipped}</small>}
                {state === 'clean' && <small>{t.layers.clean}</small>}
              </span>
              {state === 'hit' && <span className="layer-count">{t.layers.findings(scored)}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
