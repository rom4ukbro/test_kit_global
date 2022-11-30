import { I18nLoader, I18nTranslation } from 'nestjs-i18n';
import translations from '../../lang';

export class I18nTsLoader extends I18nLoader {
  async languages(): Promise<string[]> {
    return ['uk', 'en', 'ru'];
  }

  async load(): Promise<I18nTranslation> {
    return translations;
  }
}
