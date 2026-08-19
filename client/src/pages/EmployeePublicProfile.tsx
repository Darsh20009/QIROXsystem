import { useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Building2, BadgeCheck } from "lucide-react";

// Public employee profile — opens when someone scans the Apple Wallet QR code
// Route: /ep/:code

export default function EmployeePublicProfile() {
  const [, params] = useRoute("/ep/:code");
  const code = params?.code || "";

  const { data, isLoading, isError } = useQuery<any>({
    queryKey: [`/api/public/employee-card/${code}`],
    queryFn: async () => {
      const r = await fetch(`/api/public/employee-card/${encodeURIComponent(code)}`);
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    enabled: !!code,
    retry: false,
  });

  // Update page meta for SEO
  useEffect(() => {
    if (data) {
      document.title = `${data.fullName} — ${data.jobTitle} | QIROX Studio`;
      const desc = `${data.fullName}، ${data.jobTitle} في شركة QIROX Studio.`;
      let el = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.name = "description"; document.head.appendChild(el); }
      el.content = desc;

      // OG
      const setOG = (p: string, v: string) => {
        let og = document.querySelector(`meta[property="${p}"]`) as HTMLMetaElement;
        if (!og) { og = document.createElement("meta"); og.setAttribute("property", p); document.head.appendChild(og); }
        og.content = v;
      };
      setOG("og:title", `${data.fullName} — ${data.jobTitle} | QIROX Studio`);
      setOG("og:description", desc);
      if (data.avatarUrl) setOG("og:image", data.avatarUrl);

      // JSON-LD
      const schemaId = "ld-emp-profile";
      let sc = document.getElementById(schemaId) as HTMLScriptElement;
      if (!sc) { sc = document.createElement("script"); sc.id = schemaId; sc.type = "application/ld+json"; document.head.appendChild(sc); }
      sc.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        "name": data.fullName,
        "jobTitle": data.jobTitle,
        "worksFor": { "@type": "Organization", "name": "QIROX Studio", "url": "https://qiroxstudio.online" },
        "image": data.avatarUrl,
        "url": `https://qiroxstudio.online/ep/${code}`,
      });
    }
  }, [data, code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a16] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-white/30" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a16] flex flex-col items-center justify-center text-white text-center px-6">
        <img src="/qirox-icon.png" alt="QIROX Studio" className="w-16 h-16 mb-6 opacity-50" />
        <p className="text-lg font-bold text-white/50">هذه البطاقة غير موجودة أو انتهت صلاحيتها</p>
        <a href="https://qiroxstudio.online" className="mt-6 text-sm text-white/30 underline">qiroxstudio.online</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a16] flex flex-col items-center justify-center px-6 py-12" dir="rtl">

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-[#0a0a16] to-[#1a1a2e] p-8 flex flex-col items-center text-center">
          {/* Logo */}
          <img src="/qirox-icon.png" alt="QIROX Studio" className="w-10 h-10 mb-6" />

          {/* Avatar */}
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={`${data.fullName} — ${data.jobTitle} QIROX Studio`}
              className="w-28 h-28 rounded-2xl object-cover border-2 border-white/10 mb-5"
            />
          ) : (
            <div className="w-28 h-28 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
              <span className="text-4xl font-black text-white">
                {data.fullName?.split(" ").slice(0, 2).map((w: string) => w[0]).join("") || "Q"}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-black text-white mb-1">{data.fullName}</h1>
          <p className="text-white/60 text-sm">{data.jobTitle}</p>

          {data.department && (
            <p className="text-white/40 text-xs mt-1">{data.department}</p>
          )}

          {data.employeeCode && (
            <span className="mt-3 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-mono">
              #{data.employeeCode}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">الشركة</p>
              <p className="text-sm font-bold text-gray-800">QIROX Studio</p>
            </div>
          </div>

          {data.phone && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">📞</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">الهاتف</p>
                <a href={`tel:${data.phone}`} className="text-sm font-bold text-gray-800 hover:text-blue-600 transition-colors">{data.phone}</a>
              </div>
            </div>
          )}

          {data.email && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">✉️</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">البريد</p>
                <a href={`mailto:${data.email}`} className="text-sm font-bold text-gray-800 hover:text-blue-600 transition-colors truncate block max-w-[200px]">{data.email}</a>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">التحقق</p>
              <p className="text-sm font-bold text-emerald-600">موظف رسمي موثّق</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <a
          href="https://qiroxstudio.online"
          className="block bg-[#0a0a16] text-center py-4 text-white/50 text-xs hover:text-white transition-colors"
        >
          qiroxstudio.online — QIROX Studio
        </a>
      </div>

    </div>
  );
}
