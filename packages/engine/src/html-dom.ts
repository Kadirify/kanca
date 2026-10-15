import { hiddenStyle, isPixel, type HtmlExtractor, type HtmlScan } from './html.js';

export const domExtractor: HtmlExtractor = {
  scan(html: string): HtmlScan {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const anchors = [...doc.querySelectorAll('a[href]')].map((a) => ({ href: (a.getAttribute('href') ?? '').trim(), text: a.textContent ?? '' }));
    let hiddenTextChars = 0;
    for (const el of doc.querySelectorAll('[style]')) {
      if (hiddenStyle.test(el.getAttribute('style') ?? '')) hiddenTextChars += (el.textContent ?? '').replace(/\s+/g, '').length;
    }
    let trackingPixels = 0;
    for (const img of doc.querySelectorAll('img')) {
      if (isPixel(img.getAttribute('width'), img.getAttribute('height'), img.getAttribute('style'))) trackingPixels++;
    }
    return {
      anchors,
      text: doc.body?.textContent ?? doc.documentElement.textContent ?? '',
      hasForm: doc.querySelector('form') !== null,
      hasPasswordInput: doc.querySelector('input[type="password"]') !== null,
      hiddenTextChars,
      trackingPixels,
    };
  },
};
