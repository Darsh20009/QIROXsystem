import type { ReactNode } from "react";
import SARIcon from "@/components/SARIcon";
import "./CurrentPrint.css";

export type FinanceDocumentItem = {
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export type FinanceBankDetails = {
  bankName?: string;
  beneficiaryName?: string;
  iban?: string;
  accountNumber?: string;
};

type FinanceDate = {
  labelAr: string;
  labelEn: string;
  value?: string | Date | null;
};

type FinanceRecipient = {
  label: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  note?: string;
};

type FinanceStatus = {
  label: string;
  color: string;
  background: string;
};

type FinanceDocumentFrameProps = {
  titleAr: string;
  titleEn: string;
  documentNumber: string;
  createdAt?: string | Date | null;
  dates?: FinanceDate[];
  status?: FinanceStatus;
  recipient: FinanceRecipient;
  direction: "rtl" | "ltr";
  footerLink?: { href: string; label: string };
  footerNote?: string;
  children: ReactNode;
};

const formatDate = (value?: string | Date | null, locale = "en-SA") => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Riyadh",
  }).formatToParts(date);
  const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${valueByType.year}/${valueByType.month}/${valueByType.day}`;
};

export const formatFinanceAmount = (value: unknown, decimals = 0) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-SA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  });
};

export function FinanceMoney({
  amount,
  decimals = 0,
  iconSize = 13,
  className = "",
}: {
  amount: unknown;
  decimals?: number;
  iconSize?: number;
  className?: string;
}) {
  return (
    <span className={`fd-money ${className}`} dir="ltr">
      <span>{formatFinanceAmount(amount, decimals)}</span>
      <SARIcon size={iconSize} className="fd-currency-icon" />
    </span>
  );
}

export function FinanceDocumentFrame({
  titleAr,
  titleEn,
  documentNumber,
  createdAt,
  dates = [],
  status,
  recipient,
  direction,
  footerLink,
  footerNote,
  children,
}: FinanceDocumentFrameProps) {
  const allDates = [
    { labelAr: "تاريخ الإصدار", labelEn: "Issue date", value: createdAt },
    ...dates,
  ].filter((date) => date.value);

  return (
    <div className="fd-screen no-print-bg">
      <article className="finance-paper print-card" dir={direction} data-print-document>
        <header className="fd-header">
          <div className="fd-brand">
            <img src="/__mockup/images/qirox-logo-nobg.png" alt="QIROX Studio" className="fd-logo" />
            <span className="fd-brand-divider" aria-hidden="true" />
            <p className="fd-tagline" dir="ltr">
              Build Systems.
              <br />
              Ship Products.
              <br />
              Stay Human.
            </p>
          </div>
          <div className="fd-document-kind">
            <span className="fd-document-kind-ar">{titleAr}</span>
            <span className="fd-document-kind-en" dir="ltr">{titleEn}</span>
          </div>
        </header>

        <div className="fd-watermark" aria-hidden="true">
          <img src="/__mockup/images/qirox-icon-nobg.png" alt="" />
        </div>

        <section className="fd-meta-grid">
          <div className="fd-document-meta">
            <div className="fd-number-line" dir="ltr">
              <span className="fd-number">#{documentNumber || "—"}</span>
              {status && (
                <span
                  className="fd-status"
                  style={{ background: status.background, color: status.color }}
                >
                  {status.label}
                </span>
              )}
            </div>
            <div className="fd-date-list">
              {allDates.map((date, index) => (
                <div className="fd-date-row" key={`${date.labelEn}-${index}`}>
                  <span className="fd-date-icon" aria-hidden="true">▦</span>
                  <span className="fd-date-value" dir="ltr">{formatDate(date.value)}</span>
                  <span className="fd-date-label">
                    {direction === "rtl" ? date.labelAr : date.labelEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="fd-recipient" style={{ direction, textAlign: direction === "rtl" ? "right" : "left" }}>
            <div className="fd-recipient-copy">
              <span className="fd-eyebrow">{recipient.label}</span>
              <strong className="fd-recipient-name">{recipient.name || "—"}</strong>
              {recipient.company && <span className="fd-recipient-detail">{recipient.company}</span>}
              {recipient.email && <span className="fd-recipient-detail" dir="ltr">{recipient.email}</span>}
              {recipient.phone && <span className="fd-recipient-detail" dir="ltr">{recipient.phone}</span>}
              {recipient.country && <span className="fd-recipient-detail">{recipient.country}</span>}
              {recipient.note && <span className="fd-recipient-note">{recipient.note}</span>}
            </div>
            <span className="fd-recipient-icon" aria-hidden="true">▤</span>
          </div>
        </section>

        <main className="fd-content">{children}</main>

        <footer className="fd-footer">
          <div className="fd-footer-brand">
            <strong>QIROX Studio</strong>
            <span>Build Systems. Ship Products. Stay Human.</span>
            <span>المملكة العربية السعودية</span>
            {footerLink && <a href={footerLink.href} target="_blank" rel="noreferrer">{footerLink.label}</a>}
          </div>
          <div className="fd-footer-contact" dir="ltr">
            <span>✉ info@qiroxstudio.online</span>
            <span>◎ qiroxstudio.online</span>
          </div>
          <div className="fd-footer-copyright">
            <span>© {new Date().getFullYear()} QIROX Studio</span>
            <span>جميع الحقوق محفوظة</span>
          </div>
          {footerNote && <p className="fd-footer-note">{footerNote}</p>}
        </footer>
      </article>
    </div>
  );
}

export function FinanceProjectPanel({
  title,
  description,
  label = "المشروع",
}: {
  title?: string;
  description?: string;
  label?: string;
}) {
  if (!title && !description) return null;
  return (
    <section className="fd-project-panel print-avoid-break">
      <div className="fd-project-heading">
        <span className="fd-project-icon" aria-hidden="true">◇</span>
        <span>{label}</span>
      </div>
      {title && <strong className="fd-project-title">{title}</strong>}
      {description && <p className="fd-project-description">{description}</p>}
    </section>
  );
}

export function FinanceItemsTable({
  items,
  direction = "rtl",
  labels,
}: {
  items: FinanceDocumentItem[];
  direction?: "rtl" | "ltr";
  labels: { item: string; quantity: string; unitPrice: string; total: string };
}) {
  if (!items.length) return null;
  return (
    <div className="fd-table-wrap">
      <table className="fd-items-table" dir={direction}>
        <colgroup>
          <col className="fd-col-index" />
          <col />
          <col className="fd-col-qty" />
          <col className="fd-col-money" />
          <col className="fd-col-money" />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th className="fd-cell-description">{labels.item}</th>
            <th>{labels.quantity}</th>
            <th>{labels.unitPrice}</th>
            <th>{labels.total}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.name}-${index}`}>
              <td className="fd-cell-index">{index + 1}</td>
              <td className="fd-cell-description">
                <strong>{item.name || "—"}</strong>
                {item.description && <span>{item.description}</span>}
              </td>
              <td className="fd-cell-centered">{item.qty}</td>
              <td className="fd-cell-centered"><FinanceMoney amount={item.unitPrice} iconSize={11} /></td>
              <td className="fd-cell-centered fd-cell-strong"><FinanceMoney amount={item.total} iconSize={11} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FinanceTotals({
  subtotal,
  discountAmount = 0,
  discountPercent = 0,
  vatRate = 0,
  vatAmount = 0,
  totalAmount,
  direction = "rtl",
  labels,
}: {
  subtotal: number;
  discountAmount?: number;
  discountPercent?: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount: number;
  direction?: "rtl" | "ltr";
  labels: { subtotal: string; discount: string; vat: string; total: string; currency: string };
}) {
  return (
    <section className="fd-totals-layout print-avoid-break" dir="ltr">
      <div className="fd-total-hero" dir={direction}>
        <span className="fd-total-caption">{labels.total}</span>
        <strong className="fd-total-value" dir="ltr">{formatFinanceAmount(totalAmount, 2)}</strong>
        <span className="fd-total-currency">{labels.currency}</span>
      </div>
      <div className="fd-totals-summary" dir={direction}>
        <div className="fd-total-row">
          <span>{labels.subtotal}</span>
          <FinanceMoney amount={subtotal} decimals={2} iconSize={12} />
        </div>
        {discountAmount > 0 && (
          <div className="fd-total-row fd-discount-row">
            <span>{labels.discount}{discountPercent > 0 ? ` (${discountPercent}%)` : ""}</span>
            <span className="fd-money" dir="ltr">
              <span>−{formatFinanceAmount(discountAmount, 2)}</span>
              <SARIcon size={12} className="fd-currency-icon" />
            </span>
          </div>
        )}
        {vatRate > 0 && (
          <div className="fd-total-row">
            <span>{labels.vat} ({vatRate}%)</span>
            <FinanceMoney amount={vatAmount} decimals={2} iconSize={12} />
          </div>
        )}
        <div className="fd-total-row fd-total-row-grand">
          <strong>{labels.total}</strong>
          <FinanceMoney amount={totalAmount} decimals={2} iconSize={13} />
        </div>
      </div>
    </section>
  );
}

