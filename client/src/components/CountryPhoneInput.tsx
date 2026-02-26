import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Phone } from "lucide-react";

export type CountryData = {
  name: string;
  nameAr: string;
  code: string;
  dial: string;
  flag: string;
};

export const COUNTRIES: CountryData[] = [
  { name: "Saudi Arabia",       nameAr: "المملكة العربية السعودية", code: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "United Arab Emirates",nameAr: "الإمارات العربية المتحدة", code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "Kuwait",             nameAr: "الكويت",                   code: "KW", dial: "+965", flag: "🇰🇼" },
  { name: "Qatar",              nameAr: "قطر",                      code: "QA", dial: "+974", flag: "🇶🇦" },
  { name: "Bahrain",            nameAr: "البحرين",                  code: "BH", dial: "+973", flag: "🇧🇭" },
  { name: "Oman",               nameAr: "عُمان",                    code: "OM", dial: "+968", flag: "🇴🇲" },
  { name: "Egypt",              nameAr: "مصر",                      code: "EG", dial: "+20",  flag: "🇪🇬" },
  { name: "Jordan",             nameAr: "الأردن",                   code: "JO", dial: "+962", flag: "🇯🇴" },
  { name: "Lebanon",            nameAr: "لبنان",                    code: "LB", dial: "+961", flag: "🇱🇧" },
  { name: "Iraq",               nameAr: "العراق",                   code: "IQ", dial: "+964", flag: "🇮🇶" },
  { name: "Syria",              nameAr: "سوريا",                    code: "SY", dial: "+963", flag: "🇸🇾" },
  { name: "Palestine",          nameAr: "فلسطين",                   code: "PS", dial: "+970", flag: "🇵🇸" },
  { name: "Yemen",              nameAr: "اليمن",                    code: "YE", dial: "+967", flag: "🇾🇪" },
  { name: "Libya",              nameAr: "ليبيا",                    code: "LY", dial: "+218", flag: "🇱🇾" },
  { name: "Tunisia",            nameAr: "تونس",                     code: "TN", dial: "+216", flag: "🇹🇳" },
  { name: "Algeria",            nameAr: "الجزائر",                  code: "DZ", dial: "+213", flag: "🇩🇿" },
  { name: "Morocco",            nameAr: "المغرب",                   code: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "Sudan",              nameAr: "السودان",                  code: "SD", dial: "+249", flag: "🇸🇩" },
  { name: "Somalia",            nameAr: "الصومال",                  code: "SO", dial: "+252", flag: "🇸🇴" },
  { name: "Turkey",             nameAr: "تركيا",                    code: "TR", dial: "+90",  flag: "🇹🇷" },
  { name: "Pakistan",           nameAr: "باكستان",                  code: "PK", dial: "+92",  flag: "🇵🇰" },
  { name: "India",              nameAr: "الهند",                    code: "IN", dial: "+91",  flag: "🇮🇳" },
  { name: "United States",      nameAr: "الولايات المتحدة",         code: "US", dial: "+1",   flag: "🇺🇸" },
  { name: "United Kingdom",     nameAr: "المملكة المتحدة",          code: "GB", dial: "+44",  flag: "🇬🇧" },
  { name: "Germany",            nameAr: "ألمانيا",                  code: "DE", dial: "+49",  flag: "🇩🇪" },
  { name: "France",             nameAr: "فرنسا",                    code: "FR", dial: "+33",  flag: "🇫🇷" },
  { name: "Canada",             nameAr: "كندا",                     code: "CA", dial: "+1",   flag: "🇨🇦" },
  { name: "Australia",          nameAr: "أستراليا",                 code: "AU", dial: "+61",  flag: "🇦🇺" },
];

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={`relative flex h-12 rounded-xl border border-black/[0.08] bg-black/[0.02] overflow-hidden focus-within:border-black/20 transition-colors ${className || ""}`} ref={dropdownRef}>
      {/* Country Code Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 border-r border-black/[0.06] bg-black/[0.01] hover:bg-black/[0.03] transition-colors min-w-[80px] flex-shrink-0"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-xs font-semibold text-black/60">{selected.dial}</span>
        <ChevronDown className={`w-3 h-3 text-black/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Phone Number Input */}
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder || "5XXXXXXXX"}
        className="flex-1 bg-transparent px-3 text-sm text-black placeholder:text-black/25 outline-none"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-white border border-black/[0.07] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-black/[0.04]">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/[0.02] rounded-lg">
              <Search className="w-3.5 h-3.5 text-black/30 flex-shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن الدولة..."
                className="flex-1 bg-transparent text-xs outline-none text-black placeholder:text-black/30"
              />
            </div>
          </div>
          {/* List */}
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
