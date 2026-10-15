import { load } from 'cheerio';
import { hiddenStyle, isPixel, type HtmlExtractor, type HtmlScan } from './html.js';

export const cheerioExtractor: HtmlExtractor = {
  scan(html: string): HtmlScan {
    const $ = load(html);
    const anchors = $('a[href]')
      .toArray()
      .map((el) => ({ href: ($(el).attr('href') ?? '').trim(), text: $(el).text() }));
    let hiddenTextChars = 0;
    $('[style]').each((_, el) => {
      if (hiddenStyle.test($(el).attr('style') ?? '')) hiddenTextChars += $(el).text().replace(/\s+/g, '').length;
    });
    let trackingPixels = 0;
    $('img').each((_, el) => {
      if (isPixel($(el).attr('width') ?? null, $(el).attr('height') ?? null, $(el).attr('style') ?? null)) trackingPixels++;
    });
    return {
      anchors,
      text: $('body').length ? $('body').text() : $.root().text(),
      hasForm: $('form').length > 0,
      hasPasswordInput: $('input[type="password"]').length > 0,
      hiddenTextChars,
      trackingPixels,
    };
  },
};
