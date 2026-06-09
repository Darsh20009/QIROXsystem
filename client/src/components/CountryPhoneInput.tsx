import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { getCountryCode } from "@/hooks/use-currency";

export type CountryData = {
  name: string;
  nameAr: string;
  code: string;
  dial: string;
  flag: string;
  placeholder: string;
};

export const COUNTRIES: CountryData[] = [
  /* ── الخليج العربي ── */
  { name: "Saudi Arabia",              nameAr: "المملكة العربية السعودية", code: "SA", dial: "+966", flag: "🇸🇦", placeholder: "5XXXXXXXX" },
  { name: "United Arab Emirates",      nameAr: "الإمارات العربية المتحدة", code: "AE", dial: "+971", flag: "🇦🇪", placeholder: "5XXXXXXXX" },
  { name: "Kuwait",                    nameAr: "الكويت",                   code: "KW", dial: "+965", flag: "🇰🇼", placeholder: "XXXXXXXX" },
  { name: "Qatar",                     nameAr: "قطر",                      code: "QA", dial: "+974", flag: "🇶🇦", placeholder: "XXXXXXXX" },
  { name: "Bahrain",                   nameAr: "البحرين",                  code: "BH", dial: "+973", flag: "🇧🇭", placeholder: "XXXXXXXX" },
  { name: "Oman",                      nameAr: "عُمان",                    code: "OM", dial: "+968", flag: "🇴🇲", placeholder: "XXXXXXXX" },
  /* ── المشرق العربي ── */
  { name: "Egypt",                     nameAr: "مصر",                      code: "EG", dial: "+20",  flag: "🇪🇬", placeholder: "1XXXXXXXXX" },
  { name: "Jordan",                    nameAr: "الأردن",                   code: "JO", dial: "+962", flag: "🇯🇴", placeholder: "7XXXXXXXX" },
  { name: "Lebanon",                   nameAr: "لبنان",                    code: "LB", dial: "+961", flag: "🇱🇧", placeholder: "XXXXXXXX" },
  { name: "Iraq",                      nameAr: "العراق",                   code: "IQ", dial: "+964", flag: "🇮🇶", placeholder: "7XXXXXXXXX" },
  { name: "Syria",                     nameAr: "سوريا",                    code: "SY", dial: "+963", flag: "🇸🇾", placeholder: "9XXXXXXXX" },
  { name: "Palestine",                 nameAr: "فلسطين",                   code: "PS", dial: "+970", flag: "🇵🇸", placeholder: "XXXXXXXXX" },
  { name: "Yemen",                     nameAr: "اليمن",                    code: "YE", dial: "+967", flag: "🇾🇪", placeholder: "7XXXXXXXX" },
  /* ── شمال أفريقيا ── */
  { name: "Libya",                     nameAr: "ليبيا",                    code: "LY", dial: "+218", flag: "🇱🇾", placeholder: "XXXXXXXXX" },
  { name: "Tunisia",                   nameAr: "تونس",                     code: "TN", dial: "+216", flag: "🇹🇳", placeholder: "XXXXXXXX" },
  { name: "Algeria",                   nameAr: "الجزائر",                  code: "DZ", dial: "+213", flag: "🇩🇿", placeholder: "XXXXXXXXX" },
  { name: "Morocco",                   nameAr: "المغرب",                   code: "MA", dial: "+212", flag: "🇲🇦", placeholder: "XXXXXXXXX" },
  { name: "Sudan",                     nameAr: "السودان",                  code: "SD", dial: "+249", flag: "🇸🇩", placeholder: "XXXXXXXXX" },
  { name: "South Sudan",               nameAr: "جنوب السودان",             code: "SS", dial: "+211", flag: "🇸🇸", placeholder: "XXXXXXXXX" },
  { name: "Mauritania",                nameAr: "موريتانيا",                code: "MR", dial: "+222", flag: "🇲🇷", placeholder: "XXXXXXXX" },
  /* ── أفريقيا جنوب الصحراء ── */
  { name: "Somalia",                   nameAr: "الصومال",                  code: "SO", dial: "+252", flag: "🇸🇴", placeholder: "XXXXXXXXX" },
  { name: "Djibouti",                  nameAr: "جيبوتي",                   code: "DJ", dial: "+253", flag: "🇩🇯", placeholder: "XXXXXXXX" },
  { name: "Eritrea",                   nameAr: "إريتريا",                  code: "ER", dial: "+291", flag: "🇪🇷", placeholder: "XXXXXXX" },
  { name: "Ethiopia",                  nameAr: "إثيوبيا",                  code: "ET", dial: "+251", flag: "🇪🇹", placeholder: "XXXXXXXXX" },
  { name: "Kenya",                     nameAr: "كينيا",                    code: "KE", dial: "+254", flag: "🇰🇪", placeholder: "XXXXXXXXX" },
  { name: "Uganda",                    nameAr: "أوغندا",                   code: "UG", dial: "+256", flag: "🇺🇬", placeholder: "XXXXXXXXX" },
  { name: "Tanzania",                  nameAr: "تنزانيا",                  code: "TZ", dial: "+255", flag: "🇹🇿", placeholder: "XXXXXXXXX" },
  { name: "Rwanda",                    nameAr: "رواندا",                   code: "RW", dial: "+250", flag: "🇷🇼", placeholder: "XXXXXXXXX" },
  { name: "Burundi",                   nameAr: "بوروندي",                  code: "BI", dial: "+257", flag: "🇧🇮", placeholder: "XXXXXXXX" },
  { name: "Nigeria",                   nameAr: "نيجيريا",                  code: "NG", dial: "+234", flag: "🇳🇬", placeholder: "XXXXXXXXXX" },
  { name: "Ghana",                     nameAr: "غانا",                     code: "GH", dial: "+233", flag: "🇬🇭", placeholder: "XXXXXXXXX" },
  { name: "Senegal",                   nameAr: "السنغال",                  code: "SN", dial: "+221", flag: "🇸🇳", placeholder: "XXXXXXXXX" },
  { name: "Ivory Coast",               nameAr: "ساحل العاج",               code: "CI", dial: "+225", flag: "🇨🇮", placeholder: "XXXXXXXXXX" },
  { name: "Mali",                      nameAr: "مالي",                     code: "ML", dial: "+223", flag: "🇲🇱", placeholder: "XXXXXXXX" },
  { name: "Burkina Faso",              nameAr: "بوركينا فاسو",             code: "BF", dial: "+226", flag: "🇧🇫", placeholder: "XXXXXXXX" },
  { name: "Niger",                     nameAr: "النيجر",                   code: "NE", dial: "+227", flag: "🇳🇪", placeholder: "XXXXXXXX" },
  { name: "Chad",                      nameAr: "تشاد",                     code: "TD", dial: "+235", flag: "🇹🇩", placeholder: "XXXXXXXX" },
  { name: "Cameroon",                  nameAr: "الكاميرون",                code: "CM", dial: "+237", flag: "🇨🇲", placeholder: "XXXXXXXXX" },
  { name: "Gabon",                     nameAr: "الغابون",                  code: "GA", dial: "+241", flag: "🇬🇦", placeholder: "XXXXXXXX" },
  { name: "Congo (Rep.)",              nameAr: "الكونغو",                  code: "CG", dial: "+242", flag: "🇨🇬", placeholder: "XXXXXXXXX" },
  { name: "Congo (DRC)",               nameAr: "الكونغو الديمقراطية",      code: "CD", dial: "+243", flag: "🇨🇩", placeholder: "XXXXXXXXX" },
  { name: "Central African Republic",  nameAr: "جمهورية أفريقيا الوسطى",  code: "CF", dial: "+236", flag: "🇨🇫", placeholder: "XXXXXXXX" },
  { name: "Equatorial Guinea",         nameAr: "غينيا الاستوائية",         code: "GQ", dial: "+240", flag: "🇬🇶", placeholder: "XXXXXXXXX" },
  { name: "São Tomé and Príncipe",     nameAr: "ساو تومي وبرينسيبي",       code: "ST", dial: "+239", flag: "🇸🇹", placeholder: "XXXXXXX" },
  { name: "Angola",                    nameAr: "أنغولا",                   code: "AO", dial: "+244", flag: "🇦🇴", placeholder: "XXXXXXXXX" },
  { name: "Zambia",                    nameAr: "زامبيا",                   code: "ZM", dial: "+260", flag: "🇿🇲", placeholder: "XXXXXXXXX" },
  { name: "Zimbabwe",                  nameAr: "زيمبابوي",                 code: "ZW", dial: "+263", flag: "🇿🇼", placeholder: "XXXXXXXXX" },
  { name: "Mozambique",                nameAr: "موزمبيق",                  code: "MZ", dial: "+258", flag: "🇲🇿", placeholder: "XXXXXXXXX" },
  { name: "Malawi",                    nameAr: "ملاوي",                    code: "MW", dial: "+265", flag: "🇲🇼", placeholder: "XXXXXXXXX" },
  { name: "Namibia",                   nameAr: "ناميبيا",                  code: "NA", dial: "+264", flag: "🇳🇦", placeholder: "XXXXXXXXX" },
  { name: "Botswana",                  nameAr: "بوتسوانا",                 code: "BW", dial: "+267", flag: "🇧🇼", placeholder: "XXXXXXXX" },
  { name: "South Africa",              nameAr: "جنوب أفريقيا",             code: "ZA", dial: "+27",  flag: "🇿🇦", placeholder: "XXXXXXXXX" },
  { name: "Lesotho",                   nameAr: "ليسوتو",                   code: "LS", dial: "+266", flag: "🇱🇸", placeholder: "XXXXXXXX" },
  { name: "Eswatini",                  nameAr: "إيسواتيني",                code: "SZ", dial: "+268", flag: "🇸🇿", placeholder: "XXXXXXXX" },
  { name: "Madagascar",                nameAr: "مدغشقر",                   code: "MG", dial: "+261", flag: "🇲🇬", placeholder: "XXXXXXXXX" },
  { name: "Mauritius",                 nameAr: "موريشيوس",                 code: "MU", dial: "+230", flag: "🇲🇺", placeholder: "XXXXXXXX" },
  { name: "Seychelles",                nameAr: "سيشل",                     code: "SC", dial: "+248", flag: "🇸🇨", placeholder: "XXXXXXX" },
  { name: "Comoros",                   nameAr: "جزر القمر",                code: "KM", dial: "+269", flag: "🇰🇲", placeholder: "XXXXXXX" },
  { name: "Guinea",                    nameAr: "غينيا",                    code: "GN", dial: "+224", flag: "🇬🇳", placeholder: "XXXXXXXXX" },
  { name: "Guinea-Bissau",             nameAr: "غينيا بيساو",              code: "GW", dial: "+245", flag: "🇬🇼", placeholder: "XXXXXXX" },
  { name: "Sierra Leone",              nameAr: "سيراليون",                 code: "SL", dial: "+232", flag: "🇸🇱", placeholder: "XXXXXXXX" },
  { name: "Liberia",                   nameAr: "ليبيريا",                  code: "LR", dial: "+231", flag: "🇱🇷", placeholder: "XXXXXXXXX" },
  { name: "Togo",                      nameAr: "توغو",                     code: "TG", dial: "+228", flag: "🇹🇬", placeholder: "XXXXXXXX" },
  { name: "Benin",                     nameAr: "بنين",                     code: "BJ", dial: "+229", flag: "🇧🇯", placeholder: "XXXXXXXXX" },
  { name: "Gambia",                    nameAr: "غامبيا",                   code: "GM", dial: "+220", flag: "🇬🇲", placeholder: "XXXXXXX" },
  { name: "Cape Verde",                nameAr: "الرأس الأخضر",             code: "CV", dial: "+238", flag: "🇨🇻", placeholder: "XXXXXXX" },
  /* ── آسيا ── */
  { name: "Turkey",                    nameAr: "تركيا",                    code: "TR", dial: "+90",  flag: "🇹🇷", placeholder: "XXXXXXXXXX" },
  { name: "Iran",                      nameAr: "إيران",                    code: "IR", dial: "+98",  flag: "🇮🇷", placeholder: "XXXXXXXXXX" },
  { name: "Afghanistan",               nameAr: "أفغانستان",                code: "AF", dial: "+93",  flag: "🇦🇫", placeholder: "XXXXXXXXX" },
  { name: "Pakistan",                  nameAr: "باكستان",                  code: "PK", dial: "+92",  flag: "🇵🇰", placeholder: "XXXXXXXXXX" },
  { name: "India",                     nameAr: "الهند",                    code: "IN", dial: "+91",  flag: "🇮🇳", placeholder: "XXXXXXXXXX" },
  { name: "Bangladesh",                nameAr: "بنغلاديش",                 code: "BD", dial: "+880", flag: "🇧🇩", placeholder: "XXXXXXXXXX" },
  { name: "Sri Lanka",                 nameAr: "سريلانكا",                 code: "LK", dial: "+94",  flag: "🇱🇰", placeholder: "XXXXXXXXX" },
  { name: "Nepal",                     nameAr: "نيبال",                    code: "NP", dial: "+977", flag: "🇳🇵", placeholder: "XXXXXXXXXX" },
  { name: "Bhutan",                    nameAr: "بوتان",                    code: "BT", dial: "+975", flag: "🇧🇹", placeholder: "XXXXXXXX" },
  { name: "Maldives",                  nameAr: "المالديف",                 code: "MV", dial: "+960", flag: "🇲🇻", placeholder: "XXXXXXX" },
  { name: "China",                     nameAr: "الصين",                    code: "CN", dial: "+86",  flag: "🇨🇳", placeholder: "XXXXXXXXXXX" },
  { name: "Japan",                     nameAr: "اليابان",                  code: "JP", dial: "+81",  flag: "🇯🇵", placeholder: "XXXXXXXXXX" },
  { name: "South Korea",               nameAr: "كوريا الجنوبية",           code: "KR", dial: "+82",  flag: "🇰🇷", placeholder: "XXXXXXXXXX" },
  { name: "Taiwan",                    nameAr: "تايوان",                   code: "TW", dial: "+886", flag: "🇹🇼", placeholder: "XXXXXXXXX" },
  { name: "Mongolia",                  nameAr: "منغوليا",                  code: "MN", dial: "+976", flag: "🇲🇳", placeholder: "XXXXXXXX" },
  { name: "Vietnam",                   nameAr: "فيتنام",                   code: "VN", dial: "+84",  flag: "🇻🇳", placeholder: "XXXXXXXXXX" },
  { name: "Thailand",                  nameAr: "تايلاند",                  code: "TH", dial: "+66",  flag: "🇹🇭", placeholder: "XXXXXXXXX" },
  { name: "Malaysia",                  nameAr: "ماليزيا",                  code: "MY", dial: "+60",  flag: "🇲🇾", placeholder: "XXXXXXXXXX" },
  { name: "Singapore",                 nameAr: "سنغافورة",                 code: "SG", dial: "+65",  flag: "🇸🇬", placeholder: "XXXXXXXX" },
  { name: "Indonesia",                 nameAr: "إندونيسيا",                code: "ID", dial: "+62",  flag: "🇮🇩", placeholder: "XXXXXXXXXXX" },
  { name: "Philippines",               nameAr: "الفلبين",                  code: "PH", dial: "+63",  flag: "🇵🇭", placeholder: "XXXXXXXXXX" },
  { name: "Cambodia",                  nameAr: "كمبوديا",                  code: "KH", dial: "+855", flag: "🇰🇭", placeholder: "XXXXXXXXX" },
  { name: "Myanmar",                   nameAr: "ميانمار",                  code: "MM", dial: "+95",  flag: "🇲🇲", placeholder: "XXXXXXXXXX" },
  { name: "Laos",                      nameAr: "لاوس",                     code: "LA", dial: "+856", flag: "🇱🇦", placeholder: "XXXXXXXXX" },
  { name: "Brunei",                    nameAr: "بروناي",                   code: "BN", dial: "+673", flag: "🇧🇳", placeholder: "XXXXXXX" },
  { name: "Timor-Leste",               nameAr: "تيمور الشرقية",            code: "TL", dial: "+670", flag: "🇹🇱", placeholder: "XXXXXXXX" },
  { name: "Kazakhstan",                nameAr: "كازاخستان",                code: "KZ", dial: "+7",   flag: "🇰🇿", placeholder: "XXXXXXXXXX" },
  { name: "Uzbekistan",                nameAr: "أوزبكستان",                code: "UZ", dial: "+998", flag: "🇺🇿", placeholder: "XXXXXXXXX" },
  { name: "Turkmenistan",              nameAr: "تركمانستان",               code: "TM", dial: "+993", flag: "🇹🇲", placeholder: "XXXXXXXX" },
  { name: "Tajikistan",                nameAr: "طاجيكستان",                code: "TJ", dial: "+992", flag: "🇹🇯", placeholder: "XXXXXXXXX" },
  { name: "Kyrgyzstan",                nameAr: "قيرغيزستان",               code: "KG", dial: "+996", flag: "🇰🇬", placeholder: "XXXXXXXXX" },
  { name: "Azerbaijan",                nameAr: "أذربيجان",                 code: "AZ", dial: "+994", flag: "🇦🇿", placeholder: "XXXXXXXXX" },
  { name: "Armenia",                   nameAr: "أرمينيا",                  code: "AM", dial: "+374", flag: "🇦🇲", placeholder: "XXXXXXXX" },
  { name: "Georgia",                   nameAr: "جورجيا",                   code: "GE", dial: "+995", flag: "🇬🇪", placeholder: "XXXXXXXXX" },
  { name: "Cyprus",                    nameAr: "قبرص",                     code: "CY", dial: "+357", flag: "🇨🇾", placeholder: "XXXXXXXX" },
  { name: "North Korea",               nameAr: "كوريا الشمالية",           code: "KP", dial: "+850", flag: "🇰🇵", placeholder: "XXXXXXXXX" },
  /* ── أوروبا ── */
  { name: "United Kingdom",            nameAr: "المملكة المتحدة",          code: "GB", dial: "+44",  flag: "🇬🇧", placeholder: "XXXXXXXXXX" },
  { name: "Germany",                   nameAr: "ألمانيا",                  code: "DE", dial: "+49",  flag: "🇩🇪", placeholder: "XXXXXXXXXX" },
  { name: "France",                    nameAr: "فرنسا",                    code: "FR", dial: "+33",  flag: "🇫🇷", placeholder: "XXXXXXXXX" },
  { name: "Italy",                     nameAr: "إيطاليا",                  code: "IT", dial: "+39",  flag: "🇮🇹", placeholder: "XXXXXXXXXX" },
  { name: "Spain",                     nameAr: "إسبانيا",                  code: "ES", dial: "+34",  flag: "🇪🇸", placeholder: "XXXXXXXXX" },
  { name: "Netherlands",               nameAr: "هولندا",                   code: "NL", dial: "+31",  flag: "🇳🇱", placeholder: "XXXXXXXXX" },
  { name: "Belgium",                   nameAr: "بلجيكا",                   code: "BE", dial: "+32",  flag: "🇧🇪", placeholder: "XXXXXXXXX" },
  { name: "Sweden",                    nameAr: "السويد",                   code: "SE", dial: "+46",  flag: "🇸🇪", placeholder: "XXXXXXXXX" },
  { name: "Norway",                    nameAr: "النرويج",                  code: "NO", dial: "+47",  flag: "🇳🇴", placeholder: "XXXXXXXX" },
  { name: "Denmark",                   nameAr: "الدنمارك",                 code: "DK", dial: "+45",  flag: "🇩🇰", placeholder: "XXXXXXXX" },
  { name: "Finland",                   nameAr: "فنلندا",                   code: "FI", dial: "+358", flag: "🇫🇮", placeholder: "XXXXXXXXX" },
  { name: "Switzerland",               nameAr: "سويسرا",                   code: "CH", dial: "+41",  flag: "🇨🇭", placeholder: "XXXXXXXXX" },
  { name: "Austria",                   nameAr: "النمسا",                   code: "AT", dial: "+43",  flag: "🇦🇹", placeholder: "XXXXXXXXXX" },
  { name: "Portugal",                  nameAr: "البرتغال",                 code: "PT", dial: "+351", flag: "🇵🇹", placeholder: "XXXXXXXXX" },
  { name: "Poland",                    nameAr: "بولندا",                   code: "PL", dial: "+48",  flag: "🇵🇱", placeholder: "XXXXXXXXX" },
  { name: "Czech Republic",            nameAr: "جمهورية التشيك",           code: "CZ", dial: "+420", flag: "🇨🇿", placeholder: "XXXXXXXXX" },
  { name: "Slovakia",                  nameAr: "سلوفاكيا",                 code: "SK", dial: "+421", flag: "🇸🇰", placeholder: "XXXXXXXXX" },
  { name: "Hungary",                   nameAr: "المجر",                    code: "HU", dial: "+36",  flag: "🇭🇺", placeholder: "XXXXXXXXX" },
  { name: "Romania",                   nameAr: "رومانيا",                  code: "RO", dial: "+40",  flag: "🇷🇴", placeholder: "XXXXXXXXX" },
  { name: "Bulgaria",                  nameAr: "بلغاريا",                  code: "BG", dial: "+359", flag: "🇧🇬", placeholder: "XXXXXXXXX" },
  { name: "Greece",                    nameAr: "اليونان",                  code: "GR", dial: "+30",  flag: "🇬🇷", placeholder: "XXXXXXXXXX" },
  { name: "Croatia",                   nameAr: "كرواتيا",                  code: "HR", dial: "+385", flag: "🇭🇷", placeholder: "XXXXXXXXX" },
  { name: "Slovenia",                  nameAr: "سلوفينيا",                 code: "SI", dial: "+386", flag: "🇸🇮", placeholder: "XXXXXXXX" },
  { name: "Bosnia and Herzegovina",    nameAr: "البوسنة والهرسك",          code: "BA", dial: "+387", flag: "🇧🇦", placeholder: "XXXXXXXX" },
  { name: "Serbia",                    nameAr: "صربيا",                    code: "RS", dial: "+381", flag: "🇷🇸", placeholder: "XXXXXXXXX" },
  { name: "Montenegro",                nameAr: "الجبل الأسود",             code: "ME", dial: "+382", flag: "🇲🇪", placeholder: "XXXXXXXX" },
  { name: "North Macedonia",           nameAr: "مقدونيا الشمالية",         code: "MK", dial: "+389", flag: "🇲🇰", placeholder: "XXXXXXXX" },
  { name: "Albania",                   nameAr: "ألبانيا",                  code: "AL", dial: "+355", flag: "🇦🇱", placeholder: "XXXXXXXXX" },
  { name: "Kosovo",                    nameAr: "كوسوفو",                   code: "XK", dial: "+383", flag: "🇽🇰", placeholder: "XXXXXXXX" },
  { name: "Ukraine",                   nameAr: "أوكرانيا",                 code: "UA", dial: "+380", flag: "🇺🇦", placeholder: "XXXXXXXXX" },
  { name: "Belarus",                   nameAr: "بيلاروسيا",                code: "BY", dial: "+375", flag: "🇧🇾", placeholder: "XXXXXXXXX" },
  { name: "Moldova",                   nameAr: "مولدوفا",                  code: "MD", dial: "+373", flag: "🇲🇩", placeholder: "XXXXXXXX" },
  { name: "Russia",                    nameAr: "روسيا",                    code: "RU", dial: "+7",   flag: "🇷🇺", placeholder: "XXXXXXXXXX" },
  { name: "Estonia",                   nameAr: "إستونيا",                  code: "EE", dial: "+372", flag: "🇪🇪", placeholder: "XXXXXXXX" },
  { name: "Latvia",                    nameAr: "لاتفيا",                   code: "LV", dial: "+371", flag: "🇱🇻", placeholder: "XXXXXXXX" },
  { name: "Lithuania",                 nameAr: "ليتوانيا",                 code: "LT", dial: "+370", flag: "🇱🇹", placeholder: "XXXXXXXX" },
  { name: "Iceland",                   nameAr: "آيسلندا",                  code: "IS", dial: "+354", flag: "🇮🇸", placeholder: "XXXXXXX" },
  { name: "Ireland",                   nameAr: "أيرلندا",                  code: "IE", dial: "+353", flag: "🇮🇪", placeholder: "XXXXXXXXX" },
  { name: "Luxembourg",                nameAr: "لوكسمبورغ",                code: "LU", dial: "+352", flag: "🇱🇺", placeholder: "XXXXXXX" },
  { name: "Malta",                     nameAr: "مالطا",                    code: "MT", dial: "+356", flag: "🇲🇹", placeholder: "XXXXXXXX" },
  { name: "Andorra",                   nameAr: "أندورا",                   code: "AD", dial: "+376", flag: "🇦🇩", placeholder: "XXXXXX" },
  { name: "Monaco",                    nameAr: "موناكو",                   code: "MC", dial: "+377", flag: "🇲🇨", placeholder: "XXXXXXXX" },
  { name: "Liechtenstein",             nameAr: "ليختنشتاين",               code: "LI", dial: "+423", flag: "🇱🇮", placeholder: "XXXXXXX" },
  { name: "San Marino",                nameAr: "سان مارينو",               code: "SM", dial: "+378", flag: "🇸🇲", placeholder: "XXXXXXXXXX" },
  /* ── أمريكا الشمالية ── */
  { name: "United States",             nameAr: "الولايات المتحدة",         code: "US", dial: "+1",   flag: "🇺🇸", placeholder: "XXXXXXXXXX" },
  { name: "Canada",                    nameAr: "كندا",                     code: "CA", dial: "+1",   flag: "🇨🇦", placeholder: "XXXXXXXXXX" },
  { name: "Mexico",                    nameAr: "المكسيك",                  code: "MX", dial: "+52",  flag: "🇲🇽", placeholder: "XXXXXXXXXX" },
  { name: "Cuba",                      nameAr: "كوبا",                     code: "CU", dial: "+53",  flag: "🇨🇺", placeholder: "XXXXXXXXX" },
  { name: "Dominican Republic",        nameAr: "الدومينيكان",              code: "DO", dial: "+1",   flag: "🇩🇴", placeholder: "XXXXXXXXXX" },
  { name: "Haiti",                     nameAr: "هايتي",                    code: "HT", dial: "+509", flag: "🇭🇹", placeholder: "XXXXXXXX" },
  { name: "Jamaica",                   nameAr: "جامايكا",                  code: "JM", dial: "+1",   flag: "🇯🇲", placeholder: "XXXXXXXXXX" },
  { name: "Trinidad and Tobago",       nameAr: "ترينيداد وتوباغو",         code: "TT", dial: "+1",   flag: "🇹🇹", placeholder: "XXXXXXXXXX" },
  { name: "Barbados",                  nameAr: "بربادوس",                  code: "BB", dial: "+1",   flag: "🇧🇧", placeholder: "XXXXXXXXXX" },
  { name: "Bahamas",                   nameAr: "جزر البهاما",              code: "BS", dial: "+1",   flag: "🇧🇸", placeholder: "XXXXXXXXXX" },
  { name: "Belize",                    nameAr: "بليز",                     code: "BZ", dial: "+501", flag: "🇧🇿", placeholder: "XXXXXXX" },
  { name: "Costa Rica",                nameAr: "كوستاريكا",                code: "CR", dial: "+506", flag: "🇨🇷", placeholder: "XXXXXXXX" },
  { name: "Guatemala",                 nameAr: "غواتيمالا",                code: "GT", dial: "+502", flag: "🇬🇹", placeholder: "XXXXXXXX" },
  { name: "Honduras",                  nameAr: "هندوراس",                  code: "HN", dial: "+504", flag: "🇭🇳", placeholder: "XXXXXXXX" },
  { name: "El Salvador",               nameAr: "السلفادور",                code: "SV", dial: "+503", flag: "🇸🇻", placeholder: "XXXXXXXX" },
  { name: "Nicaragua",                 nameAr: "نيكاراغوا",                code: "NI", dial: "+505", flag: "🇳🇮", placeholder: "XXXXXXXX" },
  { name: "Panama",                    nameAr: "بنما",                     code: "PA", dial: "+507", flag: "🇵🇦", placeholder: "XXXXXXXX" },
  /* ── أمريكا الجنوبية ── */
  { name: "Brazil",                    nameAr: "البرازيل",                 code: "BR", dial: "+55",  flag: "🇧🇷", placeholder: "XXXXXXXXXXX" },
  { name: "Argentina",                 nameAr: "الأرجنتين",                code: "AR", dial: "+54",  flag: "🇦🇷", placeholder: "XXXXXXXXXX" },
  { name: "Colombia",                  nameAr: "كولومبيا",                 code: "CO", dial: "+57",  flag: "🇨🇴", placeholder: "XXXXXXXXXX" },
  { name: "Chile",                     nameAr: "تشيلي",                    code: "CL", dial: "+56",  flag: "🇨🇱", placeholder: "XXXXXXXXX" },
  { name: "Peru",                      nameAr: "بيرو",                     code: "PE", dial: "+51",  flag: "🇵🇪", placeholder: "XXXXXXXXX" },
  { name: "Venezuela",                 nameAr: "فنزويلا",                  code: "VE", dial: "+58",  flag: "🇻🇪", placeholder: "XXXXXXXXXX" },
  { name: "Ecuador",                   nameAr: "الإكوادور",                code: "EC", dial: "+593", flag: "🇪🇨", placeholder: "XXXXXXXXX" },
  { name: "Bolivia",                   nameAr: "بوليفيا",                  code: "BO", dial: "+591", flag: "🇧🇴", placeholder: "XXXXXXXXX" },
  { name: "Paraguay",                  nameAr: "باراغواي",                 code: "PY", dial: "+595", flag: "🇵🇾", placeholder: "XXXXXXXXX" },
  { name: "Uruguay",                   nameAr: "أوروغواي",                 code: "UY", dial: "+598", flag: "🇺🇾", placeholder: "XXXXXXXXX" },
  { name: "Guyana",                    nameAr: "غيانا",                    code: "GY", dial: "+592", flag: "🇬🇾", placeholder: "XXXXXXX" },
  { name: "Suriname",                  nameAr: "سورينام",                  code: "SR", dial: "+597", flag: "🇸🇷", placeholder: "XXXXXXX" },
  /* ── أوقيانوسيا ── */
  { name: "Australia",                 nameAr: "أستراليا",                 code: "AU", dial: "+61",  flag: "🇦🇺", placeholder: "XXXXXXXXX" },
  { name: "New Zealand",               nameAr: "نيوزيلندا",                code: "NZ", dial: "+64",  flag: "🇳🇿", placeholder: "XXXXXXXXX" },
  { name: "Papua New Guinea",          nameAr: "بابوا غينيا الجديدة",      code: "PG", dial: "+675", flag: "🇵🇬", placeholder: "XXXXXXXX" },
  { name: "Fiji",                      nameAr: "فيجي",                     code: "FJ", dial: "+679", flag: "🇫🇯", placeholder: "XXXXXXX" },
  { name: "Solomon Islands",           nameAr: "جزر سليمان",               code: "SB", dial: "+677", flag: "🇸🇧", placeholder: "XXXXXXX" },
  { name: "Vanuatu",                   nameAr: "فانواتو",                  code: "VU", dial: "+678", flag: "🇻🇺", placeholder: "XXXXXXX" },
  { name: "Samoa",                     nameAr: "ساموا",                    code: "WS", dial: "+685", flag: "🇼🇸", placeholder: "XXXXXXX" },
  { name: "Tonga",                     nameAr: "تونغا",                    code: "TO", dial: "+676", flag: "🇹🇴", placeholder: "XXXXXXX" },
  { name: "Kiribati",                  nameAr: "كيريباتي",                 code: "KI", dial: "+686", flag: "🇰🇮", placeholder: "XXXXXXX" },
  { name: "Micronesia",                nameAr: "ميكرونيزيا",               code: "FM", dial: "+691", flag: "🇫🇲", placeholder: "XXXXXXX" },
  { name: "Palau",                     nameAr: "بالاو",                    code: "PW", dial: "+680", flag: "🇵🇼", placeholder: "XXXXXXX" },
  { name: "Marshall Islands",          nameAr: "جزر مارشال",               code: "MH", dial: "+692", flag: "🇲🇭", placeholder: "XXXXXXX" },
  { name: "Nauru",                     nameAr: "ناورو",                    code: "NR", dial: "+674", flag: "🇳🇷", placeholder: "XXXXXXX" },
  { name: "Tuvalu",                    nameAr: "توفالو",                   code: "TV", dial: "+688", flag: "🇹🇻", placeholder: "XXXXXX" },
];