export function FinanceBankCard({
  bank,
  title = "بيانات التحويل البنكي",
  method,
}: {
  bank: FinanceBankDetails;
  title?: string;
  method?: string;
}) {
  return (
    <section className="fd-info-card fd-bank-card print-avoid-break">
      <div className="fd-card-title">
        <span className="fd-card-icon" aria-hidden="true">⌂</span>
        <strong>{title}</strong>
      </div>
      {method && (
        <div className="fd-bank-method">
          <span className="fd-eyebrow">طريقة الدفع</span>
          <strong>{method}</strong>
        </div>
      )}
      <div className="fd-bank-fields">
        <div><span>اسم المستفيد</span><strong>{bank.beneficiaryName || "—"}</strong></div>
        <div><span>البنك</span><strong>{bank.bankName || "—"}</strong></div>
        <div className="fd-bank-iban"><span>رقم الآيبان (IBAN)</span><strong dir="ltr">{bank.iban || "—"}</strong></div>
        {bank.accountNumber && (
          <div><span>رقم الحساب</span><strong dir="ltr">{bank.accountNumber}</strong></div>
        )}
      </div>
      <p className="fd-transfer-note">
        عند التحويل يرجى إرسال صورة الإشعار مع رقم الفاتورة أو العرض عبر الواتساب أو البريد الإلكتروني.
      </p>
    </section>
  );
}

