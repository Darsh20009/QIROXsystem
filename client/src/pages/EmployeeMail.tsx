import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Mail, Send, Inbox, Trash2, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Search, X, Pencil, Paperclip,
  Reply, AlertCircle, MailOpen, SendHorizonal, FileText,
  ShieldAlert, Copy, Check, MonitorSmartphone, Smartphone,
  ExternalLink, Settings, Maximize2, Minimize2, Tag, Archive,
  ChevronDown,
} from "lucide-react";
const qiroxLogo = "/qirox-icon-nobg.png";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface MailAccount { id: string; emailAddress: string; displayName: string; jobTitle: string; isShared: boolean; sharedWith: string[]; }
interface EmailMessage { uid: number; subject: string; from: string; to: string; date: string | null; seen: boolean; html: string; text: string; snippet: string; folder: string; }
interface AttachmentFile { name: string; type: string; size: number; data: string; preview?: string; }

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const COLORS = ["bg-violet-600","bg-blue-600","bg-emerald-600","bg-rose-600","bg-amber-500","bg-cyan-600","bg-indigo-600","bg-pink-600"];
function acctColor(e: string) { let h=0; for(let i=0;i<e.length;i++) h=(h*31+e.charCodeAt(i))&0xffffffff; return COLORS[Math.abs(h)%COLORS.length]; }
function initials(n: string) { const p=n.trim().split(/\s+/); return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():n.slice(0,2).toUpperCase(); }
function fmtDate(d: string|null, ar=true) {
  if(!d) return "";
  const dt=new Date(d), now=new Date(), hrs=(now.getTime()-dt.getTime())/3600000;
  if(hrs<24) return dt.toLocaleTimeString(ar?"ar-SA":"en-US",{hour:"2-digit",minute:"2-digit"});
  if(hrs<168) return dt.toLocaleDateString(ar?"ar-SA":"en-US",{weekday:"short"});
  return dt.toLocaleDateString(ar?"ar-SA":"en-US",{day:"numeric",month:"short"});
}
function fmtBytes(b: number) { if(b<1024) return b+" B"; if(b<1048576) return(b/1024).toFixed(1)+" KB"; return(b/1048576).toFixed(1)+" MB"; }
function toBase64(f: File): Promise<string> { return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res((r.result as string).split(",")[1]); r.onerror=rej; r.readAsDataURL(f); }); }

const FOLDER_ICONS: Record<string,any> = { INBOX:Inbox, Sent:SendHorizonal, "INBOX.Sent":SendHorizonal, Drafts:FileText, "INBOX.Drafts":FileText, Trash:Trash2, "INBOX.Trash":Trash2, Junk:ShieldAlert, "INBOX.Junk":ShieldAlert, Spam:ShieldAlert, "INBOX.spam":ShieldAlert, Archive:Archive, "INBOX.Archive":Archive };
function folderLabel(f: string, ar: boolean) {
  const map: Record<string,[string,string]> = {
    INBOX:["الوارد","Inbox"], Sent:["المُرسَل","Sent"], "INBOX.Sent":["المُرسَل","Sent"],
    Drafts:["المسودات","Drafts"], "INBOX.Drafts":["المسودات","Drafts"],
    Trash:["المحذوفات","Trash"], "INBOX.Trash":["المحذوفات","Trash"],
    Junk:["السبام","Junk"], "INBOX.Junk":["السبام","Junk"],
    Spam:["السبام","Spam"], "INBOX.spam":["السبام","Spam"],
    Archive:["الأرشيف","Archive"], "INBOX.Archive":["الأرشيف","Archive"],
  };
  return map[f]?.[ar?0:1] ?? f.replace("INBOX.","");
}

/* ─── CopyBtn ────────────────────────────────────────────────────────────── */
function CopyBtn({ value }: { value: string }) {
  const [ok,setOk]=useState(false);
  return (
    <button onClick={()=>{navigator.clipboard.writeText(value).then(()=>{setOk(true);setTimeout(()=>setOk(false),2000)});}} className="p-1 rounded hover:bg-white/10 transition shrink-0">
      {ok?<Check className="w-3 h-3 text-emerald-400"/>:<Copy className="w-3 h-3 text-white/30"/>}
    </button>
  );
}

