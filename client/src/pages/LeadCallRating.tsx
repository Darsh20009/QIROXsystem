import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function LeadCallRating() {
  const { token } = useParams<{ token: string }>();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError } = useQuery<{
    companyName: string;
    contactName: string;
    alreadyRated: boolean;
    score: number | null;
    comment: string;
  }>({
    queryKey: ["/api/leads/rate", token],
    queryFn: () => fetch(`/api/leads/rate/${token}`).then(r => {
      if (!r.ok) throw new Error("invalid");
      return r.json();
    }),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/leads/rate/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: selected, comment }),
      }).then(r => r.json()),
    onSuccess: () => setSubmitted(true),
  });

  const displayName = data?.contactName || data?.companyName || "عزيزنا العميل";

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          <p className="text-gray-500 text-sm">جارٍ التحميل...</p>
        </div>
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-bold text-gray-800">الرابط غير صالح</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            هذا الرابط غير صالح أو انتهت صلاحيته. يُرجى التواصل مع فريقنا إذا كنت تعتقد أن هناك خطأ.
          </p>
        </div>
      </PageShell>
    );
  }

  if (data.alreadyRated || submitted) {
    const finalScore = submitted ? selected : (data.score ?? 0);
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-12 gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">شكراً جزيلاً!</h2>
          <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
            تم استلام تقييمك بنجاح. رأيك يساعدنا على تقديم خدمة أفضل لك وللجميع.
          </p>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-8 h-8 ${s <= finalScore ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
            ))}
          </div>
          <a
            href="https://qiroxstudio.online"
            className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline underline-offset-4"
          >
            زيارة موقعنا
          </a>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="py-8 px-2" dir="rtl">
        {/* Greeting */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-1">تقييم تجربة التواصل</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            أهلاً، {displayName}!
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            تواصل معك فريق QIROX Studio مؤخراً. كيف كانت تجربتك معنا؟
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              data-testid={`star-${s}`}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(s)}
              className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              <Star
                className={`w-12 h-12 transition-colors ${
                  s <= (hovered || selected)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Score label */}
        <p className="text-center text-sm font-medium text-gray-600 mb-6 h-5">
          {selected === 1 && "سيئ جداً 😞"}
          {selected === 2 && "سيئ 😕"}
          {selected === 3 && "متوسط 😐"}
          {selected === 4 && "جيد 😊"}
          {selected === 5 && "ممتاز! 🌟"}
        </p>

        {/* Comment */}
        {selected > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              أضف تعليقاً (اختياري)
            </label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="شاركنا تجربتك أو اقتراحاتك..."
              rows={3}
              className="w-full resize-none text-sm"
            />
          </div>
        )}

        <Button
          className="w-full py-6 text-base font-bold"
          disabled={!selected || submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          {submitMutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جارٍ الإرسال...</>
          ) : (
            "إرسال التقييم ⭐"
          )}
        </Button>

        <p className="text-center text-xs text-gray-400 mt-4">
          تقييمك سري ويُستخدم فقط لتحسين جودة خدمتنا
        </p>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-black px-6 py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-3xl font-black">Q</span>
          </div>
          <p className="text-white font-black text-lg tracking-widest">QIROX STUDIO</p>
          <p className="text-white/40 text-xs mt-1 tracking-wider">qiroxstudio.online</p>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