export function FinanceTermsCard({
  title = "الشروط والأحكام",
  entries,
}: {
  title?: string;
  entries: Array<{ label?: string; text?: string }>;
}) {
  const visibleEntries = entries.filter((entry) => entry.text?.trim());
  if (!visibleEntries.length) return null;
  return (
    <section className="fd-info-card fd-terms-card print-avoid-break">
      <div className="fd-card-title">
        <span className="fd-card-icon" aria-hidden="true">▤</span>
        <strong>{title}</strong>
      </div>
      <ul>
        {visibleEntries.map((entry, index) => (
          <li key={`${entry.label || "term"}-${index}`}>
            {entry.label && <strong>{entry.label}: </strong>}
            {entry.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FinanceNotesCard({ notes, title = "ملاحظات" }: { notes?: string; title?: string }) {
  if (!notes?.trim()) return null;
  return (
    <section className="fd-info-card fd-notes-card print-avoid-break">
      <div className="fd-card-title"><strong>{title}</strong></div>
      <p>{notes}</p>
    </section>
  );
}

function FinanceSeal() {
  return (
    <div className="fd-seal" role="img" aria-label="ختم QIROX Studio">
      <span className="fd-seal-ring-text">QIROX STUDIO • QIROX STUDIO</span>
      <span className="fd-seal-center">Q</span>
      <span className="fd-seal-caption">BUILD · SHIP · HUMAN</span>
    </div>
  );
}

export function FinanceApproval({
  receipt = false,
  issuerName = "QIROX Studio",
  payerName,
}: {
  receipt?: boolean;
  issuerName?: string;
  payerName?: string;
}) {
  if (receipt) {
    return (
      <section className="fd-approval fd-approval-receipt print-avoid-break">
        <div className="fd-signature">
          <span className="fd-signature-rule" />
          <strong>توقيع المستلِم</strong>
          <span>{issuerName}</span>
        </div>
        <FinanceSeal />
        <div className="fd-signature">
          <span className="fd-signature-rule" />
          <strong>توقيع الدافع</strong>
          <span>{payerName || "—"}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="fd-approval print-avoid-break">
      <div className="fd-signature">
        <span className="fd-signature-rule" />
        <strong>اعتماد المنشأة</strong>
        <span>{issuerName}</span>
      </div>
      <FinanceSeal />
    </section>
  );
}

export function FinanceReceiptAmount({
  amount,
  amountInWords,
  title = "المبلغ المستلم",
}: {
  amount: number;
  amountInWords?: string;
  title?: string;
}) {
  return (
    <section className="fd-receipt-amount print-avoid-break">
      <span className="fd-total-caption">{title}</span>
      <strong className="fd-total-value" dir="ltr">{formatFinanceAmount(amount, 2)}</strong>
      <span className="fd-total-currency">ريال سعودي</span>
      {amountInWords && <p className="fd-amount-words">{amountInWords}</p>}
    </section>
  );
}

export function FinanceDetailGrid({
  details,
}: {
  details: Array<{ label: string; value?: ReactNode; full?: boolean }>;
}) {
  return (
    <section className="fd-detail-grid">
      {details.filter((detail) => detail.value !== undefined && detail.value !== null && detail.value !== "").map((detail, index) => (
        <div className={detail.full ? "fd-detail fd-detail-full" : "fd-detail"} key={`${detail.label}-${index}`}>
          <span>{detail.label}</span>
          <strong>{detail.value}</strong>
        </div>
      ))}
    </section>
  );
}