import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalog } from '@kanca/engine/browser';
import { samples } from '../lib/samples';
import { runAnalysis } from '../lib/store';
import { useI18n } from '../i18n';

const maxFileBytes = 10 * 1024 * 1024;

export function Home() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState('');
  const [withDns, setWithDns] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!source.trim()) {
      setError(t.home.errEmpty);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await runAnalysis(source, withDns);
      navigate('/report', { state: session });
    } catch (err) {
      console.error(err);
      setError(t.home.errParse);
    } finally {
      setBusy(false);
    }
  }, [source, withDns, navigate, t]);

  const readFile = async (file: File) => {
    if (file.size > maxFileBytes) return setError(t.home.errSize);
    if (/\.msg$/i.test(file.name)) return setError(t.home.errMsg);
    setSource(await file.text());
    setFileName(file.name);
    setError(null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  const onKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void submit();
  };

  const load = (text: string) => {
    setSource(text);
    setFileName(null);
    setError(null);
  };

  return (
    <main id="content" className="home">
      <section className="wrap intro">
        <h1>{t.home.title}</h1>
        <p className="lede">{t.home.lede(catalog.length)}</p>
      </section>

      <section className="wrap composer-wrap" aria-label={t.home.sourceLabel}>
        <div
          className={`composer${dragging ? ' is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <label htmlFor="source" className="sr-only">{t.home.sourceLabel}</label>
          <textarea
            id="source"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setFileName(null);
            }}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            placeholder={t.home.placeholder}
          />
          <div className="composer-bar">
            <div className="composer-meta">
              {fileName ? <span className="mono">{fileName}</span> : <span>{source ? t.home.lines(source.split('\n').length) : t.home.empty}</span>}
              <button type="button" className="link-button" onClick={() => fileRef.current?.click()}>
                {t.home.chooseFile}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".eml,.txt,message/rfc822,text/plain"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void readFile(f);
                  e.target.value = '';
                }}
              />
              {source && (
                <button type="button" className="link-button" onClick={() => load('')}>
                  {t.home.clear}
                </button>
              )}
            </div>
            <button type="button" className="primary" onClick={() => void submit()} disabled={busy}>
              {busy ? t.home.analyzing : t.home.analyze}
              <kbd>Ctrl Enter</kbd>
            </button>
          </div>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="options">
          <label className="check">
            <input type="checkbox" checked={withDns} onChange={(e) => setWithDns(e.target.checked)} />
            <span>
              {t.home.dns}
              <small>{t.home.dnsNote}</small>
            </span>
          </label>
        </div>

        <div className="samples">
          <span>{t.home.samples}</span>
          <ul>
            {samples.map((s) => (
              <li key={s.key}>
                <button type="button" className="chip" onClick={() => load(s.source)}>
                  {t.samples[s.key]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap guide">
        <div className="guide-text">
          <h2>{t.home.guideTitle}</h2>
          <p>{t.home.guideText}</p>
        </div>
        <dl className="clients">
          {t.home.clients.map((c) => (
            <div key={c.name}>
              <dt>{c.name}</dt>
              <dd>{c.how}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="wrap promise">
        {t.home.promise.map((p) => (
          <div key={p.title}>
            <h2>{p.title}</h2>
            <p>{p.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
