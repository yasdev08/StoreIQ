// src/utils/export.ts
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile } from "@tauri-apps/api/fs";

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g,'""')}"` : s;
  };
  return [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
}

async function saveCsv(filename: string, csv: string) {
  const path = await save({ defaultPath: filename, filters: [{ name: "CSV", extensions: ["csv"] }] });
  if (path) await writeTextFile(path, csv);
}

export async function exportProductsCSV(products: {
  sku:string; name:string; category:string; price:number; cost:number;
  stock:number; threshold:number; barcode:string|null; notes:string|null;
}[]) {
  const csv = toCSV(
    ["SKU","Name","Category","Sell Price","Cost Price","Stock","Alert Threshold","Barcode","Notes"],
    products.map(p=>[p.sku,p.name,p.category,p.price,p.cost,p.stock,p.threshold,p.barcode,p.notes])
  );
  await saveCsv(`storeiq-products-${today()}.csv`, csv);
}

export async function exportSalesCSV(sales: {
  id:number; product_name:string; quantity:number; unit_price:number;
  unit_cost:number; total_revenue:number; total_cost:number; sold_at:string;
}[]) {
  const csv = toCSV(
    ["ID","Product","Qty","Unit Price","Unit Cost","Revenue","Cost","Profit","Date"],
    sales.map(s=>[s.id,s.product_name,s.quantity,s.unit_price,s.unit_cost,
      s.total_revenue,s.total_cost,+(s.total_revenue-s.total_cost).toFixed(2),s.sold_at])
  );
  await saveCsv(`storeiq-sales-${today()}.csv`, csv);
}

export async function exportInventoryCSV(products: {
  sku:string; name:string; category:string; stock:number; cost:number; price:number;
}[]) {
  const csv = toCSV(
    ["SKU","Name","Category","Stock","Cost Price","Sell Price","Total Cost Value","Total Sell Value"],
    products.map(p=>[p.sku,p.name,p.category,p.stock,p.cost,p.price,
      +(p.stock*p.cost).toFixed(2),+(p.stock*p.price).toFixed(2)])
  );
  await saveCsv(`storeiq-inventory-${today()}.csv`, csv);
}

const today = () => new Date().toISOString().split("T")[0];