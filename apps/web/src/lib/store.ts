import { analyze, HttpDnsResolver, type Report } from '@kanca/engine/browser';

export interface Session {
  report: Report;
  source: string | null;
}

const key = 'kanca-son-analiz';
const maxSource = 2_000_000;

export async function runAnalysis(source: string, withDns: boolean): Promise<Session> {
  const trimmed = source.length > maxSource ? source.slice(0, maxSource) : source;
  const report = await analyze(trimmed, withDns ? { network: 'dns', dns: new HttpDnsResolver('/api/dns') } : {});
  const session = { report, source: trimmed };
  try {
    sessionStorage.setItem(key, JSON.stringify(session));
  } catch {
    try {
      sessionStorage.setItem(key, JSON.stringify({ ...session, source: null }));
    } catch {}
  }
  return session;
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const valid = Array.isArray(session.report?.findings) && session.report.findings.every((f) => typeof f.detail === 'object');
    return valid ? session : null;
  } catch {
    return null;
  }
}
