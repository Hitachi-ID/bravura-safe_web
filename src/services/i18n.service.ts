import { I18nService as BaseI18nService } from 'jslib-common/services/i18n.service';

export class I18nService extends BaseI18nService {
    constructor(systemLanguage: string, localesDirectory: string) {
        super(systemLanguage || 'en-US', localesDirectory, async (formattedLocale: string) => {
            const filePath = this.localesDirectory + '/' + formattedLocale + '/messages.json?cache=' +
                process.env.CACHE_TAG;
            const localesResult = await fetch(filePath);
            const locales = await localesResult.json();
            return locales;
        });

        this.supportedTranslationLocales = [
            'az', 'en', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'eo', 'en-GB', 'en-IN', 'es', 'et', 'fi', 'fr', 'he', 'hr', 'hu', 'id', 'it', 'ja', 'kn', 'ko', 'lv', 'ml', 'nb',
            'nl', 'pl', 'pt-PT', 'pt-BR', 'ro', 'ru', 'sk', 'sr', 'sv', 'tr', 'uk', 'zh-CN', 'zh-TW',
        ];
    }
}
