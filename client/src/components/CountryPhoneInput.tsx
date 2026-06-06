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
  { name: "Saudi Arabia",        nameAr: "المملكة العربية السعودية", code: "SA", dial: "+966", flag: "🇸🇦", placeholder: "5XXXXXXXX" },
  { name: "United Arab Emirates",nameAr: "الإمارات العربية المتحدة", code: "AE", dial: "+971", flag: "🇦🇪", placeholder: "5XXXXXXXX" },
  { name: "Kuwait",              nameAr: "الكويت",                   code: "KW", dial: "+965", flag: "🇰🇼", placeholder: "XXXXXXXX" },
  { name: "Qatar",               nameAr: "قطر",                      code: "QA", dial: "+974", flag: "🇶🇦", placeholder: "XXXXXXXX" },
  { name: "Bahrain",             nameAr: "البحرين",                  code: "BH", dial: "+973", flag: "🇧🇭", placeholder: "XXXXXXXX" },
  { name: "Oman",                nameAr: "عُمان",                    code: "OM", dial: "+968", flag: "🇴🇲", placeholder: "XXXXXXXX" },
  { name: "Egypt",               nameAr: "مصر",                      code: "EG", dial: "+20",  flag: "🇪🇬", placeholder: "1XXXXXXXXX" },
  { name: "Jordan",              nameAr: "الأردن",                   code: "JO", dial: "+962", flag: "🇯🇴", placeholder: "7XXXXXXXX" },
  { name: "Lebanon",             nameAr: "لبنان",                    code: "LB", dial: "+961", flag: "🇱🇧", placeholder: "XXXXXXXX" },
  { name: "Iraq",                nameAr: "العراق",                   code: "IQ", dial: "+964", flag: "🇮🇶", placeholder: "7XXXXXXXXX" },
  { name: "Syria",               nameAr: "سوريا",                    code: "SY", dial: "+963", flag: "🇸🇾", placeholder: "9XXXXXXXX" },
  { name: "Palestine",           nameAr: "فلسطين",                   code: "PS", dial: "+970", flag: "🇵🇸", placeholder: "XXXXXXXXX" },
  { name: "Yemen",               nameAr: "اليمن",                    code: "YE", dial: "+967", flag: "🇾🇪", placeholder: "7XXXXXXXX" },
  { name: "Libya",               nameAr: "ليبيا",                    code: "LY", dial: "+218", flag: "🇱🇾", placeholder: "XXXXXXXXX" },
  { name: "Tunisia",             nameAr: "تونس",                     code: "TN", dial: "+216", flag: "🇹🇳", placeholder: "XXXXXXXX" },
  { name: "Algeria",             nameAr: "الجزائر",                  code: "DZ", dial: "+213", flag: "🇩🇿", placeholder: "XXXXXXXXX" },
  { name: "Morocco",             nameAr: "المغرب",                   code: "MA", dial: "+212", flag: "🇲🇦", placeholder: "XXXXXXXXX" },
  { name: "Sudan",               nameAr: "السودان",                  code: "SD", dial: "+249", flag: "🇸🇩", placeholder: "XXXXXXXXX" },
  { name: "Somalia",             nameAr: "الصومال",                  code: "SO", dial: "+252", flag: "🇸🇴", placeholder: "XXXXXXXXX" },
  { name: "Turkey",              nameAr: "تركيا",                    code: "TR", dial: "+90",  flag: "🇹🇷", placeholder: "XXXXXXXXXX" },
  { name: "Pakistan",            nameAr: "باكستان",                  code: "PK", dial: "+92",  flag: "🇵🇰", placeholder: "XXXXXXXXXX" },
  { name: "India",               nameAr: "الهند",                    code: "IN", dial: "+91",  flag: "🇮🇳", placeholder: "XXXXXXXXXX" },
  { name: "United States",       nameAr: "الولايات المتحدة",         code: "US", dial: "+1",   flag: "🇺🇸", placeholder: "XXXXXXXXXX" },
  { name: "United Kingdom",      nameAr: "المملكة المتحدة",          code: "GB", dial: "+44",  flag: "🇬🇧", placeholder: "XXXXXXXXXX" },
  { name: "Germany",             nameAr: "ألمانيا",                  code: "DE", dial: "+49",  flag: "🇩🇪", placeholder: "XXXXXXXXXX" },
  { name: "France",              nameAr: "فرنسا",                    code: "FR", dial: "+33",  flag: "🇫🇷", placeholder: "XXXXXXXXX" },
  { name: "Canada",              nameAr: "كندا",                     code: "CA", dial: "+1",   flag: "🇨🇦", placeholder: "XXXXXXXXXX" },
  { name: "Australia",           nameAr: "أستراليا",                 code: "AU", dial: "+61",  flag: "🇦🇺", placeholder: "XXXXXXXXX" },
  { name: "Netherlands",         nameAr: "هولندا",                   code: "NL", dial: "+31",  flag: "🇳🇱", placeholder: "XXXXXXXXX" },
  { name: "Spain",               nameAr: "إسبانيا",                  code: "ES", dial: "+34",  flag: "🇪🇸", placeholder: "XXXXXXXXX" },
  { name: "Italy",               nameAr: "إيطاليا",                  code: "IT", dial: "+39",  flag: "🇮🇹", placeholder: "XXXXXXXXXX" },
  { name: "Sweden",              nameAr: "السويد",                   code: "SE", dial: "+46",  flag: "🇸🇪", placeholder: "XXXXXXXXX" },
  { name: "Norway",              nameAr: "النرويج",                  code: "NO", dial: "+47",  flag: "🇳🇴", placeholder: "XXXXXXXX" },
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