/* ─── Outlook Setup Modal ────────────────────────────────────────────────── */
function OutlookSetupModal({ account, onClose, L }: { account: MailAccount; onClose: ()=>void; L: boolean }) {
  const [tab,setTab]=useState<"desktop"|"mobile">("desktop");
  const s={ email:account.emailAddress, iHost:"server222.web-hosting.com", iPort:"993", iSec:"SSL / TLS", sHost:"server222.web-hosting.com", sPort:"465", sSec:"SSL / TLS" };
  function Row({label,value}:{label:string;value:string}) {
    return <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-0">
      <span className="text-[11px] text-white/40 w-24 shrink-0">{label}</span>
      <span className="flex-1 text-[12px] font-mono text-white" dir="ltr">{value}</span>
      <CopyBtn value={value}/>
    </div>;
  }
  function Step({n,text}:{n:number;text:string}) {
    return <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0 mt-0.5">{n}</div><p className="text-[12px] text-white/65 leading-relaxed">{text}</p></div>;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={L?"rtl":"ltr"}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}/>
      <div className="relative w-full max-w-md bg-[#0f1117] rounded-2xl border border-white/[0.08] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#0078D4]/15 border border-[#0078D4]/25 flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="w-4 h-4"><rect x="0" y="4" width="12" height="10" rx="1.5" fill="#0078D4"/><rect x="7" y="2" width="12" height="10" rx="1.5" fill="#1A86D9" opacity="0.9"/><text x="2" y="11.5" fontSize="6" fontWeight="bold" fill="white">O</text></svg>
          </div>
          <div className="flex-1"><h3 className="text-sm font-bold text-white">{L?"إعداد Outlook":"Outlook Setup"}</h3><p className="text-[10px] text-white/30 font-mono" dir="ltr">{account.emailAddress}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition"><X className="w-4 h-4 text-white/40"/></button>
        </div>
        <div className="flex gap-1.5 px-4 pt-3 shrink-0">
          {(["desktop","mobile"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab===t?"bg-blue-600 text-white":"text-white/40 hover:text-white/70 hover:bg-white/[0.05]"}`}>
              {t==="desktop"?<MonitorSmartphone className="w-3.5 h-3.5"/>:<Smartphone className="w-3.5 h-3.5"/>}
              {t==="desktop"?(L?"كمبيوتر":"Desktop"):(L?"موبايل":"Mobile")}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-2 bg-white/[0.03] border-b border-white/[0.05]"><p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{L?"الوارد — IMAP":"Incoming — IMAP"}</p></div>
            <div className="px-4"><Row label={L?"الخادم":"Server"} value={s.iHost}/><Row label={L?"المنفذ":"Port"} value={s.iPort}/><Row label={L?"الأمان":"Security"} value={s.iSec}/><Row label={L?"المستخدم":"Username"} value={s.email}/></div>
          </div>
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-2 bg-white/[0.03] border-b border-white/[0.05]"><p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{L?"الصادر — SMTP":"Outgoing — SMTP"}</p></div>
            <div className="px-4"><Row label={L?"الخادم":"Server"} value={s.sHost}/><Row label={L?"المنفذ":"Port"} value={s.sPort}/><Row label={L?"الأمان":"Security"} value={s.sSec}/><Row label={L?"المستخدم":"Username"} value={s.email}/></div>
          </div>
          <div className="rounded-xl bg-amber-950/20 border border-amber-800/25 px-4 py-3 flex gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>
            <p className="text-[11px] text-amber-300/70">{L?"كلمة المرور: استخدم كلمة مرور البريد من cPanel. تأكد تفعيل المصادقة للوارد والصادر.":"Password: Use your cPanel email password. Enable authentication for both."}</p>
          </div>
          <div className="space-y-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">{tab==="desktop"?(L?"خطوات Outlook كمبيوتر":"Outlook Desktop Steps"):(L?"خطوات Outlook موبايل":"Outlook Mobile Steps")}</p>
            {tab==="desktop"?<>
              <Step n={1} text={L?'افتح Outlook ← ملف ← إضافة حساب':'Open Outlook → File → Add Account'}/>
              <Step n={2} text={L?`أدخل ${s.email} ← خيارات متقدمة ← إعداد يدوي`:`Enter ${s.email} → Advanced → Set up manually`}/>
              <Step n={3} text={L?'اختر IMAP':'Choose IMAP'}/>
              <Step n={4} text={L?`الوارد: ${s.iHost}، منفذ ${s.iPort}، SSL/TLS`:`Incoming: ${s.iHost}, port ${s.iPort}, SSL/TLS`}/>
              <Step n={5} text={L?`الصادر: ${s.sHost}، منفذ ${s.sPort}، SSL/TLS`:`Outgoing: ${s.sHost}, port ${s.sPort}, SSL/TLS`}/>
              <Step n={6} text={L?'أدخل كلمة المرور ← تسجيل الدخول ← تم':'Enter password → Sign in → Done'}/>
            </>:<>
              <Step n={1} text={L?'افتح Outlook الموبايل ← أيقونة صورتك ← + إضافة حساب':'Open Outlook mobile → profile icon → + Add account'}/>
              <Step n={2} text={L?'إضافة حساب بريد إلكتروني':'Add Email Account'}/>
              <Step n={3} text={L?`أدخل ${s.email} ← متابعة`:`Enter ${s.email} → Continue`}/>
              <Step n={4} text={L?'إعداد يدوي ← IMAP':'Set up manually → IMAP'}/>
              <Step n={5} text={L?'أدخل بيانات الخادم كما هو موضح أعلاه':'Enter server settings as shown above'}/>
              <Step n={6} text={L?'أدخل كلمة المرور ← تسجيل الدخول':'Enter password → Sign in'}/>
            </>}
          </div>
          <a href={tab==="desktop"?"https://www.microsoft.com/microsoft-365/outlook":"https://apps.apple.com/app/microsoft-outlook/id951937596"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] hover:bg-white/[0.04] transition text-[11px] text-white/35 hover:text-white/55">
            <ExternalLink className="w-3.5 h-3.5"/>{tab==="desktop"?(L?"تحميل Outlook لـ Windows / Mac":"Download Outlook for Desktop"):(L?"تحميل Outlook للموبايل":"Download Outlook Mobile")}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function EmployeeMail() {
  const { L } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const dir = L ? "rtl" : "ltr";

  const [selectedAccountId, setSelectedAccountId] = useState<string|null>(null);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage|null>(null);
  const [search, setSearch] = useState("");
  const [outlookAccount, setOutlookAccount] = useState<MailAccount|null>(null);

  /* Floating compose state */
  const [composing, setComposing] = useState(false);
  const [composeMin, setComposeMin] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Queries */
  const { data: accounts=[], isLoading: acctLoading } = useQuery<MailAccount[]>({ queryKey:["/api/mail/accounts"] });
  const { data: folders=["INBOX","Sent","Drafts","Trash"] } = useQuery<string[]>({
    queryKey:["/api/mail/folders", selectedAccountId],
    queryFn: async()=>{ if(!selectedAccountId) return ["INBOX","Sent","Drafts","Trash"]; const r=await fetch(`/api/mail/folders/${selectedAccountId}`,{credentials:"include"}); return r.ok?r.json():["INBOX","Sent","Drafts","Trash"]; },
    enabled:!!selectedAccountId,
  });
  const { data:messages=[], isLoading:msgLoading, isError:msgError, refetch:refetchMsgs } = useQuery<EmailMessage[]>({
    queryKey:["/api/mail/inbox", selectedAccountId, selectedFolder],
    queryFn: async()=>{ if(!selectedAccountId) return []; const r=await fetch(`/api/mail/inbox/${selectedAccountId}?folder=${encodeURIComponent(selectedFolder)}`,{credentials:"include"}); if(!r.ok) throw new Error(`${r.status}`); return r.json(); },
    enabled:!!selectedAccountId, staleTime:60_000, retry:1,
  });

  useEffect(()=>{ if(accounts.length>0&&!selectedAccountId) setSelectedAccountId((accounts[0] as MailAccount).id); },[accounts]);

  const selectedAccount = accounts.find((a:MailAccount)=>a.id===selectedAccountId);
  const unread = messages.filter((m:EmailMessage)=>!m.seen).length;

  const markSeen = useMutation({
    mutationFn: async({uid,folder}:{uid:number;folder:string})=>{ const r=await fetch(`/api/mail/seen/${selectedAccountId}`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({uid,folder})}); if(!r.ok) throw new Error("fail"); return r.json(); },
    onSuccess:()=>qc.invalidateQueries({queryKey:["/api/mail/inbox",selectedAccountId,selectedFolder]}),
  });
  const deleteMail = useMutation({
    mutationFn: async(uid:number)=>{ const r=await fetch(`/api/mail/message/${selectedAccountId}/${uid}?folder=${encodeURIComponent(selectedFolder)}`,{method:"DELETE",credentials:"include"}); if(!r.ok) throw new Error("fail"); return r.json(); },
    onSuccess:()=>{ setSelectedEmail(null); qc.invalidateQueries({queryKey:["/api/mail/inbox",selectedAccountId,selectedFolder]}); toast({title:L?"تم الحذف":"Deleted"}); },
  });

  function openEmail(msg: EmailMessage) {
    setSelectedEmail(msg); if(!msg.seen) markSeen.mutate({uid:msg.uid,folder:selectedFolder});
  }

  function openCompose(to="",subject="",body="") {
    setComposeTo(to); setComposeSubject(subject); setComposeBody(body);
    setComposeCc(""); setShowCc(false); setAttachments([]); setComposing(true); setComposeMin(false);
  }

  function startReply(msg: EmailMessage) {
    const from = msg.from.match(/<(.+)>/)?.[1] || msg.from;
    const quote = `\n\n── ${L?"الرسالة الأصلية":"Original Message"} ──\n${L?"من:":"From:"} ${msg.from}\n\n${msg.text||""}`;
    openCompose(from, `Re: ${msg.subject}`, quote);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    for(const file of Array.from(e.target.files||[])) {
      if(file.size>20*1024*1024){ toast({title:L?"الملف أكبر من 20MB":"File exceeds 20MB",variant:"destructive"}); continue; }
      const data=await toBase64(file);
      const preview=file.type.startsWith("image/")?`data:${file.type};base64,${data}`:undefined;
      setAttachments(prev=>[...prev,{name:file.name,type:file.type,size:file.size,data,preview}]);
    }
    if(fileRef.current) fileRef.current.value="";
  }

  async function handleSend() {
    if(!selectedAccountId||!composeTo||!composeSubject||!composeBody){ toast({title:L?"يرجى ملء جميع الحقول":"Fill all required fields",variant:"destructive"}); return; }
    setSending(true);
    try {
      const r=await fetch("/api/mail/send",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({accountId:selectedAccountId,to:composeTo,cc:composeCc||undefined,subject:composeSubject,body:composeBody,attachments:attachments.map(a=>({filename:a.name,content:a.data,contentType:a.type,encoding:"base64"}))})});
      if(!r.ok){ const e=await r.json().catch(()=>({})); throw new Error(e.error||`HTTP ${r.status}`); }
      toast({title:L?"تم الإرسال ✓":"Sent ✓"});
      setComposing(false); setComposeTo(""); setComposeSubject(""); setComposeBody(""); setAttachments([]);
      qc.invalidateQueries({queryKey:["/api/mail/inbox",selectedAccountId,"Sent"]});
    } catch(e:any){ toast({title:L?"فشل الإرسال":"Send failed",description:e.message,variant:"destructive"}); }
    finally{ setSending(false); }
  }

  const filtered = messages.filter((m:EmailMessage)=>!search||(m.subject||"").toLowerCase().includes(search.toLowerCase())||(m.from||"").toLowerCase().includes(search.toLowerCase())||(m.snippet||"").toLowerCase().includes(search.toLowerCase()));
  const ChevronBack = L ? ChevronRight : ChevronLeft;

  return (
    <div className="flex h-full bg-white dark:bg-gray-950 overflow-hidden" dir={dir}>

      {/* Outlook Modal */}
      {outlookAccount && <OutlookSetupModal account={outlookAccount} onClose={()=>setOutlookAccount(null)} L={L}/>}

      {/* ── Floating Compose ───────────────────────────────────────────────── */}
      {composing && (
        <div className={`fixed z-40 shadow-2xl shadow-black/30 rounded-t-2xl border border-black/[0.1] dark:border-white/[0.1] overflow-hidden transition-all ${L?"left-4":"right-4"} bottom-0 ${composeMin?"w-72 h-12":"w-[520px] h-[480px]"} flex flex-col bg-white dark:bg-[#1a1a2e]`} dir={dir}>
          {/* Compose header */}
          <div className="flex items-center gap-2 px-4 h-12 bg-[#1a1a2e] dark:bg-[#0d0d1a] shrink-0 cursor-pointer" onClick={()=>setComposeMin(m=>!m)}>
            <span className="flex-1 text-[13px] font-semibold text-white truncate">{composeSubject||( L?"رسالة جديدة":"New Message")}</span>
            <button onClick={e=>{e.stopPropagation();setComposeMin(m=>!m)}} className="p-1 rounded hover:bg-white/10 transition text-white/60 hover:text-white">
              {composeMin?<Maximize2 className="w-3.5 h-3.5"/>:<Minimize2 className="w-3.5 h-3.5"/>}
            </button>
            <button onClick={e=>{e.stopPropagation();setComposing(false)}} className="p-1 rounded hover:bg-white/10 transition text-white/60 hover:text-white">
              <X className="w-3.5 h-3.5"/>
            </button>
          </div>

          {!composeMin && <>
            {/* Fields */}
            <div className="border-b border-black/[0.07] dark:border-white/[0.07]">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-black/[0.05] dark:border-white/[0.05]">
                <span className="text-xs text-black/40 dark:text-white/40 w-14 shrink-0">{L?"إلى":"To"}</span>
                <input value={composeTo} onChange={e=>setComposeTo(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" dir="ltr" placeholder="recipient@email.com" data-testid="input-compose-to"/>
                <button onClick={()=>setShowCc(c=>!c)} className="text-[10px] text-black/30 dark:text-white/30 hover:text-black/60 font-medium px-1">{showCc?(L?"إخفاء CC":"Hide CC"):"CC"}</button>
              </div>
              {showCc&&<div className="flex items-center gap-2 px-4 py-2 border-b border-black/[0.05] dark:border-white/[0.05]">
                <span className="text-xs text-black/40 dark:text-white/40 w-14 shrink-0">CC</span>
                <input value={composeCc} onChange={e=>setComposeCc(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" dir="ltr" placeholder="cc@email.com" data-testid="input-compose-cc"/>
              </div>}
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-xs text-black/40 dark:text-white/40 w-14 shrink-0">{L?"الموضوع":"Subject"}</span>
                <input value={composeSubject} onChange={e=>setComposeSubject(e.target.value)} className="flex-1 bg-transparent text-sm font-medium outline-none" placeholder={L?"موضوع الرسالة...":"Email subject..."} data-testid="input-compose-subject"/>
              </div>
            </div>

            {/* Body */}
            <textarea value={composeBody} onChange={e=>setComposeBody(e.target.value)} className="flex-1 resize-none px-4 py-3 text-sm bg-transparent outline-none placeholder:text-black/25 dark:placeholder:text-white/25 leading-relaxed" placeholder={L?"اكتب رسالتك هنا...":"Write your message here..."} data-testid="textarea-compose-body"/>

            {/* Attachments */}
            {attachments.length>0&&<div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {attachments.map((a,i)=>(
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 group text-xs text-blue-700 dark:text-blue-300">
                  {a.preview?<img src={a.preview} className="w-4 h-4 rounded object-cover" alt=""/>:<Paperclip className="w-3 h-3"/>}
                  <span className="truncate max-w-[100px]">{a.name}</span>
                  <span className="text-[10px] text-blue-400">({fmtBytes(a.size)})</span>
                  <button onClick={()=>setAttachments(prev=>prev.filter((_,j)=>j!==i))} className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-red-500 transition"><X className="w-3 h-3"/></button>
                </div>
              ))}
            </div>}

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 pb-3 border-t border-black/[0.06] dark:border-white/[0.06] pt-2.5">
              <input type="file" ref={fileRef} multiple accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" className="hidden" onChange={handleFileSelect}/>
              <button onClick={()=>handleSend()} disabled={sending||!composeTo||!composeSubject||!composeBody} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a2e] hover:bg-[#252540] disabled:opacity-40 text-white text-[12px] font-bold transition" data-testid="button-send-email">
                {sending?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Send className="w-3.5 h-3.5"/>}
                {sending?(L?"جارٍ الإرسال...":"Sending..."):(L?"إرسال":"Send")}
              </button>
              <button onClick={()=>fileRef.current?.click()} className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition" title={L?"إرفاق ملف":"Attach file"} data-testid="button-attach-file">
                <Paperclip className="w-4 h-4"/>
              </button>
              <div className="flex-1"/>
              <div className="text-[10px] text-black/30 dark:text-white/30 font-mono truncate">{selectedAccount?.emailAddress}</div>
            </div>
          </>}
        </div>
      )}

      {/* ── Left Rail: Accounts ─────────────────────────────────────────────── */}
      <div className={`w-14 flex flex-col items-center py-3 gap-1.5 bg-[#0f1117] shrink-0 ${L?"border-l":"border-r"} border-white/[0.06]`}>
        <img src={qiroxLogo} alt="Q" className="w-6 h-6 object-contain brightness-0 invert mb-2 shrink-0"/>
        {/* Compose */}
        <button onClick={()=>openCompose()} title={L?"رسالة جديدة":"Compose"} className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center mb-1 transition shadow-lg shadow-blue-900/30" data-testid="button-compose">
          <Pencil className="w-4 h-4 text-white"/>
        </button>
        {/* Account bubbles */}
        {acctLoading?<Loader2 className="w-4 h-4 animate-spin text-white/20 mt-2"/>:(accounts as MailAccount[]).map(a=>(
          <div key={a.id} className="relative group">
            <button
              onClick={()=>{setSelectedAccountId(a.id);setSelectedEmail(null);setSelectedFolder("INBOX");}}
              title={a.displayName||a.emailAddress}
              className={`w-9 h-9 rounded-xl ${acctColor(a.emailAddress)} flex items-center justify-center text-[11px] font-black text-white transition ${selectedAccountId===a.id?"ring-2 ring-white ring-offset-1 ring-offset-[#0f1117]":"opacity-60 hover:opacity-90"}`}
              data-testid={`button-account-${a.id}`}
            >{initials(a.displayName||a.emailAddress.split("@")[0])}</button>
            {/* Outlook setup */}
            <button onClick={()=>setOutlookAccount(a)} title={L?"إعداد Outlook":"Outlook Setup"} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0f1117] border border-white/[0.15] items-center justify-center hidden group-hover:flex transition" data-testid={`button-outlook-${a.id}`}>
              <Settings className="w-2.5 h-2.5 text-white/50"/>
            </button>
          </div>
        ))}
      </div>

      {/* ── Folder Rail ────────────────────────────────────────────────────── */}
      <div className={`w-44 flex flex-col bg-[#f8f9fc] dark:bg-[#13131f] shrink-0 ${L?"border-l":"border-r"} border-black/[0.06] dark:border-white/[0.05]`}>
        <div className="px-3 pt-4 pb-2">
          {selectedAccount?<>
            <p className="text-[11px] font-black text-black/70 dark:text-white/70 truncate">{selectedAccount.displayName||selectedAccount.emailAddress.split("@")[0]}</p>
            <p className="text-[9px] text-black/35 dark:text-white/35 truncate font-mono" dir="ltr">{selectedAccount.emailAddress}</p>
          </>:<p className="text-[11px] text-black/30 dark:text-white/30">{L?"اختر حساباً":"Select account"}</p>}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {folders.map((f:string)=>{
            const Icon=FOLDER_ICONS[f]??Tag;
            const isActive=selectedFolder===f;
            return (
              <button key={f} onClick={()=>{setSelectedFolder(f);setSelectedEmail(null);}} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-0.5 transition text-[12px] ${isActive?"bg-blue-600 text-white font-semibold":"text-black/55 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white"}`} data-testid={`button-folder-${f}`}>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive?"text-white":"opacity-50"}`}/>
                <span className="truncate flex-1 text-start">{folderLabel(f,L)}</span>
                {f==="INBOX"&&unread>0&&<span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive?"bg-white/20 text-white":"bg-blue-600 text-white"}`}>{unread}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Message List ───────────────────────────────────────────────────── */}
      <div className={`w-[280px] shrink-0 flex flex-col bg-white dark:bg-[#16161e] ${L?"border-l":"border-r"} border-black/[0.06] dark:border-white/[0.05]`}>
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-1 mb-2">
            <h2 className="flex-1 text-[13px] font-black text-black dark:text-white">{folderLabel(selectedFolder,L)}</h2>
            <button onClick={()=>refetchMsgs()} className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition" data-testid="button-refresh-mail">
              <RefreshCw className={`w-3.5 h-3.5 text-black/35 dark:text-white/35 ${msgLoading?"animate-spin":""}`}/>
            </button>
          </div>
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 ${L?"right-2.5":"left-2.5"} w-3 h-3 text-black/25 dark:text-white/25 pointer-events-none`}/>
            <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"بحث...":"Search..."} className={`${L?"pr-8":"pl-8"} h-7 text-xs rounded-lg bg-black/[0.04] dark:bg-white/[0.05] border-transparent text-black dark:text-white`} data-testid="input-mail-search"/>
            {search&&<button onClick={()=>setSearch("")} className={`absolute top-1/2 -translate-y-1/2 ${L?"left-2":"right-2"}`}><X className="w-3 h-3 text-black/30"/></button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {msgLoading&&<div className="flex flex-col items-center justify-center h-32 gap-2 text-black/20 dark:text-white/20"><Loader2 className="w-5 h-5 animate-spin"/><p className="text-xs">{L?"جاري التحميل...":"Loading..."}</p></div>}
          {!msgLoading&&msgError&&<div className="mx-3 mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 flex gap-2"><AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/><p className="text-[11px] text-red-500">{L?"تعذّر الاتصال بالخادم البريدي":"Cannot connect to mail server"}</p></div>}
          {!msgLoading&&!selectedAccountId&&<div className="flex flex-col items-center justify-center h-32 gap-2 text-black/20 dark:text-white/20"><Mail className="w-8 h-8"/><p className="text-xs">{L?"اختر حساباً":"Select account"}</p></div>}
          {!msgLoading&&selectedAccountId&&filtered.length===0&&<div className="flex flex-col items-center justify-center h-32 gap-2 text-black/15 dark:text-white/15"><MailOpen className="w-7 h-7"/><p className="text-xs">{L?"لا توجد رسائل":"No messages"}</p></div>}
          {(filtered as EmailMessage[]).map((msg)=>{
            const sname=(msg.from||"").split("<")[0].trim()||msg.from;
            const isActive=selectedEmail?.uid===msg.uid;
            return (
              <button key={msg.uid} onClick={()=>openEmail(msg)} className={`w-full text-start px-3 py-2.5 border-b border-black/[0.04] dark:border-white/[0.03] transition-all ${isActive?"bg-blue-50 dark:bg-blue-950/20":"hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`} data-testid={`email-item-${msg.uid}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-full ${acctColor(msg.from)} flex items-center justify-center text-[11px] font-black text-white shrink-0 mt-0.5`}>{initials(sname)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[12px] truncate ${!msg.seen?"font-black text-black dark:text-white":"font-medium text-black/55 dark:text-white/55"}`}>{sname}</span>
                      <span className="text-[10px] text-black/25 dark:text-white/25 shrink-0">{fmtDate(msg.date,L)}</span>
                    </div>
                    <p className={`text-[11px] truncate mb-0.5 ${!msg.seen?"font-semibold text-black dark:text-white":"text-black/50 dark:text-white/50"}`}>{msg.subject||(L?"(بدون موضوع)":"(No subject)")}</p>
                    <p className="text-[10px] truncate text-black/30 dark:text-white/30">{msg.snippet}</p>
                  </div>
                  {!msg.seen&&<div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Pane ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#f8f9fc] dark:bg-[#0d0d18]">
        {selectedEmail ? (
          <div className="flex flex-col h-full">
            {/* Viewer toolbar */}
            <div className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#16161e] border-b border-black/[0.06] dark:border-white/[0.05] shrink-0">
              <button onClick={()=>setSelectedEmail(null)} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition"><ChevronBack className="w-4 h-4 text-black/40 dark:text-white/40"/></button>
              <div className="flex-1"/>
              <button onClick={()=>startReply(selectedEmail)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black/60 dark:text-white/60 border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition" data-testid="button-reply-email">
                <Reply className="w-3.5 h-3.5"/>{L?"رد":"Reply"}
              </button>
              <button onClick={()=>deleteMail.mutate(selectedEmail.uid)} disabled={deleteMail.isPending} className="p-2 rounded-xl text-black/30 dark:text-white/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition" data-testid="button-delete-email">
                {deleteMail.isPending?<Loader2 className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-6 py-8">
                <h1 className="text-xl font-black text-black dark:text-white mb-5 leading-tight">{selectedEmail.subject||(L?"(بدون موضوع)":"(No subject)")}</h1>
                <div className="flex items-start gap-3 mb-6 p-4 rounded-2xl bg-white dark:bg-[#1a1a2e] border border-black/[0.06] dark:border-white/[0.06] shadow-sm">
                  <div className={`w-10 h-10 rounded-full ${acctColor(selectedEmail.from)} flex items-center justify-center text-[13px] font-black text-white shrink-0`}>{initials((selectedEmail.from||"").split("<")[0].trim()||selectedEmail.from)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black dark:text-white truncate">{(selectedEmail.from||"").split("<")[0].trim()||selectedEmail.from}</p>
                    <p className="text-[11px] text-black/35 dark:text-white/35 font-mono truncate" dir="ltr">{selectedEmail.from.match(/<(.+)>/)?.[1]||selectedEmail.from}</p>
                    <p className="text-[11px] text-black/30 dark:text-white/30 mt-0.5">{selectedEmail.date?new Date(selectedEmail.date).toLocaleString(L?"ar-SA":"en-US",{dateStyle:"medium",timeStyle:"short"}):""}</p>
                    {selectedEmail.to&&<p className="text-[11px] text-black/30 dark:text-white/30">{L?"إلى:":"To:"} {selectedEmail.to}</p>}
                  </div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-[#1a1a2e] border border-black/[0.06] dark:border-white/[0.06] shadow-sm overflow-hidden">
                  <div className="p-6">
                    {selectedEmail.html
                      ?<div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{__html:selectedEmail.html}} style={{direction:"ltr"}}/>
                      :<pre className="whitespace-pre-wrap text-sm text-black/70 dark:text-white/70 font-sans leading-relaxed">{selectedEmail.text||(L?"لا يوجد محتوى":"No content")}</pre>}
                  </div>
                </div>
                <button onClick={()=>startReply(selectedEmail)} className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-sm font-medium text-black/50 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition bg-white dark:bg-[#1a1a2e]">
                  <Reply className="w-4 h-4"/>{L?"الرد على هذه الرسالة":"Reply to this message"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 select-none">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex items-center justify-center">
              <Mail className="w-9 h-9 text-blue-400"/>
            </div>
            <div className="text-center">
              <p className="font-black text-[15px] text-black/20 dark:text-white/20 mb-1">{L?"اختر رسالة لعرضها":"Select a message to view"}</p>
              <p className="text-sm text-black/15 dark:text-white/15">{L?"أو اكتب رسالة جديدة":"Or compose a new one"}</p>
            </div>
            <button onClick={()=>openCompose()} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1a1a2e] hover:bg-[#252540] text-white text-sm font-bold shadow-lg transition">
              <Pencil className="w-4 h-4"/>{L?"رسالة جديدة":"Compose"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
