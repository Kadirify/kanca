import { parseMessage } from './parse.js';
import { rules, layerOrder } from './rules/index.js';
import { scoreLayers, totalScore, verdictOf } from './score.js';
import type { HtmlExtractor } from './html.js';
import type { AnalysisContext, DnsRecords, DnsResolver, Finding, Layer, NetworkMode, Report, Text } from './types.js';

export const engineVersion = '0.1.0';

export interface AnalyzeOptions {
  html: HtmlExtractor;
  network?: NetworkMode;
  dns?: DnsResolver;
}

const severityRank = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as const;

export async function analyze(source: string, opts: AnalyzeOptions): Promise<Report> {
  const network: NetworkMode = opts.network ?? 'offline';
  const mail = await parseMessage(source, opts.html);
  const skipped: { layer: Layer; reason: Text }[] = [];

  let dns: DnsRecords | null = null;
  if (network === 'dns' && opts.dns && mail.from?.registrable) {
    try {
      dns = await opts.dns.lookup(mail.from.registrable);
    } catch {
      skipped.push({ layer: 'dns', reason: { en: 'The DNS lookup did not respond.', tr: 'DNS sorgusu yanıt vermedi.' } });
    }
  } else if (network === 'offline') {
    skipped.push({ layer: 'dns', reason: { en: 'Offline mode: no DNS lookup was made.', tr: 'Çevrimdışı mod: DNS sorgusu yapılmadı.' } });
  } else if (!mail.from) {
    skipped.push({ layer: 'dns', reason: { en: 'There is no sender address.', tr: 'Gönderen adresi yok.' } });
  }
  if (!mail.hasHeaders) skipped.push({ layer: 'headers', reason: { en: 'No headers in the source, so authentication checks were skipped.', tr: 'Kaynakta başlık yok; kimlik doğrulama kontrolleri atlandı.' } });
  if (!mail.attachments.length) skipped.push({ layer: 'attachments', reason: { en: 'No attachments.', tr: 'Ek yok.' } });

  const ctx: AnalysisContext = { mail, dns, network };
  const findings: Finding[] = [];
  for (const rule of rules) {
    try {
      findings.push(...(await rule.run(ctx)));
    } catch (err) {
      findings.push({ id: rule.id, layer: rule.layer, severity: 'info', weight: 0, title: rule.title, why: rule.why, detail: { en: 'Rule failed: ' + String(err), tr: 'Kural çalıştırılamadı: ' + String(err) }, evidence: [] });
    }
  }

  findings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.weight - a.weight || a.id.localeCompare(b.id));
  const layers = scoreLayers(findings);
  const score = totalScore(layers);

  return {
    version: engineVersion,
    analyzedAt: new Date().toISOString(),
    network: dns ? 'dns' : 'offline',
    score,
    verdict: verdictOf(score),
    summary: {
      subject: mail.subject,
      date: mail.date,
      messageId: mail.messageId,
      from: mail.from,
      replyTo: mail.replyTo,
      returnPath: mail.returnPath,
      hasHeaders: mail.hasHeaders,
    },
    auth: mail.auth,
    hops: mail.hops,
    links: mail.links,
    attachments: mail.attachments,
    layers,
    findings,
    skipped: skipped.filter((s) => layerOrder.includes(s.layer)),
  };
}
