export type Layer = 'headers' | 'dns' | 'domain' | 'links' | 'attachments' | 'content';

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type Verdict = 'low' | 'medium' | 'high';

export type NetworkMode = 'offline' | 'dns';

export type Locale = 'en' | 'tr';

export type Text = Record<Locale, string>;

export interface RuleMeta {
  id: string;
  layer: Layer;
  severity: Severity;
  weight: number;
  title: Text;
  why: Text;
}

export interface Finding extends RuleMeta {
  detail: Text;
  evidence: string[];
}

export interface Rule extends RuleMeta {
  run(ctx: AnalysisContext): Finding[] | Promise<Finding[]>;
}

export interface Address {
  name: string;
  address: string;
  domain: string;
  registrable: string;
}

export interface AuthResult {
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
  raw: string[];
}

export interface Hop {
  index: number;
  from: string | null;
  by: string | null;
  ip: string | null;
  date: string | null;
  raw: string;
}

export interface LinkInfo {
  href: string;
  text: string;
  host: string;
  registrable: string;
  scheme: string;
  source: 'html' | 'text';
  isIp: boolean;
  flags: string[];
}

export interface AttachmentInfo {
  filename: string;
  contentType: string;
  size: number;
  extension: string;
  flags: string[];
}

export interface ParsedMail {
  hasHeaders: boolean;
  subject: string;
  date: string | null;
  messageId: string | null;
  from: Address | null;
  replyTo: Address | null;
  returnPath: Address | null;
  to: string[];
  headers: Record<string, string[]>;
  auth: AuthResult;
  dkimDomains: string[];
  hops: Hop[];
  text: string;
  html: string | null;
  links: LinkInfo[];
  attachments: AttachmentInfo[];
  hasForm: boolean;
  hasPasswordInput: boolean;
  hiddenTextChars: number;
  trackingPixels: number;
}

export interface DnsRecords {
  mx: boolean | null;
  a: boolean | null;
  spf: string | null;
  dmarc: string | null;
}

export interface DnsResolver {
  lookup(domain: string): Promise<DnsRecords>;
}

export interface AnalysisContext {
  mail: ParsedMail;
  dns: DnsRecords | null;
  network: NetworkMode;
}

export interface LayerResult {
  score: number;
  findings: Finding[];
}

export interface Report {
  id?: string;
  version: string;
  analyzedAt: string;
  network: NetworkMode;
  score: number;
  verdict: Verdict;
  summary: {
    subject: string;
    date: string | null;
    messageId: string | null;
    from: Address | null;
    replyTo: Address | null;
    returnPath: Address | null;
    hasHeaders: boolean;
  };
  auth: AuthResult;
  hops: Hop[];
  links: LinkInfo[];
  attachments: AttachmentInfo[];
  layers: Record<Layer, LayerResult>;
  findings: Finding[];
  skipped: { layer: Layer; reason: Text }[];
}
