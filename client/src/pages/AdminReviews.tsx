// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, MessageSquare, Eye, EyeOff, Trash2, Search, Filter, TrendingUp } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} style={{ width: size, height: size }} className={s <= rating ? "fill-amber-400 text-amber-400" : "text-black/20"} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [replyDialog, setReplyDialog] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  const { data: reviews = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/reviews"] });

  const replyMutation = useMutation({
    mutationFn: ({ id, adminReply, isPublic }: any) => apiRequest("PATCH", `/api/admin/reviews/${id}/reply`, { adminReply, isPublic }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] }); setReplyDialog(null); toast({ title: L ? "تم الحفظ" : "Saved" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/reviews/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] }); toast({ title: L ? "تم الحذف" : "Deleted" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = reviews.filter(r => {
    const matchSearch = !search || r.client?.fullName?.includes(search) || r.comment?.includes(search) || r.serviceTitle?.includes(search);
    const matchRating = filterRating === "all" || String(r.rating) === filterRating;
    return matchSearch && matchRating;
  });

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const ratingDist = [5, 4, 3, 2, 1].map(s => ({ stars: L ? `${s} نجوم` : `${s} stars`, count: reviews.filter(r => r.rating === s).length }));

  return (
    <div className="p-6 space-y-6 font-sans" dir={dir}>
      <PageGraphics />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">{L ? "التقييمات والمراجعات" : "Reviews & Ratings"}</h1>
          <p className="text-black/50 text-sm">{L ? "إدارة تقييمات العملاء والردود عليها" : "Manage customer reviews and replies"}</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="text-center bg-amber-50 border border-amber-200 rounded-xl px-5 py-2">
            <div className="text-2xl font-bold text-amber-600">{avgRating}</div>
            <StarRating rating={Math.round(Number(avgRating))} />
            <div className="text-xs text-black/40 mt-1">{reviews.length} {L ? "تقييم" : "reviews"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-black/10"><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{reviews.length}</div><div className="text-xs text-black/50">{L ? "إجمالي التقييمات" : "Total Reviews"}</div></CardContent></Card>
        <Card className="border-black/10"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{reviews.filter(r => r.isPublic).length}</div><div className="text-xs text-black/50">{L ? "ظاهرة للعموم" : "Public"}</div></CardContent></Card>
        <Card className="border-black/10"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{reviews.filter(r => r.adminReply).length}</div><div className="text-xs text-black/50">{L ? "تم الرد عليها" : "Replied"}</div></CardContent></Card>
      </div>

      {reviews.length > 0 && (
        <Card className="border-black/10">
          <CardHeader><CardTitle className="text-sm">{L ? "توزيع التقييمات" : "Rating Distribution"}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={ratingDist} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stars" width={60} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {ratingDist.map((_, i) => <Cell key={i} fill={["#10b981","#3b82f6","#f59e0b","#f97316","#ef4444"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={L ? "بحث في التقييمات..." : "Search reviews..."} className="pr-9 border-black/20" data-testid="input-search-reviews" />
        </div>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-36 border-black/20" data-testid="select-filter-rating"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L ? "كل التقييمات" : "All Ratings"}</SelectItem>
            {[5,4,3,2,1].map(s => <SelectItem key={s} value={String(s)}>{s} {L ? "نجوم" : "stars"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-black/30">{L ? "جاري التحميل..." : "Loading..."}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-black/30"><Star className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>{L ? "لا توجد تقييمات" : "No reviews found"}</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => (
            <Card key={review.id} className="border-black/10 hover:border-black/20 transition-all" data-testid={`card-review-${review.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-sm font-bold">
                        {review.client?.fullName?.[0] || "؟"}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{review.client?.fullName || "عميل"}</div>
                        <div className="text-xs text-black/40">{review.client?.email}</div>
                      </div>
                      <StarRating rating={review.rating} />
                      <Badge variant="outline" className={review.isPublic ? "border-green-300 text-green-700" : "border-black/20 text-black/40"}>
                        {review.isPublic ? (L ? "ظاهر" : "Public") : (L ? "مخفي" : "Hidden")}
                      </Badge>
                    </div>
                    {review.serviceTitle && <div className="text-xs text-black/40 bg-black/5 px-2 py-0.5 rounded w-fit">{review.serviceTitle}</div>}
                    {review.comment && <p className="text-sm text-black/70 bg-black/5 rounded-lg p-3">{review.comment}</p>}
                    {review.adminReply && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="text-xs text-blue-500 mb-1 font-semibold">{L ? "رد الإدارة:" : "Admin Reply:"}</div>
                        <p className="text-sm text-blue-800">{review.adminReply}</p>
                      </div>
                    )}
                    <div className="text-xs text-black/30">{new Date(review.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" className="border-black/20" onClick={() => { setReplyDialog(review); setReplyText(review.adminReply || ""); }} data-testid={`button-reply-review-${review.id}`}>
                      <MessageSquare className="w-3.5 h-3.5 ml-1" /> {L ? "رد" : "Reply"}
                    </Button>
                    <Button size="sm" variant="outline" className="border-black/20" onClick={() => replyMutation.mutate({ id: review.id, adminReply: review.adminReply, isPublic: !review.isPublic })} data-testid={`button-toggle-visibility-${review.id}`}>
                      {review.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-500 hover:bg-red-50" onClick={() => { if (confirm(L ? "حذف هذا التقييم؟" : "Delete this review?")) deleteMutation.mutate(review.id); }} data-testid={`button-delete-review-${review.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent className="sm:max-w-md font-sans" dir={dir}>
          <DialogHeader><DialogTitle>{L ? "الرد على التقييم" : "Reply to Review"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {replyDialog && <StarRating rating={replyDialog.rating} size={20} />}
            {replyDialog?.comment && <p className="text-sm text-black/60 bg-black/5 p-3 rounded-lg">{replyDialog.comment}</p>}
            <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={L ? "اكتب ردك هنا..." : "Write your reply..."} className="border-black/20 min-h-24" data-testid="textarea-admin-reply" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReplyDialog(null)}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => replyMutation.mutate({ id: replyDialog.id, adminReply: replyText, isPublic: replyDialog.isPublic })} disabled={replyMutation.isPending} className="bg-black text-white hover:bg-black/80" data-testid="button-save-reply">
                {replyMutation.isPending ? (L ? "جاري الحفظ..." : "Saving...") : (L ? "حفظ الرد" : "Save Reply")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
