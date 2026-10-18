import bank from '../../../../samples/banka-oltalama.eml?raw';
import paypal from '../../../../samples/paypal-en.eml?raw';
import cargo from '../../../../samples/kargo-eki.eml?raw';
import account from '../../../../samples/hesap-dogrulama-en.eml?raw';
import textOnly from '../../../../samples/sadece-metin.txt?raw';
import newsletter from '../../../../samples/bulten-temiz.eml?raw';

export type SampleKey = 'bank' | 'paypal' | 'cargo' | 'account' | 'text' | 'newsletter';

export const samples: { key: SampleKey; source: string }[] = [
  { key: 'paypal', source: paypal },
  { key: 'account', source: account },
  { key: 'bank', source: bank },
  { key: 'cargo', source: cargo },
  { key: 'text', source: textOnly },
  { key: 'newsletter', source: newsletter },
];
