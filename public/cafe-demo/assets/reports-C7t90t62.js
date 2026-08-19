import{j as t}from"./vendor-ui-D1SGnft8.js";import{r as f}from"./vendor-react-Bzsngnqy.js";import{u as w}from"./vendor-query-CLKkgGDH.js";import{u as E}from"./useTranslate-CHFiQrdN.js";import{z as G,aK as L,C as j,f as u,r as S,I as b,B as N,a9 as v,J as R,K as C,aR as $}from"./index-DPoRL2Gk.js";import{T as I,a as y,b as x,c as d,d as T,e as l}from"./table-DKaWSIi9.js";import{T as q}from"./trending-up-ZuHGKVat.js";import{T as B}from"./trending-down-BBYffPv_.js";import"./vendor-utils-BKCsaWdX.js";function M(s){return s.map(c=>{const n={};return Object.keys(c).forEach(r=>{!r.startsWith("_")&&r!=="__v"&&r!=="password"&&r!=="token"&&(n[r]=c[r])}),n})}function F(s,c){if(!s||s.length===0){console.error("No data to export");return}const n=M(s),r=Object.keys(n[0]),a=[r.join(","),...n.map(h=>r.map(g=>`"${h[g]||""}"`).join(","))].join(`
`),m=new Blob([a],{type:"text/csv;charset=utf-8;"}),i=document.createElement("a"),p=URL.createObjectURL(m);i.setAttribute("href",p),i.setAttribute("download",c),i.style.visibility="hidden",document.body.appendChild(i),i.click(),document.body.removeChild(i)}function z(s,c){const n=`
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #666; margin-top: 20px; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #007bff; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .positive { color: green; font-weight: bold; }
          .negative { color: red; font-weight: bold; }
          .info { color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>${s.title}</h1>
        <p><strong>Period:</strong> ${s.date}</p>
        <p><strong>Branch:</strong> ${s.branch}</p>

        ${s.topItems&&s.topItems.length>0?`
          <h2>Top Profitable Items</h2>
          <table>
            <tr>
              <th>Item</th>
              <th>Sold</th>
              <th>Revenue</th>
              <th>COGS</th>
              <th>Profit</th>
              <th>Margin %</th>
            </tr>
            ${s.topItems.slice(0,10).map(a=>`
              <tr>
                <td>${a.nameAr||a.itemId}</td>
                <td>${a.quantitySold}</td>
                <td>${a.totalRevenue?.toFixed(2)||"0.00"} SAR</td>
                <td>${a.totalCOGS?.toFixed(2)||"0.00"} SAR</td>
                <td class="positive">${a.totalProfit?.toFixed(2)||"0.00"} SAR</td>
                <td>${a.profitMargin?.toFixed(1)||"0"}%</td>
              </tr>
            `).join("")}
          </table>
        `:""}

        ${s.worstItems&&s.worstItems.length>0?`
          <h2>Worst Performing Items</h2>
          <table>
            <tr>
              <th>Item</th>
              <th>Sold</th>
              <th>Revenue</th>
              <th>COGS</th>
              <th>Profit</th>
              <th>Reason</th>
            </tr>
            ${s.worstItems.slice(0,10).map(a=>`
              <tr>
                <td>${a.nameAr||a.itemId}</td>
                <td>${a.quantitySold}</td>
                <td>${a.totalRevenue?.toFixed(2)||"0.00"} SAR</td>
                <td>${a.totalCOGS?.toFixed(2)||"0.00"} SAR</td>
                <td class="negative">${a.totalProfit?.toFixed(2)||"0.00"} SAR</td>
                <td>${a.reason||"Low margin"}</td>
              </tr>
            `).join("")}
          </table>
        `:""}

        <div class="info">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>${G.platformNameEn} - Automated Report</p>
        </div>
      </body>
    </html>
  `,r=window.open("","","height=400,width=800");r&&(r.document.write(n),r.document.close(),r.print(),setTimeout(()=>{r.close()},250))}function X(){E();const[s,c]=f.useState("branch-1"),[n,r]=f.useState(new Date(new Date().setDate(new Date().getDate()-30)).toISOString().split("T")[0]),[a,m]=f.useState(new Date().toISOString().split("T")[0]),{data:i=[],isLoading:p}=w({queryKey:[`/api/accounting/top-items/${s}`,n,a],enabled:!!s}),{data:h=[],isLoading:g}=w({queryKey:[`/api/accounting/worst-items/${s}`,n,a],enabled:!!s}),P=p||g,A=()=>{const e=i.map(o=>({"Item Name":o.nameAr||o.itemId,"Quantity Sold":o.quantitySold,"Total Revenue":o.totalRevenue?.toFixed(2),"Total COGS":o.totalCOGS?.toFixed(2),"Total Profit":o.totalProfit?.toFixed(2),"Profit Margin %":o.profitMargin?.toFixed(1)}));F(e,`top-items-${s}-${n}-to-${a}.csv`)},D=()=>{const e=h.map(o=>({"Item Name":o.nameAr||o.itemId,"Quantity Sold":o.quantitySold,"Total Revenue":o.totalRevenue?.toFixed(2),"Total COGS":o.totalCOGS?.toFixed(2),"Total Profit":o.totalProfit?.toFixed(2),"Profit Margin %":o.profitMargin?.toFixed(1),Reason:o.reason||"Low profit margin"}));F(e,`worst-items-${s}-${n}-to-${a}.csv`)},O=()=>{z({title:"Sales Report",date:`${n} to ${a}`,branch:s,topItems:i.slice(0,10),worstItems:h.slice(0,10)})};return P?t.jsx(L,{}):t.jsxs("div",{className:"space-y-6 p-6",children:[t.jsx("h1",{className:"text-3xl font-bold",children:"Sales Reports"}),t.jsx(j,{"data-testid":"card-filters",children:t.jsx(u,{className:"pt-6",children:t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[t.jsxs("div",{children:[t.jsx(S,{children:"Start Date"}),t.jsx(b,{type:"date",value:n,onChange:e=>r(e.target.value),"data-testid":"input-start-date"})]}),t.jsxs("div",{children:[t.jsx(S,{children:"End Date"}),t.jsx(b,{type:"date",value:a,onChange:e=>m(e.target.value),"data-testid":"input-end-date"})]}),t.jsxs("div",{children:[t.jsx(S,{children:"Branch"}),t.jsx(b,{value:s,onChange:e=>c(e.target.value),"data-testid":"input-branch"})]}),t.jsx("div",{className:"flex items-end gap-2",children:t.jsxs(N,{onClick:O,className:"w-full gap-2",variant:"outline","data-testid":"button-export-pdf",children:[t.jsx(v,{className:"w-4 h-4"})," Export PDF"]})})]})})}),t.jsxs(j,{"data-testid":"card-top-items",children:[t.jsxs(R,{className:"flex flex-row items-center justify-between",children:[t.jsx("div",{children:t.jsxs(C,{className:"flex items-center gap-2",children:[t.jsx(q,{className:"w-5 h-5 text-green-600"}),"Top 10 Profitable Items"]})}),t.jsxs(N,{onClick:A,variant:"outline",size:"sm",className:"gap-2","data-testid":"button-export-top-csv",children:[t.jsx(v,{className:"w-4 h-4"})," CSV"]})]}),t.jsx(u,{children:i&&i.length>0?t.jsx("div",{className:"overflow-x-auto",children:t.jsxs(I,{children:[t.jsx(y,{children:t.jsxs(x,{children:[t.jsx(d,{children:"Item Name"}),t.jsx(d,{className:"text-right",children:"Sold"}),t.jsx(d,{className:"text-right",children:"Revenue"}),t.jsx(d,{className:"text-right",children:"COGS"}),t.jsx(d,{className:"text-right",children:"Profit"}),t.jsx(d,{className:"text-right",children:"Margin %"})]})}),t.jsx(T,{children:i.slice(0,10).map((e,o)=>t.jsxs(x,{"data-testid":`row-top-item-${o}`,children:[t.jsx(l,{className:"font-medium",children:e.nameAr||e.itemId}),t.jsx(l,{className:"text-right",children:e.quantitySold}),t.jsxs(l,{className:"text-right",children:[e.totalRevenue?.toFixed(2)," SAR"]}),t.jsxs(l,{className:"text-right",children:[e.totalCOGS?.toFixed(2)," SAR"]}),t.jsxs(l,{className:"text-right font-bold text-green-600",children:[e.totalProfit?.toFixed(2)," SAR"]}),t.jsxs(l,{className:"text-right",children:[e.profitMargin?.toFixed(1),"%"]})]},o))})]})}):t.jsx($,{title:"No data",description:"No top items found for this period"})})]}),t.jsxs(j,{"data-testid":"card-worst-items",children:[t.jsxs(R,{className:"flex flex-row items-center justify-between",children:[t.jsx("div",{children:t.jsxs(C,{className:"flex items-center gap-2",children:[t.jsx(B,{className:"w-5 h-5 text-red-600"}),"Worst 10 Performing Items"]})}),t.jsxs(N,{onClick:D,variant:"outline",size:"sm",className:"gap-2","data-testid":"button-export-worst-csv",children:[t.jsx(v,{className:"w-4 h-4"})," CSV"]})]}),t.jsx(u,{children:h&&h.length>0?t.jsx("div",{className:"overflow-x-auto",children:t.jsxs(I,{children:[t.jsx(y,{children:t.jsxs(x,{children:[t.jsx(d,{children:"Item Name"}),t.jsx(d,{className:"text-right",children:"Sold"}),t.jsx(d,{className:"text-right",children:"Revenue"}),t.jsx(d,{className:"text-right",children:"COGS"}),t.jsx(d,{className:"text-right",children:"Profit"}),t.jsx(d,{className:"text-right",children:"Reason"})]})}),t.jsx(T,{children:h.slice(0,10).map((e,o)=>t.jsxs(x,{"data-testid":`row-worst-item-${o}`,children:[t.jsx(l,{className:"font-medium",children:e.nameAr||e.itemId}),t.jsx(l,{className:"text-right",children:e.quantitySold}),t.jsxs(l,{className:"text-right",children:[e.totalRevenue?.toFixed(2)," SAR"]}),t.jsxs(l,{className:"text-right",children:[e.totalCOGS?.toFixed(2)," SAR"]}),t.jsxs(l,{className:"text-right font-bold text-red-600",children:[e.totalProfit?.toFixed(2)," SAR"]}),t.jsx(l,{className:"text-right text-secondary-foreground text-sm",children:e.reason||"Low margin"})]},o))})]})}):t.jsx($,{title:"No data",description:"No worst items found for this period"})})]})]})}export{X as default};
