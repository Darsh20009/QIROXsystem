import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Bot, CheckCheck, ChevronLeft, ChevronRight, MessageSquare, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface AISessionNotif {
  _id: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

interface SessionsResponse {
  sessions: AISessionNotif[];
  total: number;
  page: number;
  pages: number;
}

export default function AdminAISessions() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const [page, setPage] = [
    parseInt(new URLSearchParams(window.location.search).get("page") || "1"),
    (p: number) => {
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(p));
      window.history.pushState({}, "", url);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-sessions"] });
    },
  ];

  const { data, isLoading } = useQuery<SessionsResponse>({
    queryKey: ["/api/admin/ai-sessions", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ai-sessions?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/ai-sessions/${id}/read`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-sessions"] });
    },
  });

  const sessions = data?.sessions || [];
  const unreadCount = sessions.filter(s => !s.read).length;

  return (
    <div className="space-y-6" dir={L ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {L ? "جلسات الذكاء الاصطناعي" : "AI Sessions"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {L ? "ملخصات أهم محادثات العملاء والموظفين مع الذكاء الاصطناعي" : "Summaries of important AI conversations with clients and employees"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0">
            {unreadCount} {L ? "غير مقروء" : "unread"}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                {L ? "لا توجد جلسات بعد" : "No AI sessions yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {L ? "ستظهر هنا ملخصات محادثات العملاء والموظفين مع الذكاء الاصطناعي عند حدوثها" : "Summaries will appear here when clients or employees interact with AI"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card
              key={session._id}
              className={`transition-all border ${!session.read ? "border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/10" : "border-gray-100 dark:border-gray-800"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${!session.read ? "bg-violet-100 dark:bg-violet-900/40" : "bg-gray-100 dark:bg-gray-800"}`}>
                      <MessageSquare className={`w-4 h-4 ${!session.read ? "text-violet-600 dark:text-violet-400" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {session.title}
                        </p>
                        {!session.read && (
                          <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        {session.body}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {format(new Date(session.createdAt), "PPpp", { locale: L ? ar : undefined })}
                      </p>
                    </div>
                  </div>
                  {!session.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30"
                      onClick={() => markRead.mutate(session._id)}
                    >
                      <CheckCheck className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {L ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {L ? `${page} من ${data.pages}` : `${page} of ${data.pages}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}
          >
            {L ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
