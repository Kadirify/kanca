import { headerRules } from './headers.js';
import { dnsRules } from './dns.js';
import { domainRules } from './domain.js';
import { linkRules } from './links.js';
import { attachmentRules } from './attachments.js';
import { contentRules } from './content.js';
import type { Layer, Rule, RuleMeta, Text } from '../types.js';

export const rules: Rule[] = [...headerRules, ...dnsRules, ...domainRules, ...linkRules, ...attachmentRules, ...contentRules];

export const layerOrder: Layer[] = ['headers', 'dns', 'domain', 'links', 'attachments', 'content'];

export const layerNames: Record<Layer, Text> = {
  headers: { en: 'Headers', tr: 'Başlıklar' },
  dns: { en: 'DNS records', tr: 'DNS kayıtları' },
  domain: { en: 'Domain', tr: 'Alan adı' },
  links: { en: 'Links', tr: 'Bağlantılar' },
  attachments: { en: 'Attachments', tr: 'Ekler' },
  content: { en: 'Content', tr: 'İçerik' },
};

export const catalog: RuleMeta[] = rules.map(({ id, layer, severity, weight, title, why }) => ({ id, layer, severity, weight, title, why }));
