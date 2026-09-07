import{j as e}from"./vendor-ui-D1SGnft8.js";import{E as y}from"./jspdf.es.min-DHPSOatM.js";import N from"./html2canvas.esm-BfxBtG_O.js";import{z as v,S as p,B as u,a9 as w,aM as A}from"./index-DPoRL2Gk.js";import{r as o}from"./vendor-react-Bzsngnqy.js";import{P as k}from"./printer-BhoQ2J3Q.js";function z({order:s,variant:l="button"}){const c=o.useRef(null),[$,b]=o.useState(""),x=(()=>{try{if(!s||!s.items)return[];const t=s.items;if(Array.isArray(t))return t;if(typeof t=="string")try{const a=JSON.parse(t);return Array.isArray(a)?a:[]}catch{return[]}return typeof t=="object"&&t!==null?Object.values(t):[]}catch(t){return console.error("Error parsing order items:",t,s?.items),[]}})();if(o.useEffect(()=>{(async()=>{if(!(!s||!s.orderNumber))try{const a=`https://www.qiroxstudio.online/tracking?order=${s.orderNumber}`,r=await A.toDataURL(a,{width:150,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"});b(r)}catch(a){console.error("Error generating tracking QR code:",a)}})()},[s?.orderNumber]),!s||!s.orderNumber)return null;const g=async()=>{if(c.current)try{const t=await N(c.current,{scale:2,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff"}),a=t.toDataURL("image/png"),r=new y({orientation:"portrait",unit:"mm",format:"a4"}),n=r.internal.pageSize.getWidth(),i=t.height*n/t.width;r.addImage(a,"PNG",0,0,n,i),r.save(`فاتورة-${s.orderNumber}.pdf`)}catch(t){console.error("Error generating PDF:",t)}},h=()=>{if(c.current){const t=window.open("","_blank");if(t){const a=`
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
              .receipt-container { width: 100%; max-width: 80mm; margin: 0 auto; font-family: sans-serif; }
              @page { size: 80mm auto; margin: 0; }
            }
          </style>
        `,r=`
          <div class="receipt-container" style="direction: rtl; padding: 10px; border-bottom: 2px dashed #000; margin-bottom: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
              <h2 style="margin: 5px 0;">طلب تحضير</h2>
              <div style="font-size: 24px; font-weight: bold; margin: 10px 0;">
                ${s.orderNumber}
              </div>
            </div>
            <div style="padding-top: 10px;">
              ${x.map(n=>{const i=n.customization?.selectedItemAddons||[],d=i.length>0?`<div style="font-size:13px;color:#555;margin-top:2px;">+ ${i.map(j=>j.nameAr).join("، ")}</div>`:"",m=n.nameEn||n.coffeeItem?.nameEn||"",f=n.nameAr||n.coffeeItem?.nameAr||n.name||"";return`<div style="margin-bottom: 8px;">
                  <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                    <div>
                      <div>${f}</div>
                      ${m&&m!==f?`<div style="font-size:13px;font-weight:normal;color:#555;direction:ltr;text-align:right;">${m}</div>`:""}
                    </div>
                    <span style="border: 2px solid #000; padding: 2px 8px; border-radius: 4px; white-space:nowrap; align-self:flex-start;">x${n.quantity}</span>
                  </div>
                  ${d}
                </div>`}).join("")}
            </div>
            ${s.customerNotes?`
              <div style="margin-top: 10px; border: 1px solid #000; padding: 5px; font-size: 14px;">
                <strong>ملاحظات:</strong> ${s.customerNotes}
              </div>
            `:""}
            <div style="text-align: center; font-size: 12px; margin-top: 10px;">
              ${new Date(s.createdAt).toLocaleTimeString("ar-SA")}
            </div>
          </div>
        `;t.document.write(`
          <html>
            <head>
              <meta charset="UTF-8">
              ${a}
            </head>
            <body dir="rtl">
              <div class="receipt-container">
                ${c.current.innerHTML}
                ${r}
              </div>
            </body>
          </html>
        `),t.document.close(),setTimeout(()=>{t.print(),t.close()},500)}}};return o.useEffect(()=>{if(l==="auto"&&s&&s.id){const t=setTimeout(()=>{h()},1e3);return()=>clearTimeout(t)}},[l,s?.id]),!s||!s.orderNumber?null:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{ref:c,style:{direction:"rtl"},className:"bg-white rounded-none p-10 max-w-[80mm] mx-auto text-black","data-testid":"invoice-preview",children:[e.jsxs("div",{className:"text-center mb-4 pb-2 border-b border-black",children:[e.jsx("p",{className:"text-[12px] font-black uppercase tracking-wider",children:v.nameEn}),e.jsx("p",{className:"text-[9px] font-bold uppercase tracking-tight opacity-70",children:"Tax Invoice - فاتورة ضريبية"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-1 mb-3 text-[9px] border-b border-black/5 pb-2",children:[e.jsxs("div",{className:"space-y-0.5",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"opacity-60",children:"رقم الفاتورة:"}),e.jsx("span",{className:"font-mono",children:s.orderNumber})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"opacity-60",children:"التاريخ:"}),e.jsx("span",{children:new Date(s.createdAt).toLocaleDateString("ar-SA")})]})]}),e.jsxs("div",{className:"space-y-0.5 text-left",children:[e.jsxs("div",{className:"flex justify-between flex-row-reverse",children:[e.jsx("span",{className:"opacity-60",children:":الوقت"}),e.jsx("span",{children:new Date(s.createdAt).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})})]}),s.tableNumber&&e.jsxs("div",{className:"flex justify-between flex-row-reverse",children:[e.jsx("span",{className:"opacity-60",children:":الطاولة"}),e.jsxs("span",{className:"font-bold",children:["#",s.tableNumber]})]})]})]}),e.jsx("div",{className:"mb-3",children:e.jsxs("table",{className:"w-full text-[10px]",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-black",children:[e.jsx("th",{className:"text-right py-1",children:"المنتج"}),e.jsx("th",{className:"text-center py-1",children:"كمية"}),e.jsx("th",{className:"text-left py-1",children:"المجموع"})]})}),e.jsx("tbody",{className:"divide-y divide-gray-100",children:x.map((t,a)=>{const r=t.customization?.selectedItemAddons||[],n=t.nameAr||t.coffeeItem?.nameAr||t.name||"",i=t.nameEn||t.coffeeItem?.nameEn||"";return e.jsxs("tr",{children:[e.jsxs("td",{className:"py-1 text-right",children:[e.jsx("div",{className:"font-medium",children:n}),i&&i!==n&&e.jsx("div",{className:"text-[9px] text-gray-400 mt-0.5 ltr text-right",children:i}),r.length>0&&e.jsxs("div",{className:"text-[9px] text-gray-500 mt-0.5",children:["+ ",r.map(d=>d.nameAr).join("، ")]})]}),e.jsx("td",{className:"py-1 text-center",children:t.quantity}),e.jsx("td",{className:"py-1 text-left font-medium",children:(parseFloat(t.price||0)*(t.quantity||1)).toFixed(2)})]},a)})})]})}),e.jsxs("div",{className:"border-t border-black pt-1.5 space-y-0.5 text-[10px]",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"المجموع الفرعي:"}),e.jsxs("span",{children:[(Number(s.totalAmount)/1.15).toFixed(2)," ",e.jsx(p,{})]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"الضريبة (15%):"}),e.jsxs("span",{children:[(Number(s.totalAmount)-Number(s.totalAmount)/1.15).toFixed(2)," ",e.jsx(p,{})]})]}),e.jsxs("div",{className:"flex justify-between text-sm font-black border-t border-black mt-1 pt-1",children:[e.jsx("span",{children:"الإجمالي:"}),e.jsxs("span",{children:[Number(s.totalAmount).toFixed(2)," ",e.jsx(p,{})]})]})]}),e.jsxs("div",{className:"text-center mt-4 pt-2 border-t border-black text-[9px]",children:[e.jsx("p",{className:"font-bold",children:"شكراً لزيارتكم"}),e.jsx("p",{children:"الرقم الضريبي: 311234567890003"}),e.jsx("p",{className:"font-bold mt-1 tracking-tight",children:"www.qiroxstudio.online"})]})]}),l==="button"&&e.jsxs("div",{className:"flex gap-2 w-full no-print",children:[e.jsxs(u,{onClick:h,className:"flex-1 bg-primary hover:bg-primary/90","data-testid":"button-print-invoice",children:[e.jsx(k,{className:"ml-2 h-4 w-4"}),"طباعة الفاتورة"]}),e.jsxs(u,{onClick:g,variant:"outline",className:"flex-1","data-testid":"button-download-invoice",children:[e.jsx(w,{className:"ml-2 h-4 w-4"}),"تحميل PDF"]})]})]})}export{z as R};
