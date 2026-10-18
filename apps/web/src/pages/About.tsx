import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { repoUrl } from '../config';
import { HookMark } from '../components/Chrome';

export function About() {
  const { t } = useI18n();
  const a = t.about;
  return (
    <main id="content" className="about wrap">
      <header className="page-head about-head">
        <HookMark size={44} />
        <h1>{a.title}</h1>
        <p className="lede">{a.lede}</p>
        <div className="about-actions">
          <a className="primary" href={repoUrl} target="_blank" rel="noreferrer">{a.repo}</a>
          <Link className="secondary" to="/method">{a.method}</Link>
        </div>
      </header>

      <div className="about-body">
        {a.sections.map((s) => (
          <section key={s.title} className="about-section">
            <h2>{s.title}</h2>
            <div>
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="about-section">
          <h2>{a.stackTitle}</h2>
          <ul className="stack">
            {a.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="about-section">
          <h2>{a.contributeTitle}</h2>
          <div>
            <p>{a.contribute}</p>
            <p>
              <a href={`${repoUrl}/issues`} target="_blank" rel="noreferrer" className="mono">{repoUrl.replace('https://', '')}</a>
            </p>
          </div>
        </section>

        <p className="about-note">{a.disclaimer}</p>
      </div>
    </main>
  );
}
