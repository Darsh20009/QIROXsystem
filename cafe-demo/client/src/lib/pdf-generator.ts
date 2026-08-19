import type { Order } from "@shared/schema";
import type { PaymentMethod } from "@shared/schema";
import QRCode from "qrcode";

interface CartItem {
  coffeeItemId: string;
  quantity: number;
  coffeeItem?: {
    nameAr: string;
    nameEn: string | null;
    price: string;
  };
}

// PDF generation using browser print dialog
export const generatePDF = async (
  order: Order,
  cartItems: CartItem[],
  paymentMethod: PaymentMethod
): Promise<Blob> => {
  const websiteUrl = 'https://www.qiroxstudio.online';
  const qrCodeDataURL = await QRCode.toDataURL(websiteUrl, {
    width: 120,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const paymentMethodNames: Record<string, string> = {
    cash: 'الدفع نقداً',
    pos: 'جهاز نقاط البيع (POS)',
    delivery: 'الدفع عند التوصيل',
    stc: 'STC Pay',
    alinma: 'Alinma Pay',
    ur: 'Ur Pay',
    barq: 'Barq',
    rajhi: 'بنك الراجحي',
    'qahwa-card': 'بطاقة كوبي (مجاني)'
  };

  const paymentDetails: Record<string, string> = {
    cash: 'الدفع عند الاستلام',
    pos: 'الدفع عبر جهاز POS',
    delivery: 'ادفع عند استلام الطلب',
    stc: '+966532441566',
    alinma: '+966532441566',
    ur: '+966532441566',
    barq: '+966532441566',
    rajhi: 'SA78 8000 0539 6080 1942 4738',
    'qahwa-card': 'مشروب مجاني من بطاقة الولاء'
  };

  const itemsHtml = cartItems.map(item => `
    <tr>
      <td style="padding:10px;border:1px solid #ddd;">${item.coffeeItem?.nameAr || 'غير محدد'}</td>
      <td style="padding:10px;text-align:center;border:1px solid #ddd;">${item.quantity}</td>
      <td style="padding:10px;text-align:center;border:1px solid #ddd;">${item.coffeeItem?.price || '0'} ريال</td>
      <td style="padding:10px;text-align:center;border:1px solid #ddd;">${(parseFloat(item.coffeeItem?.price || '0') * item.quantity).toFixed(2)} ريال</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة-${order.orderNumber}</title>
      <style>
        body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 30px; color: #000; }
        h1 { font-size: 36px; color: #B8860B; text-align: center; margin: 0; }
        h2 { color: #D4AF37; font-size: 22px; text-align: center; }
        h3 { color: #D4AF37; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8f9fa; padding: 10px; border: 1px solid #ddd; font-weight: bold; }
        .header { background: linear-gradient(135deg, #FFF8DC, #FFFBEB); border-bottom: 4px solid #D4AF37; padding: 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center; }
        .summary-box { background: linear-gradient(135deg, #FFF8DC, #FFFBEB); padding: 16px; border-radius: 10px; border: 2px solid #D4AF37; margin-bottom: 16px; }
        .total { font-size: 18px; font-weight: bold; display: flex; justify-content: space-between; padding: 16px; background: #f8f9fa; border-radius: 8px; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; border-top: 4px solid #D4AF37; background: linear-gradient(135deg, #FFF8DC, #FFFBEB); border-radius: 0 0 12px 12px; }
        @media print { body { padding: 0; } @page { size: A4; margin: 10mm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="flex:1;text-align:center;">
          <h1>QIROX Cafe</h1>
          <p style="color:#8B6F47;font-size:16px;margin:8px 0;">تجربة قهوة استثنائية</p>
          <p style="color:#666;font-style:italic;">"لكل لحظة قهوة ، لحظة نجاح"</p>
        </div>
        <div style="text-align:center;padding:0 20px;">
          <img src="${qrCodeDataURL}" alt="QR" style="width:100px;height:100px;border:3px solid #D4AF37;border-radius:10px;" />
          <p style="margin:6px 0;color:#8B6F47;font-size:11px;font-weight:bold;">امسح للوصول للموقع</p>
        </div>
      </div>

      <h2>فاتورة استلام الطلب</h2>
      <div class="summary-box">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="font-weight:bold;color:#8B6F47;">اسم العميل:</span><span style="color:#D4AF37;font-weight:bold;">${(order.customerInfo as any)?.customerName || 'غير محدد'}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="font-weight:bold;color:#8B6F47;">رقم الطلب:</span><span style="color:#D4AF37;font-weight:bold;">${order.orderNumber}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="font-weight:bold;color:#8B6F47;">التاريخ:</span><span>${new Date(order.createdAt).toLocaleDateString('ar-SA')}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-weight:bold;color:#8B6F47;">الوقت:</span><span>${new Date(order.createdAt).toLocaleTimeString('ar-SA')}</span></div>
      </div>

      <h3>تفاصيل الطلب</h3>
      <table>
        <thead><tr>
          <th style="text-align:right;">المنتج</th>
          <th>الكمية</th><th>السعر</th><th>المجموع</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="total"><span>إجمالي المبلغ:</span><span style="color:#D4AF37;">${order.totalAmount} ريال</span></div>

      <h3>طريقة الدفع</h3>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-weight:bold;">الطريقة:</span><span>${paymentMethodNames[paymentMethod] || paymentMethod}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-weight:bold;">التفاصيل:</span><span>${paymentDetails[paymentMethod] || ''}</span></div>

      <div class="footer">
        <p style="font-size:18px;font-weight:bold;color:#B8860B;">شكراً لاختياركم QIROX Cafe</p>
        <p style="font-style:italic;color:#8B6F47;">"لكل لحظة قهوة ، لحظة نجاح"</p>
        <p style="font-size:12px;color:#888;">${new Date().toLocaleDateString('ar-SA')} | ${new Date().toLocaleTimeString('ar-SA')}</p>
      </div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>
  `;

  return new Blob([html], { type: 'text/html' });
};

export const loadPDFLibraries = async (): Promise<void> => {
  // No external libraries needed — using browser print dialog
};
