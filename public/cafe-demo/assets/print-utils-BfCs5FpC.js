import{aM as w}from"./index-DPoRL2Gk.js";import"./vendor-ui-D1SGnft8.js";import"./vendor-react-Bzsngnqy.js";import"./vendor-query-CLKkgGDH.js";import"./vendor-utils-BKCsaWdX.js";function v(t,e,i={}){const{paperWidth:s="80mm",autoClose:p=!1,autoPrint:o=!0,showPrintButton:n=!0}=i,r=n?`
    <div class="no-print" style="text-align: center; margin-top: 20px; padding: 20px;">
      <button onclick="window.print()" style="padding: 12px 32px; font-size: 16px; background: #b45309; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 10px;">
        طباعة
      </button>
      <button onclick="window.close()" style="padding: 12px 32px; font-size: 16px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;">
        إغلاق
      </button>
    </div>
  `:"",d=`
    <style>
      @media print {
        @page { size: ${s} auto; margin: 0; }
        body { margin: 0; padding: 0; }
        .no-print { display: none !important; }
        .invoice-container, .receipt, .ticket, .card { max-width: ${s}; }
      }
    </style>
  `;let c=t;n&&!c.includes('<div class="no-print"')&&(c=c.replace("</body>",`${r}</body>`)),c=c.replace("</head>",`${d}</head>`);const l=window.open("","_blank","width=450,height=700,scrollbars=yes,resizable=yes");if(l)l.document.write(c),l.document.close(),l.document.title=e,o&&(l.onload=function(){setTimeout(()=>{l.print(),p&&setTimeout(()=>l.close(),1e3)},300)});else{const m=document.createElement("iframe");m.style.cssText="position: absolute; left: -9999px; top: -9999px; width: 0; height: 0;",document.body.appendChild(m);const f=m.contentDocument||m.contentWindow?.document;f&&(f.open(),f.write(c),f.close(),setTimeout(()=>{m.contentWindow?.print(),setTimeout(()=>document.body.removeChild(m),1e3)},500))}return l}const T=.15,k="311234567890003",$="QIROX Cafe",I="QIROX Cafe",A="",P="الفرع الرئيسي",R="الرياض، المملكة العربية السعودية";function E(t){const e=(l,m)=>{const g=new TextEncoder().encode(m),b=new Uint8Array(2+g.length);return b[0]=l,b[1]=g.length,b.set(g,2),b},i=e(1,t.sellerName),s=e(2,t.vatNumber),p=e(3,t.timestamp),o=e(4,t.totalWithVat),n=e(5,t.vatAmount),r=new Uint8Array(i.length+s.length+p.length+o.length+n.length);let d=0;r.set(i,d),d+=i.length,r.set(s,d),d+=s.length,r.set(p,d),d+=p.length,r.set(o,d),d+=o.length,r.set(n,d);let c="";return r.forEach(l=>{c+=String.fromCharCode(l)}),btoa(c)}function x(t){if(t==null)return 0;if(typeof t=="number")return t;const e=parseFloat(t.toString().replace(/[^0-9.-]/g,""));return isNaN(e)?0:e}function u(t,e){return!e||e.trim()===""||e.trim()===t.trim()?`<span style="font-weight:600;">${t}</span>`:`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
    <span style="direction:ltr;text-align:left;font-size:10px;color:#444;flex:1;word-break:break-word;">${e}</span>
    <span style="direction:rtl;text-align:right;font-weight:600;flex:1;word-break:break-word;">${t}</span>
  </div>`}async function V(t){const e=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
    body { font-family: 'Cairo', sans-serif; direction: rtl; }
    .invoice-page { width: 80mm; padding: 10px; border-bottom: 2px dashed #000; page-break-after: always; }
    .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; }
    .content { margin-top: 10px; }
    .row { display: flex; justify-content: space-between; margin: 5px 0; }
    .total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
  </style>
</head>
<body>
  ${t.map(i=>{const s=new Date(i.createdAt),p=s.toLocaleDateString("ar-SA"),o=s.toLocaleTimeString("ar-SA");return`
    <div class="invoice-page">
      <div class="header">
        <h3>ملخص طلب موظف</h3>
        <div>رقم الطلب: ${i.orderNumber}</div>
        <div>التاريخ: ${p} ${o}</div>
      </div>
      <div class="content">
        ${(i.items||[]).map(n=>`
          <div class="row">
            <span>${n.name||n.coffeeItem?.nameAr}</span>
            <span>${n.quantity}</span>
          </div>
        `).join("")}
        <div class="row total">
          <span>الإجمالي:</span>
          <span>${i.totalAmount} ر.س</span>
        </div>
      </div>
    </div>
    `}).join("")}
</body>
</html>
  `;v(e,"Bulk Employee Invoices",{paperWidth:"80mm",autoPrint:!0})}function N(t){try{const e=new Date(t);return isNaN(e.getTime())?{date:t,time:""}:{date:e.toLocaleDateString("ar-SA",{year:"numeric",month:"2-digit",day:"2-digit"}),time:e.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})}}catch{return{date:t,time:""}}}async function L(t){const e=x(t.total),i=t.discount?x(t.discount.amount):0,s=x(t.invoiceDiscount),p=t.items.reduce((a,y)=>a+x(y.itemDiscount),0),o=e/(1+T),n=e-o,r=i+s+p,d=t.invoiceNumber||`INV-${t.orderNumber}`,{date:c,time:l}=N(t.date);t.branchName,t.branchAddress;const m=t.date?new Date(t.date).toISOString():new Date().toISOString(),f=E({sellerName:$,vatNumber:t.vatNumber||k,timestamp:m,totalWithVat:e.toFixed(2),vatAmount:n.toFixed(2)});let g="";try{g=await w.toDataURL(f,{width:180,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"})}catch(a){console.error("Error generating QR code:",a)}const b=`${window.location.origin}/tracking/${t.orderNumber}`;let C="";try{C=await w.toDataURL(b,{width:120,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"})}catch(a){console.error("Error generating tracking QR:",a)}const F=t.items.map(a=>{const y=x(a.coffeeItem.price),q=y*a.quantity,z=x(a.itemDiscount),j=q-z;return`
      <tr>
        <td style="padding:3px 2px;">${u(a.coffeeItem.nameAr,a.coffeeItem.nameEn)}${z>0?` <span style="color:#16a34a;font-size:9px;">(-${z.toFixed(2)})</span>`:""}</td>
        <td style="text-align:center;">${a.quantity}</td>
        <td style="text-align:center;">${y.toFixed(2)}</td>
        <td style="text-align:left;">${j.toFixed(2)}</td>
      </tr>
    `}).join(""),h=t.orderTypeName||(t.orderType==="dine_in"?"محلي":t.orderType==="takeaway"?"سفري":t.orderType==="delivery"?"توصيل":""),D=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ضريبية - ${d}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #000; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .receipt { max-width: 80mm; margin: 0 auto; padding: 8px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
    .company { font-size: 20px; font-weight: 700; }
    .subtitle { font-size: 11px; color: #555; }
    .vat-num { font-size: 10px; font-family: monospace; direction: ltr; color: #333; }
    .invoice-num-block { text-align: center; margin: 8px 0; padding: 8px; background: #f0f0f0; border-radius: 6px; border: 1.5px solid #ccc; }
    .invoice-num-label { font-size: 10px; color: #666; margin-bottom: 2px; }
    .invoice-num-value { font-size: 22px; font-weight: 700; letter-spacing: 1px; color: #000; font-family: monospace; direction: ltr; }
    .info { font-size: 11px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #ccc; }
    .info-row { display: flex; justify-content: space-between; padding: 2px 0; }
    .info-label { color: #666; }
    .info-val { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px; }
    thead tr { border-bottom: 1.5px solid #000; }
    th { padding: 4px 2px; font-weight: 700; font-size: 10px; }
    th:first-child { text-align: right; }
    th:nth-child(2) { text-align: center; width: 30px; }
    th:nth-child(3) { text-align: center; width: 45px; }
    th:last-child { text-align: left; width: 55px; }
    td { padding: 3px 2px; }
    td:first-child { text-align: right; font-weight: 500; }
    td:nth-child(2) { text-align: center; }
    td:nth-child(3) { text-align: center; }
    td:last-child { text-align: left; font-weight: 500; }
    tr { border-bottom: 1px solid #eee; }
    .totals { border-top: 1.5px solid #000; padding-top: 6px; font-size: 11px; }
    .t-row { display: flex; justify-content: space-between; padding: 2px 0; }
    .t-row.grand { font-size: 14px; font-weight: 700; background: #f0f0f0; padding: 6px 8px; border-radius: 4px; margin-top: 4px; }
    .t-row.discount { color: #16a34a; }
    .payment { display: flex; justify-content: space-between; font-size: 11px; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; margin: 6px 0; }
    .payment .val { font-weight: 700; }
    .qr { text-align: center; margin: 8px 0; }
    .qr img { width: 110px; height: 110px; }
    .qr-note { font-size: 9px; color: #888; margin-top: 2px; }
    .footer { text-align: center; font-size: 10px; color: #666; border-top: 1px dashed #ccc; padding-top: 6px; margin-top: 6px; }
    .footer b { color: #000; }
    .cut-line { border: none; border-top: 2px dashed #000; margin: 12px 0; position: relative; }
    .cut-line::after { content: '✂'; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fff; padding: 0 4px; font-size: 12px; }
    .emp-section { padding: 8px; }
    .emp-header { text-align: center; font-size: 13px; font-weight: 700; background: #000; color: #fff; padding: 4px; border-radius: 4px; margin-bottom: 8px; }
    .emp-order { font-size: 20px; font-weight: 700; text-align: center; margin: 6px 0; }
    .emp-type { text-align: center; font-size: 12px; font-weight: 600; background: #f0f0f0; padding: 3px; border-radius: 4px; margin-bottom: 6px; }
    .emp-items { font-size: 12px; }
    .emp-item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #ddd; align-items: center; }
    .emp-item-name { font-weight: 600; flex: 1; }
    .emp-item-qty { font-size: 16px; font-weight: 700; background: #000; color: #fff; padding: 2px 10px; border-radius: 4px; min-width: 40px; text-align: center; }
    .emp-total { display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; margin-top: 6px; padding-top: 6px; border-top: 1.5px solid #000; }
    .emp-info { font-size: 10px; color: #666; text-align: center; margin-top: 8px; }
    @media print { body { margin: 0; } .no-print { display: none !important; } .receipt { padding: 4px; } }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Customer Tax Invoice Section -->
    <div class="header">
      <div class="company">${$}</div>
      <div class="subtitle">فاتورة ضريبية مبسطة</div>
      <div class="vat-num">VAT: ${t.vatNumber||k}</div>
      ${t.crNumber||A?`<div class="vat-num">CR: ${t.crNumber||A}</div>`:""}
    </div>

    <div class="invoice-num-block">
      <div class="invoice-num-label">رقم الفاتورة</div>
      <div class="invoice-num-value">${d}</div>
    </div>

    <div class="info">
      <div class="info-row"><span class="info-label">التاريخ:</span><span class="info-val">${c} ${l}</span></div>
      ${t.customerName&&t.customerName!=="عميل نقدي"?`<div class="info-row"><span class="info-label">العميل:</span><span class="info-val">${t.customerName}</span></div>`:""}
      ${t.tableNumber?`<div class="info-row"><span class="info-label">طاولة:</span><span class="info-val">${t.tableNumber}</span></div>`:""}
      ${h?`<div class="info-row"><span class="info-label">نوع الطلب:</span><span class="info-val">${h}</span></div>`:""}
    </div>

    <table>
      <thead><tr><th>الصنف</th><th>ك</th><th>السعر</th><th>المجموع</th></tr></thead>
      <tbody>${F}</tbody>
    </table>

    <div class="totals">
      ${r>0?`<div class="t-row discount"><span>الخصومات:</span><span>-${(r/(1+T)).toFixed(2)} ر.س</span></div>`:""}
      <div class="t-row"><span>قبل الضريبة:</span><span>${o.toFixed(2)} ر.س</span></div>
      <div class="t-row"><span>ضريبة القيمة المضافة 15%:</span><span>${n.toFixed(2)} ر.س</span></div>
      <div class="t-row grand"><span>الإجمالي:</span><span>${e.toFixed(2)} ر.س</span></div>
    </div>

    <div class="payment"><span>الدفع:</span><span class="val">${t.paymentMethod}</span></div>

    ${g?`
    <div class="qr">
      <img src="${g}" alt="ZATCA QR" />
      <div class="qr-note">رمز التحقق - ZATCA</div>
    </div>
    `:""}

    <div class="footer">
      <div><b>شكراً لزيارتكم</b></div>
      <div>الأسعار شاملة ضريبة القيمة المضافة 15%</div>
      <div>فاتورة إلكترونية</div>
    </div>

    <!-- Cut Line -->
    <hr class="cut-line" />

    <!-- Employee Tear-Off Section -->
    <div class="emp-section">
      <div class="emp-header">نسخة الموظف - ملخص الطلب</div>
      <div class="emp-order">${t.orderNumber}</div>
      ${h?`<div class="emp-type">${h}${t.tableNumber?" - طاولة "+t.tableNumber:""}</div>`:t.tableNumber?`<div class="emp-type">طاولة ${t.tableNumber}</div>`:""}
      
      <div class="emp-items">
        ${t.items.map(a=>`
          <div class="emp-item">
            <div class="emp-item-name">${u(a.coffeeItem.nameAr,a.coffeeItem.nameEn)}</div>
            <span class="emp-item-qty">x${a.quantity}</span>
          </div>
        `).join("")}
      </div>
      
      <div class="emp-total"><span>الإجمالي:</span><span>${e.toFixed(2)} ر.س</span></div>
      
      <div class="emp-info">
        <div>الكاشير: ${t.employeeName} | ${l}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;v(D,`فاتورة ضريبية - ${d}`,{paperWidth:"80mm",autoPrint:!0,showPrintButton:!0})}async function S(t){const e=`${window.location.origin}/order/${t.orderNumber}`;let i="";try{i=await w.toDataURL(e,{width:150,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"})}catch(r){console.error("Error generating order tracking QR:",r)}const{date:s,time:p}=N(t.date),o=t.deliveryTypeAr||(t.deliveryType==="dine-in"?"في الكافيه":t.deliveryType==="delivery"?"توصيل":"استلام"),n=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>إيصال استلام - ${t.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #000; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .receipt { max-width: 80mm; margin: 0 auto; padding: 16px; }
    .header { text-align: center; border-bottom: 3px solid #b45309; padding-bottom: 16px; margin-bottom: 16px; }
    .company-name { font-size: 28px; font-weight: 700; color: #b45309; }
    .order-badge { display: inline-block; background: #fef3c7; border: 2px solid #b45309; padding: 12px 24px; border-radius: 12px; margin: 16px 0; }
    .order-number { font-size: 32px; font-weight: 700; color: #b45309; }
    .order-type { display: inline-block; background: ${t.deliveryType==="dine-in"?"#8b5cf6":t.deliveryType==="delivery"?"#10b981":"#3b82f6"}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 16px; font-weight: 600; margin-top: 8px; }
    .section { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #ccc; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .items-section { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .item-row:last-child { border-bottom: none; }
    .item-name { font-weight: 600; }
    .item-qty { background: #000; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 14px; }
    .total-section { background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 16px; }
    .total-amount { font-size: 28px; font-weight: 700; color: #b45309; }
    .qr-section { text-align: center; padding: 16px; border: 2px dashed #b45309; border-radius: 12px; background: #fffbeb; }
    .qr-title { font-size: 14px; font-weight: 600; color: #92400e; margin-bottom: 8px; }
    .qr-container img { width: 120px; height: 120px; }
    .qr-note { font-size: 11px; color: #666; margin-top: 8px; }
    .footer { text-align: center; padding-top: 16px; font-size: 12px; color: #666; }
    @media print { body { margin: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1 class="company-name">${$}</h1>
      <p style="color: #666; font-size: 14px;">إيصال الاستلام</p>
      <div class="order-badge">
        <div class="order-number">${t.orderNumber}</div>
      </div>
      <div class="order-type">${o}</div>
    </div>

    <div class="section">
      <div class="info-row">
        <span>العميل:</span>
        <span style="font-weight: 600;">${t.customerName}</span>
      </div>
      <div class="info-row">
        <span>التاريخ:</span>
        <span>${s} - ${p}</span>
      </div>
      ${t.tableNumber?`
      <div class="info-row">
        <span>الطاولة:</span>
        <span style="font-weight: 700; font-size: 18px;">${t.tableNumber}</span>
      </div>
      `:""}
    </div>

    <div class="items-section">
      ${t.items.map(r=>`
        <div class="item-row">
          <div class="item-name" style="flex:1;">${u(r.coffeeItem.nameAr,r.coffeeItem.nameEn)}</div>
          <span class="item-qty">x${r.quantity}</span>
        </div>
      `).join("")}
    </div>

    <div class="total-section">
      <p style="font-size: 14px; color: #92400e;">الإجمالي المدفوع</p>
      <p class="total-amount">${t.total} ر.س</p>
      <p style="font-size: 12px; color: #666; margin-top: 4px;">${t.paymentMethod}</p>
    </div>

    <div class="qr-section">
      <p class="qr-title">امسح لتتبع طلبك</p>
      ${i?`<div class="qr-container"><img src="${i}" alt="Order Tracking QR" /></div>`:""}
      <p class="qr-note">أو زر الرابط: qiroxstudio.online/order/${t.orderNumber}</p>
    </div>

    <div class="footer">
      <p style="font-weight: 600;">شكراً لزيارتكم</p>
      <p>نتمنى لكم تجربة ممتعة</p>
      <p style="margin-top: 8px;">@QIROX Cafe</p>
    </div>
  </div>
</body>
</html>
  `;v(n,`إيصال استلام - ${t.orderNumber}`,{paperWidth:"80mm",autoPrint:!0,showPrintButton:!0})}async function U(t){const{date:e,time:i}=N(t.date),s=t.deliveryTypeAr||(t.deliveryType==="dine-in"?"في الكافيه":t.deliveryType==="delivery"?"توصيل":"استلام"),p=x(t.total),o=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>نسخة الكاشير - ${t.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #000; direction: rtl; }
    .receipt { max-width: 80mm; margin: 0 auto; padding: 12px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
    .title { font-size: 14px; font-weight: 700; background: #000; color: #fff; padding: 4px 12px; display: inline-block; margin-bottom: 8px; }
    .order-number { font-size: 24px; font-weight: 700; }
    .order-type { font-size: 14px; font-weight: 600; color: #666; }
    .section { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #999; font-size: 12px; }
    .info-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .items { font-size: 12px; }
    .item-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; }
    .totals { font-size: 12px; margin-top: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .total-grand { font-size: 16px; font-weight: 700; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
    .signature { margin-top: 24px; border-top: 1px solid #000; padding-top: 8px; }
    .signature-line { border-bottom: 1px solid #000; height: 30px; margin-top: 12px; }
    .footer { text-align: center; font-size: 10px; color: #666; margin-top: 12px; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <span class="title">نسخة الكاشير</span>
      <div class="order-number">${t.orderNumber}</div>
      <div class="order-type">${s}</div>
    </div>

    <div class="section">
      <div class="info-row"><span>التاريخ:</span><span>${e}</span></div>
      <div class="info-row"><span>الوقت:</span><span>${i}</span></div>
      <div class="info-row"><span>الكاشير:</span><span>${t.employeeName}</span></div>
      <div class="info-row"><span>العميل:</span><span>${t.customerName}</span></div>
      <div class="info-row"><span>الجوال:</span><span>${t.customerPhone}</span></div>
      ${t.tableNumber?`<div class="info-row"><span>الطاولة:</span><span>${t.tableNumber}</span></div>`:""}
    </div>

    <div class="items">
      ${t.items.map(n=>{const r=x(n.coffeeItem.price);return`
        <div class="item-row" style="align-items:flex-start;">
          <div style="flex:1;">${u(n.coffeeItem.nameAr,n.coffeeItem.nameEn)}<span style="font-size:11px;color:#555;"> x${n.quantity}</span></div>
          <span style="flex-shrink:0;">${(r*n.quantity).toFixed(2)}</span>
        </div>
        `}).join("")}
    </div>

    <div class="totals">
      <div class="total-row"><span>المجموع الفرعي:</span><span>${t.subtotal} ر.س</span></div>
      ${t.discount?`<div class="total-row" style="color: green;"><span>الخصم (${t.discount.percentage}%):</span><span>-${t.discount.amount} ر.س</span></div>`:""}
      <div class="total-row total-grand"><span>الإجمالي:</span><span>${p.toFixed(2)} ر.س</span></div>
      <div class="total-row"><span>طريقة الدفع:</span><span>${t.paymentMethod}</span></div>
    </div>

    <div class="signature">
      <p style="font-size: 11px;">توقيع العميل (للدفع بالبطاقة):</p>
      <div class="signature-line"></div>
    </div>

    <div class="footer">
      <p>تم الحفظ في ${i} - ${e}</p>
    </div>
  </div>
</body>
</html>
  `;v(o,`نسخة الكاشير - ${t.orderNumber}`,{paperWidth:"80mm",autoPrint:!0,showPrintButton:!0})}async function _(t){await L(t),setTimeout(async()=>{await S(t)},500),setTimeout(async()=>{await U(t)},1e3)}async function H(t){const e=t.items.map(o=>{const r=x(o.coffeeItem.price)*o.quantity;return`
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 8px 4px;">${u(o.coffeeItem.nameAr,o.coffeeItem.nameEn)}</td>
        <td style="padding: 8px 4px; text-align: center;">${o.quantity}</td>
        <td style="padding: 8px 4px; text-align: left;">${r.toFixed(2)}</td>
      </tr>
    `}).join(""),i=`${window.location.origin}/tracking?order=${t.orderNumber}`;let s="";try{s=await w.toDataURL(i,{width:100,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"})}catch(o){console.error("Error generating tracking QR code:",o)}const p=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>إيصال - ${t.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Cairo', sans-serif;
      background: #fff;
      color: #000;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .receipt {
      max-width: 80mm;
      margin: 0 auto;
      padding: 16px;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px dashed #333;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    
    .company-name { font-size: 24px; font-weight: 700; }
    .company-name-en { font-size: 14px; color: #666; }
    .order-num-block { text-align: center; margin: 12px 0; padding: 10px; background: #f0f0f0; border-radius: 6px; border: 1.5px solid #ccc; }
    .order-num-label { font-size: 11px; color: #666; margin-bottom: 4px; }
    .order-num-value { font-size: 26px; font-weight: 700; letter-spacing: 1px; color: #000; font-family: monospace; direction: ltr; }
    
    .section {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #ccc;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }
    
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { padding: 8px 4px; font-weight: 700; border-bottom: 2px solid #333; }
    th:first-child { text-align: right; }
    th:nth-child(2) { text-align: center; }
    th:last-child { text-align: left; }
    
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #333; padding-top: 12px; }
    
    .footer { text-align: center; padding-top: 16px; border-top: 2px dashed #333; }
    
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1 class="company-name">${$}</h1>
      <p class="company-name-en">${I}</p>
      <p style="margin-top: 8px; font-size: 12px;">فاتورة مبيعات</p>
    </div>

    <div class="order-num-block">
      <div class="order-num-label">رقم الطلب</div>
      <div class="order-num-value">${t.orderNumber}</div>
    </div>

    <div class="section">
      <div class="info-row">
        <span>التاريخ:</span>
        <span>${t.date}</span>
      </div>
      <div class="info-row">
        <span>العميل:</span>
        <span>${t.customerName}</span>
      </div>
      <div class="info-row">
        <span>الجوال:</span>
        <span>${t.customerPhone}</span>
      </div>
      ${t.tableNumber?`
      <div class="info-row">
        <span>الطاولة:</span>
        <span>${t.tableNumber}</span>
      </div>
      `:""}
      <div class="info-row">
        <span>الكاشير:</span>
        <span>${t.employeeName}</span>
      </div>
    </div>

    <div class="section">
      <table>
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>السعر</th>
          </tr>
        </thead>
        <tbody>
          ${e}
        </tbody>
      </table>
    </div>

    <div>
      <div class="total-row">
        <span>المجموع الفرعي:</span>
        <span>${t.subtotal} ريال</span>
      </div>
      ${t.discount?`
      <div class="total-row" style="color: #16a34a;">
        <span>الخصم (${t.discount.code} - ${t.discount.percentage}%):</span>
        <span>-${t.discount.amount} ريال</span>
      </div>
      `:""}
      <div class="total-row grand">
        <span>الإجمالي:</span>
        <span>${t.total} ريال</span>
      </div>
      <div class="total-row" style="margin-top: 12px;">
        <span>طريقة الدفع:</span>
        <span><strong>${t.paymentMethod}</strong></span>
      </div>
    </div>

    ${s?`
    <div style="text-align: center; padding: 16px 0; border-top: 2px dashed #333; margin-top: 16px;">
      <p style="font-size: 12px; color: #666; margin-bottom: 8px;">امسح لتتبع طلبك</p>
      <img src="${s}" alt="تتبع الطلب" style="width: 80px; height: 80px;" />
      <p style="font-size: 10px; color: #888; margin-top: 4px;">رقم الطلب: ${t.orderNumber}</p>
    </div>
    `:""}

    <div class="footer">
      <p>شكراً لزيارتكم</p>
      <p style="font-size: 12px; color: #666;">نتمنى لكم تجربة ممتعة</p>
      <p style="margin-top: 12px; font-size: 12px;">تابعونا على وسائل التواصل الاجتماعي</p>
      <p style="font-family: monospace;">@QIROX Cafe</p>
    </div>
  </div>

</body>
</html>
  `;v(p,`إيصال - ${t.orderNumber}`,{paperWidth:"80mm",autoPrint:!0,showPrintButton:!0})}export{_ as printAllReceipts,V as printBulkEmployeeInvoices,U as printCashierReceipt,S as printCustomerPickupReceipt,H as printSimpleReceipt,L as printTaxInvoice};
