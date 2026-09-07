import { HeroVisual, usePreviewLanguage } from "./_shared";
import "./_group.css";

export function Current() {
  const { lang } = usePreviewLanguage();
  return <HeroVisual lang={lang} />;
}