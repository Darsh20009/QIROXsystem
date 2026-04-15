import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import type { Order } from "@shared/schema";
import logoImage from "../assets/qirox-logo.png";
import { brand } from "@/lib/brand";
import { useRef, useState, useEffect } from "react";
import QRCode from "qrcode";
import SarIcon from "@/components/sar-icon";

interface ReceiptInvoiceProps {
  order: Order;
  variant?: "button" | "auto";
}

export function ReceiptInvoice({ order, variant = "button" }: ReceiptInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [trackingQrUrl, setTrackingQrUrl] = useState<string>("");

  const getItemsArray = (): any[] => {
    try {
      if (!order || !order.items) return [];
      const items = order.items;
      if (Array.isArray(items)) return items;
      if (typeof items === 'string') {
        try {
          const parsed = JSON.parse(items);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      if (typeof items === 'object' && items !== null) {
        return Object.values(items);
      }
      return [];
    } catch (e) {
      console.error("Error parsing order items:", e, order?.items);
      return [];
    }
  };

  const items = getItemsArray();
  const safeOrder = order || {} as Order;

  useEffect(() => {
    const generateTrackingQR = async () => {
      if (!order || !order.orderNumber) return;
      try {
        const trackingUrl = `https://www.qiroxstudio.online/tracking?order=${order.orderNumber}`;
        const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setTrackingQrUrl(qrDataUrl);
      } catch (error) {
        console.error("Error generating tracking QR code:", error);
      }
    };
    generateTrackingQR();
  }, [order?.orderNumber]);

  // Early return if no valid order
  if (!order || !order.orderNumber) {
    return null;
  }

  const generatePDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`فاتورة-${order.orderNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const printReceipt = () => {
    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const style = `
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
              .receipt-container { width: 100%; max-width: 80mm; margin: 0 auto; font-family: sans-serif; }
              @page { size: 80mm auto; margin: 0; }
            }
          </style>
        `;
        
        // Preparation Slip (Kitchen)
        const prepSlip = `
          <div class="receipt-container" style="direction: rtl; padding: 10px; border-bottom: 2px dashed #000; margin-bottom: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
              <h2 style="margin: 5px 0;">طلب تحضير</h2>
              <div style="font-size: 24px; font-weight: bold; margin: 10px 0;">
                ${order.orderNumber}
              </div>
            </div>
            <div style="padding-top: 10px;">
              ${items.map((item: any) => {
                const inlineAddons = item.customization?.selectedItemAddons || [];
                const addonsText = inlineAddons.length > 0 ? `<div style="font-size:13px;color:#555;margin-top:2px;">+ ${inlineAddons.map((a: any) => a.nameAr).join('، ')}</div>` : '';
                const nameEn = item.nameEn || item.coffeeItem?.nameEn || '';
                const nameAr = item.nameAr || item.coffeeItem?.nameAr || item.name || '';
                return `<div style="margin-bottom: 8px;">
                  <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                    <div>
                      <div>${nameAr}</div>
                      ${nameEn && nameEn !== nameAr ? `<div style="font-size:13px;font-weight:normal;color:#555;direction:ltr;text-align:right;">${nameEn}</div>` : ''}
                    </div>
                    <span style="border: 2px solid #000; padding: 2px 8px; border-radius: 4px; white-space:nowrap; align-self:flex-start;">x${item.quantity}</span>
                  </div>
                  ${addonsText}
                </div>`;
              }).join('')}
            </div>
            ${order.customerNotes ? `
              <div style="margin-top: 10px; border: 1px solid #000; padding: 5px; font-size: 14px;">
                <strong>ملاحظات:</strong> ${order.customerNotes}
              </div>
            ` : ''}
            <div style="text-align: center; font-size: 12px; margin-top: 10px;">
              ${new Date(order.createdAt).toLocaleTimeString('ar-SA')}
            </div>
          </div>
        `;

        printWindow.document.write(`
          <html>
            <head>
              <meta charset="UTF-8">
              ${style}
            </head>
            <body dir="rtl">
              <div class="receipt-container">
                ${invoiceRef.current.innerHTML}
                ${prepSlip}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Use a timeout to ensure styles and content are loaded before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  useEffect(() => {
    // Auto-print if variant is auto
    if (variant === "auto" && order && order.id) {
      const timer = setTimeout(() => {
        printReceipt();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [variant, order?.id]);

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'cash': 'نقداً',
      'pos': 'جهاز نقاط البيع',
      'delivery': 'الدفع عند التوصيل',
      'stc': 'STC Pay',
      'alinma': 'الإنماء باي',
      'ur': 'يور باي',
      'barq': 'برق',
      'rajhi': 'الراجحي',
      'qahwa-card': 'بطاقة قهوة'
    };
    return methods[method] || method;
  };

  // Early return if no valid order
  if (!order || !order.orderNumber) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Invoice Preview */}
      <div
        ref={invoiceRef}
        style={{ direction: "rtl" }}
        className="bg-white rounded-none p-10 max-w-[80mm] mx-auto text-black"
        data-testid="invoice-preview"
      >
        {/* Header */}
        <div className="text-center mb-4 pb-2 border-b border-black">
          <p className="text-[12px] font-black uppercase tracking-wider">{brand.nameEn}</p>
          <p className="text-[9px] font-bold uppercase tracking-tight opacity-70">Tax Invoice - فاتورة ضريبية</p>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-1 mb-3 text-[9px] border-b border-black/5 pb-2">
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="opacity-60">رقم الفاتورة:</span>
              <span className="font-mono">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">التاريخ:</span>
              <span>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex justify-between flex-row-reverse">
              <span className="opacity-60">:الوقت</span>
              <span>{new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {order.tableNumber && (
              <div className="flex justify-between flex-row-reverse">
                <span className="opacity-60">:الطاولة</span>
                <span className="font-bold">#{order.tableNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-3">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-black">
                <th className="text-right py-1">المنتج</th>
                <th className="text-center py-1">كمية</th>
                <th className="text-left py-1">المجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any, index: number) => {
                const inlineAddons = item.customization?.selectedItemAddons || [];
                const itemNameAr = item.nameAr || item.coffeeItem?.nameAr || item.name || '';
                const itemNameEn = item.nameEn || item.coffeeItem?.nameEn || '';
                return (
                  <tr key={index}>
                    <td className="py-1 text-right">
                      <div className="font-medium">{itemNameAr}</div>
                      {itemNameEn && itemNameEn !== itemNameAr && (
                        <div className="text-[9px] text-gray-400 mt-0.5 ltr text-right">{itemNameEn}</div>
                      )}
                      {inlineAddons.length > 0 && (
                        <div className="text-[9px] text-gray-500 mt-0.5">
                          + {inlineAddons.map((a: any) => a.nameAr).join('، ')}
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-left font-medium">
                      {(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-black pt-1.5 space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>المجموع الفرعي:</span>
            <span>{(Number(order.totalAmount) / 1.15).toFixed(2)} <SarIcon /></span>
          </div>
          <div className="flex justify-between">
            <span>الضريبة (15%):</span>
            <span>{(Number(order.totalAmount) - (Number(order.totalAmount) / 1.15)).toFixed(2)} <SarIcon /></span>
          </div>
          <div className="flex justify-between text-sm font-black border-t border-black mt-1 pt-1">
            <span>الإجمالي:</span>
            <span>{Number(order.totalAmount).toFixed(2)} <SarIcon /></span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 pt-2 border-t border-black text-[9px]">
          <p className="font-bold">شكراً لزيارتكم</p>
          <p>الرقم الضريبي: 311234567890003</p>
          <p className="font-bold mt-1 tracking-tight">www.qiroxstudio.online</p>
        </div>
      </div>

      {/* Action Buttons */}
      {variant === "button" && (
        <div className="flex gap-2 w-full no-print">
          <Button
            onClick={printReceipt}
            className="flex-1 bg-primary hover:bg-primary/90"
            data-testid="button-print-invoice"
          >
            <Printer className="ml-2 h-4 w-4" />
            طباعة الفاتورة
          </Button>
          <Button
            onClick={generatePDF}
            variant="outline"
            className="flex-1"
            data-testid="button-download-invoice"
          >
            <Download className="ml-2 h-4 w-4" />
            تحميل PDF
          </Button>
        </div>
      )}
    </div>
  );
}
