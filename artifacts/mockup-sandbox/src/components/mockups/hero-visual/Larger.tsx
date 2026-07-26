import { HeroVisual, usePreviewLanguage } from "./_shared";
import "./_group.css";

export function Larger() {
  const { lang } = usePreviewLanguage();
  return <HeroVisual larger lang={lang} />;
}