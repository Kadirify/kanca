export interface HtmlAnchor {
  href: string;
  text: string;
}

export interface HtmlScan {
  anchors: HtmlAnchor[];
  text: string;
  hasForm: boolean;
  hasPasswordInput: boolean;
  hiddenTextChars: number;
  trackingPixels: number;
}

export interface HtmlExtractor {
  scan(html: string): HtmlScan;
}

export const hiddenStyle = /display\s*:\s*none|font-size\s*:\s*0(?:px|pt|em)?\s*(?:;|$)|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])/i;

export function isPixel(width: string | null, height: string | null, style: string | null) {
  const s = (style ?? '').toLowerCase();
  return (width === '1' && height === '1') || /width\s*:\s*1px/.test(s) || /display\s*:\s*none/.test(s);
}