const COUNTRY_CODE_MAP: Record<string, CountryData> = Object.fromEntries(
  COUNTRIES.map(c => [c.code, c])
);

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountryPhoneInput({ value, onChange, placeholder, className }: CountryPhoneInputProps) {
  const [selected, setSelected] = useState<CountryData>(COUNTRIES[0]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [detected, setDetected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (detected) return;
    getCountryCode().then(code => {
      if (code && COUNTRY_CODE_MAP[code]) {
        setSelected(COUNTRY_CODE_MAP[code]);
      }
      setDetected(true);
    }).catch(() => setDetected(true));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  const filtered = COUNTRIES.filter(c =>
    c.nameAr.includes(search) || c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  );

  const handleSelect = (country: CountryData) => {
    setSelected(country);
    setOpen(false);
    onChange(`${country.dial}${phoneNumber}`);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^0-9]/g, "");
    setPhoneNumber(num);
    onChange(`${selected.dial}${num}`);
  };

  const activePlaceholder = placeholder || selected.placeholder;

  return (
    <div
      className={`relative flex h-12 rounded-xl border border-black/[0.08] bg-black/[0.02] overflow-hidden focus-within:border-black/20 transition-colors ${className || ""}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 border-r border-black/[0.06] bg-black/[0.01] hover:bg-black/[0.03] transition-colors min-w-[90px] flex-shrink-0"
        data-testid="btn-country-dial"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-xs font-semibold text-black/60">{selected.dial}</span>
        <ChevronDown className={`w-3 h-3 text-black/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={activePlaceholder}
        className="flex-1 bg-transparent px-3 text-sm text-black placeholder:text-black/25 outline-none"
        data-testid="input-phone-number"
        dir="ltr"
      />

      {open && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-white border border-black/[0.07] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-black/[0.04]">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/[0.02] rounded-lg">
              <Search className="w-3.5 h-3.5 text-black/30 flex-shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن الدولة..."
                className="flex-1 bg-transparent text-xs outline-none text-black placeholder:text-black/30"
                data-testid="input-country-search"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-black/30">لا توجد نتائج</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code + c.dial}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-right hover:bg-black/[0.02] transition-colors ${selected.code === c.code && selected.dial === c.dial ? "bg-black/[0.03]" : ""}`}
                  data-testid={`btn-country-${c.code}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-xs text-black/70 text-right">{c.nameAr}</span>
                  <span className="text-[10px] text-black/35 font-mono">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
