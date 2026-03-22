import { useTranslation } from 'react-i18next';

/**
 * Returns a tc(ar, en) function that outputs Arabic or English text
 * based on the current i18n language setting.
 */
export function useTranslate() {
  const { i18n } = useTranslation();
  return (ar: string, en: string): string => i18n.language === 'en' ? en : ar;
}

export default useTranslate;
