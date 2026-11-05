import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Globe } from "lucide-react";
import { COUNTRIES, type CountryData } from "./CountryPhoneInput";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({ value, onChange, placeholder, className }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find(c => c.nameAr === value || c.name === value);

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
    c.nameAr.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (country: CountryData) => {
    onChange(country.nameAr);
    setOpen(false);
  };

  return (
    <div className={`relative ${className || ""}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-12 flex items-center gap-2.5 px-3 bg-black/[0.02] border border-black/[0.08] rounded-xl hover:border-black/15 focus:border-black/20 transition-colors text-right"
      >
        {selected ? (
          <>
            <span className="text-lg">{selected.flag}</span>
            <span className="flex-1 text-sm text-black text-right">{selected.nameAr}</span>
          </>
        ) : (
          <>
            <Globe className="w-4 h-4 text-black/25 flex-shrink-0" />
            <span className="flex-1 text-sm text-black/25 text-right">{placeholder || "اختر الدولة"}</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-black/30 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-white border border-black/[0.07] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-black/[0.04]">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/[0.02] rounded-lg">
              <Search className="w-3.5 h-3.5 text-black/30 flex-shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="flex-1 bg-transparent text-xs outline-none text-black placeholder:text-black/30"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-black/30">لا توجد نتائج</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-right hover:bg-black/[0.02] transition-colors ${selected?.code === c.code ? "bg-black/[0.03]" : ""}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-xs text-black/70 text-right">{c.nameAr}</span>
                  <span className="text-[10px] text-black/30">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
