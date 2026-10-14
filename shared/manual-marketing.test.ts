import assert from "node:assert/strict";
import test from "node:test";
import { PLAN_PRICES } from "./plan-prices";
import {
  formatManualMarketingPrice,
  generateManualMarketingMessage,
  inferManualMarketingCountryCode,
  MANUAL_MARKETING_SECTORS,
  manualMarketingAnnualPrices,
  normalizeManualMarketingPhone,
} from "./manual-marketing";

test("normalizes Saudi and international WhatsApp numbers", () => {
  assert.equal(normalizeManualMarketingPhone("0532441566"), "966532441566");
  assert.equal(normalizeManualMarketingPhone("+966 53 244 1566"), "966532441566");
  assert.equal(normalizeManualMarketingPhone("+1 (415) 555-0100"), "14155550100");
  assert.equal(normalizeManualMarketingPhone("01012345678", "20"), "201012345678");
  assert.equal(normalizeManualMarketingPhone("+44 20 1234 5678", "966"), "442012345678");
  assert.equal(normalizeManualMarketingPhone("123"), null);
  assert.equal(normalizeManualMarketingPhone(""), null);
});

test("infers a supported country from an international phone number", () => {
  const countries = [
    { code: "SA", dial: "+966" },
    { code: "EG", dial: "+20" },
    { code: "US", dial: "+1" },
    { code: "CA", dial: "+1" },
  ];
  const supportedCountries = new Set(countries.map(({ code }) => code));

  assert.equal(inferManualMarketingCountryCode("+20 10 1234 5678", countries, supportedCountries), "EG");
  assert.equal(inferManualMarketingCountryCode("00966 53 244 1566", countries, supportedCountries), "SA");
  assert.equal(inferManualMarketingCountryCode("0532441566", countries, supportedCountries), "SA");
  assert.equal(inferManualMarketingCountryCode("+1 416 555 0100", countries, supportedCountries, "CA"), "CA");
  assert.equal(inferManualMarketingCountryCode("01012345678", countries, supportedCountries), null);
});

test("uses the published annual prices for every supported sector", () => {
  for (const sector of MANUAL_MARKETING_SECTORS) {
    const annualPrices = manualMarketingAnnualPrices(sector.key);
    assert.equal(annualPrices.lite.amount, PLAN_PRICES[sector.key].lite.yr);
    assert.equal(annualPrices.pro.amount, PLAN_PRICES[sector.key].pro.yr);
    assert.equal(annualPrices.infinity.amount, PLAN_PRICES[sector.key].infinity.yr);
    assert.ok(annualPrices.lite.amount > 0);
  }
});

test("generates an editable Saudi Arabic pitch with optional plan link", () => {
  const withLink = generateManualMarketingMessage("restaurant", {
    businessName: "مقهى النخيل",
  });
  assert.match(withLink, /يا هلا بأهل مقهى النخيل/);
  assert.match(withLink, /شاشة المطبخ/);
  assert.match(withLink, /مو مجرد موقع أو قائمة/);
  assert.match(withLink, /تنقل بيانات نشاطك ومنتجاتك ومخزونك/);
  assert.match(withLink, /هويتك البصرية وألوانك/);
  assert.match(withLink, /أقل من النصف/);
  assert.match(withLink, /ربع التكلفة/);
  assert.match(withLink, /٨٩٩/);
  assert.match(withLink, /https:\/\/qiroxstudio\.online\/sector\/restaurant/);
  assert.match(withLink, /https:\/\/blackrose\.com\.sa/);
  assert.match(withLink, /https:\/\/cluny\.cafe/);
  assert.match(withLink, /https:\/\/apps\.apple\.com\/sa\/app\/black-rose\/id6765878892\?l=ar/);
  assert.match(withLink, /https:\/\/elwa\.site/);
  assert.match(withLink, /https:\/\/www\.fuji\.cafe/);
  assert.match(withLink, /https:\/\/uji-matcha\.store/);
  assert.match(withLink, /https:\/\/tasaliqromsh\.store\//);
  assert.match(withLink, /https:\/\/chefsplace\.online/);
  assert.match(withLink, /https:\/\/qiroxstudio\.online\/prices/);
  assert.match(withLink, /فريق QIROX Studio/);
  assert.ok(withLink.length <= 2000);

  const withoutLink = generateManualMarketingMessage("restaurant", { includePlanLink: false });
  assert.doesNotMatch(withoutLink, /https:\/\/qiroxstudio\.online\/prices/);
  assert.match(withoutLink, /https:\/\/qiroxstudio\.online\/sector\/restaurant/);
  assert.match(withoutLink, /https:\/\/blackrose\.com\.sa/);

  const ecommerce = generateManualMarketingMessage("ecommerce");
  assert.match(ecommerce, /https:\/\/qiroxstudio\.online\/sector\/ecommerce/);
  assert.doesNotMatch(ecommerce, /blackrose\.com\.sa/);
  assert.doesNotMatch(ecommerce, /elwa\.site/);

  const englishRestaurant = generateManualMarketingMessage("restaurant", { language: "en" });
  assert.match(englishRestaurant, /move your existing business data, products, and inventory/i);
  assert.match(englishRestaurant, /https:\/\/chefsplace\.online/);
  assert.ok(englishRestaurant.length <= 2000);
});

test("converts the sector's annual prices to the selected customer's currency", () => {
  const egyptianCurrency = {
    code: "EGP",
    symbol: "ج.م",
    locale: "ar-EG",
    sarRate: 7,
  };
  const egyptMessage = generateManualMarketingMessage("restaurant", {
    countryName: "مصر",
    currency: egyptianCurrency,
  });

  assert.equal(
    formatManualMarketingPrice(899, egyptianCurrency),
    `${Math.round(899 * 7).toLocaleString("ar-EG")} ج.م`,
  );
  assert.match(egyptMessage, /مصر \(EGP\)/);
  assert.ok(egyptMessage.includes(formatManualMarketingPrice(899, egyptianCurrency)));
  assert.doesNotMatch(egyptMessage, /ر\.س/);
});

test("generates the marketing message in English with localized prices and opt-out copy", () => {
  const englishMessage = generateManualMarketingMessage("restaurant", {
    businessName: "Palm Café",
    countryName: "Egypt",
    currency: {
      code: "EGP",
      symbol: "ج.م",
      locale: "en-EG",
      sarRate: 7,
    },
    language: "en",
  });

  assert.match(englishMessage, /Hello Palm Café/);
  assert.match(englishMessage, /Annual plans for Restaurants and cafés in Egypt \(EGP\):/);
  assert.match(englishMessage, /Lite: .* EGP/);
  assert.match(englishMessage, /reply "Stop"/);
  assert.match(englishMessage, /https:\/\/blackrose\.com\.sa/);
  assert.ok(englishMessage.length <= 2000);
});
