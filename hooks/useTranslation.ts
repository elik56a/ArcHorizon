
import { useLanguageStore } from '../store/useLanguageStore';
import { en } from '../locales/en';
import { he } from '../locales/he';

type NestedKeyOf<ObjectType extends object> = 
{[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object 
? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
: `${Key}`
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<typeof en>;

const dictionaries = { en, he };

export const useTranslation = () => {
  const { language, dir } = useLanguageStore();
  const dictionary = dictionaries[language] || dictionaries.en;

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = dictionary;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value];
      } else {
        // Fallback to English if key missing in current language
        // This logic re-traverses the english dict if the main lookup failed
        if (language !== 'en') {
             let fallback: any = dictionaries.en;
             for (const fk of keys) {
                 if (fallback && typeof fallback === 'object' && fk in fallback) {
                     fallback = fallback[fk as keyof typeof fallback];
                 } else {
                     return key; // Key missing in both
                 }
             }
             value = fallback;
        } else {
            return key;
        }
      }
    }

    if (typeof value !== 'string') return key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return value;
  };

  return { t, language, dir };
};
