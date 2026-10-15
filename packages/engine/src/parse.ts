import PostalMime, { type Address as MimeAddress } from 'postal-mime';
import { splitDomain, isPunycode, shortenerDomains } from './domain.js';
import type { HtmlExtractor } from './html.js';
import type { Address, AttachmentInfo, AuthResult, Hop, LinkInfo, ParsedMail } from './types.js';

const headerLineRe = /^[A-Za-z][A-Za-z0-9-]*:\s/m;

export function looksLikeRawMessage(source: string) {
  const head = source.slice(0, 4000);
  const lines = head.split(/\r?\n/).slice(0, 30);
  let hits = 0;
  for (const line of lines) {
    if (/^(from|to|subject|date|received|message-id|return-path|mime-version|content-type|dkim-signature|authentication-results):/i.test(line)) hits++;
  }
  return hits >= 2 && headerLineRe.test(head);
}

function unfold(value: string) {
  return value.replace(/\r?\n[ \t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function makeAddress(name: string, address: string): Address {
  const clean = address.trim().replace(/^<|>$/g, '').toLowerCase();
  const domain = clean.includes('@') ? clean.split('@').pop()! : '';
  return { name: name.trim(), address: clean, domain, registrable: domain ? splitDomain(domain).registrable : '' };
}

function fromMime(addr: MimeAddress | undefined): Address | null {
  if (!addr) return null;
  if (addr.address) return makeAddress(addr.name ?? '', addr.address);
  const first = addr.group?.[0];
  return first?.address ? makeAddress(first.name ?? '', first.address) : null;
}

function parseAddressLine(value: string): Address | null {
  const match = value.match(/<([^>]+)>/);
  const address = match ? match[1] : value.match(/[\w.+-]+@[\w.-]+/)?.[0];
  if (!address) return null;
  const name = match ? value.slice(0, match.index).replace(/["']/g, '').trim() : '';
  return makeAddress(name, address);
}

function parseAuth(lines: string[], receivedSpf: string[]): AuthResult {
  const pick = (key: string) => {
    for (const line of lines) {
      const m = line.match(new RegExp(`(?:^|[;\\s])${key}=([a-z]+)`, 'i'));
      if (m) return m[1].toLowerCase();
    }
    return null;
  };
  let spf = pick('spf');
  if (!spf && receivedSpf.length) {
    const m = receivedSpf[0].match(/^\s*([a-z]+)/i);
    if (m) spf = m[1].toLowerCase();
  }
  return { spf, dkim: pick('dkim'), dmarc: pick('dmarc'), raw: [...lines, ...receivedSpf.map((l) => 'Received-SPF: ' + l)] };
}

function parseHops(lines: string[]): Hop[] {
  return lines.map((raw, i) => {
    const from = raw.match(/\bfrom\s+([^\s(;]+)/i)?.[1] ?? null;
    const by = raw.match(/\bby\s+([^\s(;]+)/i)?.[1] ?? null;
    const ip = raw.match(/\[(\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:]{3,})\]/i)?.[1] ?? raw.match(/\((?:[^)]*?)(\d{1,3}(?:\.\d{1,3}){3})\)/)?.[1] ?? null;
    const dateIdx = raw.lastIndexOf(';');
    const date = dateIdx >= 0 ? raw.slice(dateIdx + 1).trim() : null;
    return { index: i, from, by, ip, date, raw };
  });
}

const urlInTextRe = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

function describeLink(href: string, text: string, source: 'html' | 'text'): LinkInfo | null {
  let url: URL;
  try {
    url = new URL(href.startsWith('www.') ? 'http://' + href : href);
  } catch {
    return null;
  }
  const scheme = url.protocol.replace(':', '');
  if (!['http', 'https', 'mailto', 'tel', 'javascript', 'data', 'ftp'].includes(scheme)) return null;
  const host = url.hostname.toLowerCase();
  const info = host ? splitDomain(host) : { registrable: '', isIp: false };
  const flags: string[] = [];
  if (info.isIp) flags.push('ip-host');
  if (url.username) flags.push('userinfo');
  if (isPunycode(host)) flags.push('punycode');
  if (shortenerDomains.has(info.registrable)) flags.push('shortener');
  if (scheme === 'http') flags.push('no-tls');
  if (scheme === 'javascript' || scheme === 'data') flags.push('script-scheme');
  if (href.length > 180) flags.push('long');
  const tail = url.pathname + url.search;
  if (tail.split('%').length > 6) flags.push('encoded');
  if (host.split('.').length >= 5) flags.push('deep-subdomain');
  if (url.port && !['80', '443', ''].includes(url.port)) flags.push('odd-port');
  return { href, text: text.trim().slice(0, 200), host, registrable: info.registrable, scheme, source, isIp: Boolean(info.isIp), flags };
}

function extractFromText(text: string, seen: Set<string>) {
  const links: LinkInfo[] = [];
  for (const m of text.matchAll(urlInTextRe)) {
    const raw = m[0].replace(/[.,;:!?]+$/, '');
    if (seen.has(raw)) continue;
    const info = describeLink(raw, raw, 'text');
    if (info) {
      links.push(info);
      seen.add(raw);
    }
  }
  return links;
}

const dangerousExt = new Set(['exe', 'scr', 'bat', 'cmd', 'com', 'pif', 'msi', 'msp', 'js', 'jse', 'vbs', 'vbe', 'wsf', 'wsh', 'ps1', 'hta', 'cpl', 'jar', 'lnk', 'reg', 'dll', 'apk']);
const macroExt = new Set(['docm', 'xlsm', 'pptm', 'dotm', 'xltm', 'xlam']);
const archiveExt = new Set(['zip', 'rar', '7z', 'iso', 'img', 'gz', 'tar', 'cab', 'ace', 'arj']);
const webExt = new Set(['html', 'htm', 'shtml', 'svg', 'xhtml']);

function describeAttachment(filename: string, contentType: string, size: number): AttachmentInfo {
  const name = filename || 'adsiz';
  const parts = name.toLowerCase().split('.');
  const extension = parts.length > 1 ? parts.pop()! : '';
  const flags: string[] = [];
  if (dangerousExt.has(extension)) flags.push('executable');
  if (macroExt.has(extension)) flags.push('macro');
  if (archiveExt.has(extension)) flags.push('archive');
  if (webExt.has(extension)) flags.push('web');
  if (parts.length > 1 && /^(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|txt)$/.test(parts[parts.length - 1])) flags.push('double-extension');
  if (/\s{3,}/.test(name)) flags.push('padded-name');
  if (/qr/i.test(name) && /^image\//.test(contentType)) flags.push('qr');
  return { filename: name, contentType, size, extension, flags };
}

function sizeOf(content: ArrayBuffer | Uint8Array | string) {
  if (typeof content === 'string') return content.length;
  return content.byteLength;
}

export async function parseMessage(source: string, html: HtmlExtractor): Promise<ParsedMail> {
  const hasHeaders = looksLikeRawMessage(source);
  const input = hasHeaders ? source : `Subject: (basliksiz)\nContent-Type: ${/<[a-z][\s\S]*>/i.test(source) ? 'text/html' : 'text/plain'}; charset=utf-8\n\n${source}`;
  const mail = await PostalMime.parse(input, { attachmentEncoding: 'arraybuffer' });

  const headers: Record<string, string[]> = {};
  for (const h of mail.headers) (headers[h.key] ??= []).push(unfold(h.value));

  const from = fromMime(mail.from);
  const replyTo = fromMime(mail.replyTo?.[0]);
  const returnPathRaw = mail.returnPath ?? headers['return-path']?.[0];
  const returnPath = returnPathRaw ? parseAddressLine(returnPathRaw) : null;
  const to = (mail.to ?? []).map((a) => a.address ?? '').filter(Boolean);

  const auth = parseAuth(headers['authentication-results'] ?? [], headers['received-spf'] ?? []);
  const dkimDomains = (headers['dkim-signature'] ?? [])
    .map((l) => l.match(/(?:^|;|\s)d=([^;\s]+)/i)?.[1]?.toLowerCase())
    .filter((d): d is string => Boolean(d));
  const hops = parseHops(headers['received'] ?? []);

  const htmlBody = mail.html ?? null;
  const seen = new Set<string>();
  let links: LinkInfo[] = [];
  let hasForm = false;
  let hasPasswordInput = false;
  let hiddenTextChars = 0;
  let trackingPixels = 0;
  let text = mail.text ?? '';
  if (htmlBody) {
    const scan = html.scan(htmlBody);
    for (const a of scan.anchors) {
      const info = describeLink(a.href, a.text, 'html');
      if (info) {
        links.push(info);
        seen.add(info.href);
        seen.add(a.text.trim());
      }
    }
    hasForm = scan.hasForm;
    hasPasswordInput = scan.hasPasswordInput;
    hiddenTextChars = scan.hiddenTextChars;
    trackingPixels = scan.trackingPixels;
    if (!text.trim()) text = scan.text;
  }
  links = links.concat(extractFromText(text, seen));

  const attachments = mail.attachments
    .filter((a) => a.disposition !== 'inline' || !a.contentId)
    .map((a) => describeAttachment(a.filename ?? '', a.mimeType, sizeOf(a.content)));

  return {
    hasHeaders,
    subject: mail.subject ?? '',
    date: mail.date ? new Date(mail.date).toISOString() : null,
    messageId: mail.messageId ?? null,
    from,
    replyTo,
    returnPath,
    to,
    headers,
    auth,
    dkimDomains,
    hops,
    text: text.replace(/\r/g, ''),
    html: htmlBody,
    links,
    attachments,
    hasForm,
    hasPasswordInput,
    hiddenTextChars,
    trackingPixels,
  };
}
