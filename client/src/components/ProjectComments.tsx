import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Trash2, Lock, Pin, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props { projectId: string; currentUser: any; }

function Avatar({ user }: { user: any }) {
  if (user?.profilePhotoUrl) return <img src={user.profilePhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />;
  const name = user?.fullName || user?.username || "?";
  return (
    <div className="w-8 h-8 rounded-full bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center text-xs font-bold text-black/50 dark:text-white/50">
      {name[0]}
    </div>
  );
}

export default function ProjectComments({ projectId, currentUser }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const isStaff = currentUser?.role !== "client";

  const { data: comments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/comments`, { credentials: "include" });
      if (!res.ok) throw new Error("فشل جلب التعليقات");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/projects/${projectId}/comments`, { body: body.trim(), isInternal }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["/api/projects", projectId, "comments"] });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => apiRequest("DELETE", `/api/projects/${projectId}/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/projects", projectId, "comments"] }),
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 overflow-hidden" dir="rtl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05]">
        <MessageSquare className="w-4 h-4 text-black/40 dark:text-white/40" />
        <span className="text-sm font-bold text-black dark:text-white">التعليقات والتواصل</span>
        <span className="mr-auto text-xs text-black/30 dark:text-white/30 bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-full">
          {comments.length}
        </span>
      </div>

      {/* Comments list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-black/[0.03] dark:divide-white/[0.03]">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20 dark:text-white/20" /></div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-black/30 dark:text-white/30">لا توجد تعليقات بعد</div>
        ) : (
          comments.map((c: any) => (
            <div key={c._id} className={`flex gap-3 px-4 py-3 group ${c.isInternal ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`} data-testid={`comment-${c._id}`}>
              <Avatar user={c.userId} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-black dark:text-white">{c.userId?.fullName || c.userId?.username}</span>
                  {c.isInternal && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" />داخلي
                    </span>
                  )}
                  <span className="text-[10px] text-black/30 dark:text-white/30 mr-auto">
                    {new Date(c.createdAt).toLocaleString("ar-SA")}
                  </span>
                </div>
                <p className="text-sm text-black/70 dark:text-white/65 leading-relaxed">{c.body}</p>
              </div>
              {(isStaff || String(c.userId?._id) === String(currentUser?._id || currentUser?.id)) && (
                <button
                  onClick={() => deleteMutation.mutate(c._id)}
                  className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  data-testid={`button-delete-comment-${c._id}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-black/[0.05] dark:border-white/[0.05] space-y-2">
        <Textarea
          ref={textRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="اكتب تعليقك هنا..."
          className="resize-none text-sm min-h-[60px]"
          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (body.trim()) addMutation.mutate(); } }}
          data-testid="input-comment-body"
        />
        <div className="flex items-center gap-2">
          {isStaff && (
            <button
              onClick={() => setIsInternal(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${isInternal ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-black/[0.03] dark:bg-white/[0.03] text-black/40 dark:text-white/40"}`}
              data-testid="button-toggle-internal"
            >
              <Lock className="w-3 h-3" />
              {isInternal ? "داخلي" : "عام"}
            </button>
          )}
          <span className="text-[10px] text-black/25 dark:text-white/25 mr-auto">Ctrl+Enter للإرسال</span>
          <Button
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={!body.trim() || addMutation.isPending}
            data-testid="button-send-comment"
          >
            {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
