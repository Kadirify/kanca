import { catalog, layerCaps, layerNames, layerOrder, thresholds } from '@kanca/engine/browser';
import { severityTone } from '../lib/labels';
import { useI18n } from '../i18n';

export function Method() {
  const { t, l } = useI18n();
  return (
    <main id="content" className="method wrap">
      <header className="page-head">
        <h1>{t.method.title}</h1>
        <p className="lede">{t.method.lede}</p>
      </header>

      <section className="method-scoring" aria-labelledby="scoring">
        <h2 id="scoring">{t.method.scoringTitle}</h2>
        <ol className="steps">
          {t.method.steps(thresholds.medium, thresholds.high).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <dl className="caps">
          {layerOrder.map((layer) => (
            <div key={layer}>
              <dt>{l(layerNames[layer])}</dt>
              <dd>{t.method.cap(layerCaps[layer])}</dd>
            </div>
          ))}
        </dl>
      </section>

      {layerOrder.map((layer) => (
        <section key={layer} className="rule-layer" aria-labelledby={`layer-${layer}`}>
          <div className="rule-layer-head">
            <h2 id={`layer-${layer}`}>{l(layerNames[layer])}</h2>
            <p>{t.method.intro[layer]}</p>
          </div>
          <table className="rules">
            <thead>
              <tr>
                <th scope="col">{t.method.code}</th>
                <th scope="col">{t.method.rule}</th>
                <th scope="col">{t.method.severity}</th>
                <th scope="col">{t.method.weight}</th>
              </tr>
            </thead>
            <tbody>
              {catalog
                .filter((r) => r.layer === layer)
                .map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>
                      <strong>{l(r.title)}</strong>
                      <span>{l(r.why)}</span>
                    </td>
                    <td>
                      <span className={`tag tone-${severityTone[r.severity]}`}>{t.severity[r.severity]}</span>
                    </td>
                    <td className="num">{r.weight}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}

      <section className="method-limits" aria-labelledby="limits">
        <h2 id="limits">{t.method.limitsTitle}</h2>
        <ul>
          {t.method.limits.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
