// src/views/Scanner.tsx — POS Terminal
// Keyboard: F1 camera · Enter confirm · +/- qty · ↑↓ select · Del remove · Esc clear cart
import { useState, useRef, useCallback, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { Icon, Icons } from "@/components/ui/Icon";
import { useImage } from "@/hooks/useImage";
import type { IScannerControls } from "@zxing/browser";
import type { Product, ProductInput } from "@/types";

const CATEGORIES = [
  "Sneakers",
  "Caps",
  "T-Shirts",
  "Jackets",
  "Accessories",
  "General",
];
const BILLS = [500, 1000, 2000, 5000, 10000]; // in cents to avoid float issues
const DEFAULT_CAMERA_ID = "__default__";

interface CartItem {
  product: Product;
  qty: number;
}
interface Receipt {
  items: CartItem[];
  total: number;
  cash: number;
  change: number;
  saleDate: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function ProductImage({ path, name }: { path: string; name: string }) {
  const src = useImage(path);
  if (!src) return null;
  return <img src={src} alt={name} className="w-full h-full object-cover" />;
}

const inp =
  "w-full bg-[#0C0E14] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors";

// ── Add-product mini form ─────────────────────────────────────────────────────
function AddProductForm({
  barcode,
  onSave,
  onCancel,
}: {
  barcode: string;
  onSave: (i: ProductInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProductInput>({
    sku: "",
    name: "",
    category: "General",
    price: 0,
    cost: 0,
    stock: 1,
    threshold: 5,
    supplier_id: null,
    barcode,
    image_path: null,
    notes: null,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof ProductInput, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));
  const handleSave = async () => {
    if (!form.name.trim()) {
      setErr("Name required");
      return;
    }
    if (!form.sku.trim()) {
      setErr("SKU required");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave(form);
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mt-3 border-t border-[#252836] pt-3">
      <div className="text-[11px] text-[#F59E0B] font-semibold mb-2">
        + Add New Product
      </div>
      {err && <div className="mb-2 text-[11px] text-[#EF4444]">{err}</div>}
      <div className="bg-[#0C0E14] rounded px-2.5 py-1 font-mono text-[11px] text-[#F59E0B] mb-2 truncate">
        {barcode}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <input
            className={inp}
            placeholder="Product name *"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
          />
        </div>
        <input
          className={inp}
          placeholder="SKU *"
          value={form.sku}
          onChange={(e) => set("sku", e.target.value)}
        />
        <select
          className={inp}
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          className={inp}
          type="number"
          placeholder="Sell price"
          value={form.price}
          onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
        />
        <input
          className={inp}
          type="number"
          placeholder="Stock qty"
          value={form.stock}
          onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#252836]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add"}
        </button>
      </div>
    </div>
  );
}

// ── Receipt modal ─────────────────────────────────────────────────────────────
function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: Receipt;
  onClose: () => void;
}) {
  const storeName = "StoreIQ Shop";
  const dateStr = new Date(receipt.saleDate).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Receipt</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; font-size: 13px; width: 300px; padding: 16px; color: #000; }
        .center { text-align: center; }
        .bold   { font-weight: bold; }
        .big    { font-size: 18px; font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row    { display: flex; justify-content: space-between; margin: 3px 0; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; margin: 4px 0; }
        .change-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin: 4px 0; }
        .footer { text-align: center; margin-top: 12px; font-size: 11px; }
      </style>
    </head><body>
      <div class="center bold" style="font-size:16px; margin-bottom:4px">${storeName}</div>
      <div class="center" style="font-size:11px; margin-bottom:2px">${dateStr}</div>
      <div class="divider"></div>
      ${receipt.items
        .map(
          (i) => `
        <div class="row">
          <span>${i.product.name}</span>
          <span></span>
        </div>
        <div class="row" style="color:#555">
          <span>&nbsp;&nbsp;${i.qty} × $${i.product.price.toFixed(2)}</span>
          <span>$${(i.qty * i.product.price).toFixed(2)}</span>
        </div>
      `,
        )
        .join("")}
      <div class="divider"></div>
      <div class="total-row"><span>TOTAL</span><span>$${receipt.total.toFixed(2)}</span></div>
      <div class="row"><span>Cash</span><span>$${receipt.cash.toFixed(2)}</span></div>
      <div class="change-row"><span>CHANGE</span><span>$${receipt.change.toFixed(2)}</span></div>
      <div class="divider"></div>
      <div class="footer">Thank you for your purchase!<br/>Please come again.</div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#13151E] border border-[#252836] rounded-2xl overflow-hidden w-[380px] max-w-[95vw] shadow-2xl">
        {/* Receipt header */}
        <div className="bg-[#10B981] px-6 py-5 text-center">
          <div className="text-[28px] font-bold text-white mb-0.5">
            ✓ Sale Complete
          </div>
          <div className="text-[13px] text-[rgba(255,255,255,0.8)] font-mono">
            {dateStr}
          </div>
        </div>

        {/* Receipt body — styled like a thermal receipt */}
        <div className="p-5 font-mono">
          {/* Items */}
          <div className="space-y-2 mb-4">
            {receipt.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-[13px]">
                  <span className="font-semibold truncate flex-1 mr-2">
                    {item.product.name}
                  </span>
                  <span className="text-[#F59E0B] font-bold flex-shrink-0">
                    ${(item.product.price * item.qty).toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-[#4A5068]">
                  {item.qty} × ${item.product.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-[#252836] my-3" />

          {/* Totals */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#8B90A8]">Subtotal</span>
              <span className="font-mono">${receipt.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-bold border-t border-[#252836] pt-1.5 mt-1.5">
              <span>TOTAL</span>
              <span>${receipt.total.toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-[#252836] my-2" />

            <div className="flex justify-between text-[13px]">
              <span className="text-[#8B90A8]">Cash Received</span>
              <span className="font-mono">${receipt.cash.toFixed(2)}</span>
            </div>

            {/* Change — big and prominent */}
            <div className="flex justify-between items-center bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-xl px-4 py-3 mt-2">
              <span className="text-[15px] font-bold">CHANGE</span>
              <span className="text-[28px] font-bold font-mono text-[#F59E0B]">
                ${receipt.change.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-[#252836] my-3" />
          <div className="text-center text-[11px] text-[#4A5068]">
            Thank you for your purchase!
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold bg-[#1A1D2A] text-[#E8EAF0] border border-[#252836] hover:bg-[#252836] transition-colors"
          >
            🖨 Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-[13px] font-bold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main POS view ─────────────────────────────────────────────────────────────
export function Scanner() {
  const { products, createProduct, recordSale } = useStore();

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  // Cash / change
  const [cashInput, setCashInput] = useState("");
  const cashRef = useRef<HTMLInputElement>(null);

  // Scanner
  const [scanning, setScanning] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>(DEFAULT_CAMERA_ID);
  const deviceIdRef = useRef(deviceId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<IScannerControls | null>(null);

  // Lookup state
  const [lastCode, setLastCode] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [manual, setManual] = useState("");
  const manualRef = useRef<HTMLInputElement>(null);

  // Sale states
  const [checking, setChecking] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartQty = cart.reduce((s, i) => s + i.qty, 0);
  const cashAmt = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashAmt - cartTotal);
  const cashValid = cashAmt >= cartTotal && cashAmt > 0;

  // ── Lookup ───────────────────────────────────────────────────────────────────
  const lookup = useCallback((code: string) => {
    const found = productsRef.current.find((p) => p.barcode === code);
    setLastCode(code);
    if (found) {
      setCart((prev) => {
        const idx = prev.findIndex((i) => i.product.id === found.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
          setFocusedIdx(idx);
          return next;
        }
        setFocusedIdx(prev.length);
        return [...prev, { product: found, qty: 1 }];
      });
      setNotFound(false);
      setShowAddForm(false);
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.frequency.value = 880;
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch {}
    } else {
      setNotFound(true);
    }
  }, []);

  // ── Camera ───────────────────────────────────────────────────────────────────
  const stopScanner = useCallback(() => {
    try {
      readerRef.current?.stop();
    } catch {}
    readerRef.current = null;
    setScanning(false);
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const { BrowserCodeReader } = await import("@zxing/browser");
      const list = await BrowserCodeReader.listVideoInputDevices();
      setDevices(list);
      setDeviceId((prev) => {
        if (prev === DEFAULT_CAMERA_ID) return prev;
        return list.some((d) => d.deviceId === prev) ? prev : DEFAULT_CAMERA_ID;
      });
    } catch {}
  }, []);

  useEffect(() => {
    void loadDevices();
    if (!navigator.mediaDevices?.addEventListener) return;

    const onDeviceChange = () => {
      void loadDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
    };
  }, [loadDevices]);

  const startScanner = useCallback(
    async (targetDeviceId?: string) => {
      setCamErr(null);
      setScanning(true);
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { BarcodeFormat, DecodeHintType, NotFoundException } =
          await import("@zxing/library");
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
          BarcodeFormat.QR_CODE,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints);
        const selectedId = targetDeviceId ?? deviceIdRef.current;
        const controls = await reader.decodeFromVideoDevice(
          selectedId === DEFAULT_CAMERA_ID ? undefined : selectedId,
          videoRef.current!,
          (res, err) => {
            if (res) lookup(res.getText());
            if (err && !(err instanceof NotFoundException))
              console.warn("[scanner]", err.message);
          },
        );
        readerRef.current = controls;
        void loadDevices();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setCamErr(
          msg.includes("NotAllowed")
            ? "Camera access denied."
            : `Camera error: ${msg}`,
        );
        setScanning(false);
      }
    },
    [loadDevices, lookup],
  );

  const handleDeviceChange = useCallback(
    async (nextDeviceId: string) => {
      setDeviceId(nextDeviceId);
      if (!scanning) return;
      stopScanner();
      await startScanner(nextDeviceId);
    },
    [scanning, startScanner, stopScanner],
  );

  useEffect(
    () => () => {
      try {
        readerRef.current?.stop();
      } catch {}
    },
    [],
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (e.key === "F1") {
        e.preventDefault();
        scanning ? stopScanner() : startScanner();
      }
      if (e.key === "Escape") {
        setCart([]);
        setFocusedIdx(null);
        setCashInput("");
      }

      if (focusedIdx !== null && cart[focusedIdx]) {
        if (e.key === "+" || e.key === "=") {
          setCart((prev) => {
            const n = [...prev];
            n[focusedIdx] = { ...n[focusedIdx], qty: n[focusedIdx].qty + 1 };
            return n;
          });
        }
        if (e.key === "-") {
          setCart((prev) => {
            const n = [...prev];
            if (n[focusedIdx].qty <= 1) {
              n.splice(focusedIdx, 1);
              setFocusedIdx(null);
            } else
              n[focusedIdx] = { ...n[focusedIdx], qty: n[focusedIdx].qty - 1 };
            return n;
          });
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          setCart((prev) => {
            const n = [...prev];
            n.splice(focusedIdx, 1);
            setFocusedIdx(null);
            return n;
          });
        }
      }
      if (e.key === "Enter" && cart.length > 0 && cashValid) handleCheckout();
      if (e.key === "ArrowDown")
        setFocusedIdx((i) =>
          i === null ? 0 : Math.min(cart.length - 1, i + 1),
        );
      if (e.key === "ArrowUp")
        setFocusedIdx((i) =>
          i === null ? cart.length - 1 : Math.max(0, i - 1),
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scanning, focusedIdx, cart, cashValid]);

  // ── Checkout ──────────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0 || !cashValid) return;
    setChecking(true);
    const saleDate = new Date().toISOString();
    try {
      for (const item of cart) {
        await recordSale({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.qty,
          unit_price: item.product.price,
          unit_cost: item.product.cost,
          total_revenue: item.product.price * item.qty,
          total_cost: item.product.cost * item.qty,
          sold_at: saleDate,
        });
      }
      setReceipt({
        items: [...cart],
        total: cartTotal,
        cash: cashAmt,
        change,
        saleDate,
      });
      setCart([]);
      setFocusedIdx(null);
      setCashInput("");
    } catch (e) {
      alert(`Sale failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setChecking(false);
    }
  };

  // Quick cash button: round up to nearest bill
  const quickCash = (billCents: number) => {
    const bill = billCents / 100;
    const needed = Math.ceil(cartTotal / bill) * bill;
    setCashInput(needed.toFixed(2));
    cashRef.current?.focus();
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-130px)]">
      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col gap-3">
        {/* Camera */}
        <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-[#252836] flex items-center justify-between">
            <span className="font-display text-[13px] font-bold">Camera</span>
            <span className="text-[10px] font-mono text-[#4A5068]">
              F1 to toggle
            </span>
          </div>
          <div className="p-3">
            <div
              className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${scanning ? "border-[#F59E0B]" : "border-[#2E3248] hover:border-[#F59E0B]"}`}
              style={{ height: 150, background: "#000" }}
              onClick={() => (scanning ? stopScanner() : startScanner())}
            >
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: scanning ? 1 : 0 }}
                muted
                playsInline
              />
              {scanning && (
                <>
                  <div
                    className="absolute inset-x-4 h-0.5 bg-[#F59E0B] opacity-80"
                    style={{
                      animation: "scanLine 1.8s ease-in-out infinite",
                      boxShadow: "0 0 8px #F59E0B",
                    }}
                  />
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#F59E0B] rounded-tl-sm" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#F59E0B] rounded-tr-sm" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#F59E0B] rounded-bl-sm" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#F59E0B] rounded-br-sm" />
                </>
              )}
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <Icon d={Icons.scan} size={32} className="text-[#2E3248]" />
                  <span className="text-[10px] text-[#4A5068]">
                    Click or F1
                  </span>
                </div>
              )}
            </div>
            {camErr && (
              <div className="mt-2 text-[11px] text-[#EF4444]">{camErr}</div>
            )}

            {/* Device selector */}
            {devices.length > 1 && (
              <div className="mt-2">
                <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-1">
                  Camera Device
                </div>
                <select
                  value={deviceId}
                  onChange={(e) => void handleDeviceChange(e.target.value)}
                  className="w-full bg-[#0C0E14] border border-[#2E3248] rounded-lg px-2.5 py-2 text-[11px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] font-mono"
                >
                  <option value={DEFAULT_CAMERA_ID}>Default camera</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Manual barcode */}
        <div className="bg-[#13151E] border border-[#252836] rounded-xl p-3 flex-shrink-0">
          <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-2">
            Manual Barcode
          </div>
          <div className="flex gap-2">
            <input
              ref={manualRef}
              className="flex-1 bg-[#0C0E14] border border-[#2E3248] rounded-lg px-3 py-2 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] font-mono"
              placeholder="Type or scan…"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manual.trim()) {
                  lookup(manual.trim());
                  setManual("");
                }
              }}
            />
            <button
              onClick={() => {
                if (manual.trim()) {
                  lookup(manual.trim());
                  setManual("");
                }
              }}
              className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24]"
            >
              Go
            </button>
          </div>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="bg-[#13151E] border border-[#252836] rounded-xl p-3 flex-shrink-0">
            <div className="text-[12px] text-[#EF4444] font-semibold mb-1">
              Barcode not linked
            </div>
            <div className="font-mono text-[11px] text-[#4A5068] mb-2 truncate">
              {lastCode}
            </div>
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-2 rounded-lg text-[12px] font-semibold bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]"
              >
                + Add Product
              </button>
            ) : (
              <AddProductForm
                barcode={lastCode}
                onSave={async (input) => {
                  await createProduct(input);
                  setNotFound(false);
                  setShowAddForm(false);
                  lookup(lastCode);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </div>
        )}

        {/* Keyboard cheatsheet */}
        <div className="bg-[#13151E] border border-[#252836] rounded-xl p-3 flex-shrink-0">
          <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-2">
            Shortcuts
          </div>
          <div className="space-y-1">
            {[
              ["F1", "Camera"],
              ["Enter", "Confirm"],
              ["+ / −", "Qty"],
              ["↑↓", "Select"],
              ["Del", "Remove"],
              ["Esc", "Clear"],
            ].map(([k, d]) => (
              <div
                key={k}
                className="flex items-center justify-between text-[11px]"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-[#1A1D2A] border border-[#2E3248] font-mono text-[#F59E0B] text-[10px]">
                  {k}
                </kbd>
                <span className="text-[#4A5068]">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: Cart ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden flex flex-col flex-1">
          {/* Cart header */}
          <div className="px-5 py-4 border-b border-[#252836] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-display text-[15px] font-bold">Cart</span>
              {cart.length > 0 && (
                <span className="bg-[#F59E0B] text-[#0C0E14] text-[11px] font-bold font-mono px-2 py-0.5 rounded-full">
                  {cartQty}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  setCart([]);
                  setFocusedIdx(null);
                  setCashInput("");
                }}
                className="text-[11px] text-[#EF4444] hover:underline font-mono"
              >
                Esc — Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
                <Icon d={Icons.scan} size={48} className="text-[#2E3248]" />
                <div className="text-[14px] text-[#4A5068]">
                  Scan a barcode to add items
                </div>
                <div className="text-[11px] text-[#2E3248] font-mono">
                  press F1 to start the camera
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#252836]">
                {cart.map((item, idx) => {
                  const focused = idx === focusedIdx;
                  return (
                    <div
                      key={item.product.id}
                      onClick={() => setFocusedIdx(idx)}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all ${focused ? "bg-[rgba(245,158,11,0.08)] border-l-2 border-[#F59E0B]" : "hover:bg-[#1A1D2A] border-l-2 border-transparent"}`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#1A1D2A] border border-[#252836]">
                        {item.product.image_path ? (
                          <ProductImage
                            path={item.product.image_path}
                            name={item.product.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon
                              d={Icons.box}
                              size={16}
                              className="text-[#2E3248]"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#4A5068]">
                          ${item.product.price.toFixed(2)} × {item.qty}
                        </div>
                      </div>
                      <div className="flex items-center bg-[#0C0E14] border border-[#2E3248] rounded-lg overflow-hidden flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCart((prev) => {
                              const n = [...prev];
                              if (n[idx].qty <= 1) {
                                n.splice(idx, 1);
                                setFocusedIdx(null);
                              } else
                                n[idx] = { ...n[idx], qty: n[idx].qty - 1 };
                              return n;
                            });
                          }}
                          className="px-2 py-1.5 text-[#8B90A8] hover:text-white hover:bg-[#1A1D2A] text-[14px]"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-[13px]">
                          {item.qty}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCart((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx], qty: n[idx].qty + 1 };
                              return n;
                            });
                          }}
                          className="px-2 py-1.5 text-[#8B90A8] hover:text-white hover:bg-[#1A1D2A] text-[14px]"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-[14px] font-bold font-mono text-[#F59E0B] w-20 text-right flex-shrink-0">
                        ${(item.product.price * item.qty).toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCart((prev) => {
                            const n = [...prev];
                            n.splice(idx, 1);
                            setFocusedIdx(null);
                            return n;
                          });
                        }}
                        className="p-1.5 rounded bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.1)] text-[#EF4444] flex-shrink-0"
                      >
                        <Icon d={Icons.close} size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Checkout footer ─────────────────────────────────────────────── */}
          <div className="border-t border-[#252836] p-5 flex-shrink-0 bg-[#0C0E14] space-y-4">
            {/* Total */}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-0.5">
                  Total
                </div>
                <div className="text-[34px] font-bold font-mono leading-none">
                  ${cartTotal.toFixed(2)}
                </div>
              </div>
              <div className="text-[12px] text-[#4A5068] font-mono text-right">
                <div>
                  {cart.length} product{cart.length !== 1 ? "s" : ""}
                </div>
                <div>
                  {cartQty} unit{cartQty !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Cash input */}
            <div>
              <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-2">
                Cash Received
              </div>

              {/* Quick bill buttons */}
              <div className="flex gap-1.5 mb-2">
                {BILLS.map((b) => (
                  <button
                    key={b}
                    onClick={() => quickCash(b)}
                    disabled={cart.length === 0}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-bold font-mono bg-[#1A1D2A] border border-[#2E3248] text-[#8B90A8] hover:text-[#F59E0B] hover:border-[rgba(245,158,11,0.3)] disabled:opacity-30 transition-all"
                  >
                    ${b / 100}
                  </button>
                ))}
              </div>

              {/* Cash input field */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A5068] font-mono text-[14px]">
                  $
                </span>
                <input
                  ref={cashRef}
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full bg-[#13151E] border-2 rounded-xl pl-8 pr-4 py-3 text-[20px] font-bold font-mono outline-none transition-all ${
                    cashAmt === 0
                      ? "border-[#2E3248] text-[#E8EAF0]"
                      : cashValid
                        ? "border-[#10B981] text-[#10B981]"
                        : "border-[#EF4444] text-[#EF4444]"
                  }`}
                  placeholder="0.00"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  disabled={cart.length === 0}
                />
              </div>

              {/* Change display */}
              {cashAmt > 0 && (
                <div
                  className={`mt-2 flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
                    cashValid
                      ? "bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)]"
                      : "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]"
                  }`}
                >
                  <span
                    className={`text-[13px] font-semibold ${cashValid ? "text-[#8B90A8]" : "text-[#EF4444]"}`}
                  >
                    {cashValid
                      ? "Change"
                      : `Short $${(cartTotal - cashAmt).toFixed(2)}`}
                  </span>
                  {cashValid && (
                    <span className="text-[24px] font-bold font-mono text-[#F59E0B]">
                      ${change.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Confirm button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || !cashValid || checking}
              className="w-full py-4 rounded-xl text-[15px] font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40 bg-[#10B981] text-white hover:bg-[#059669]"
            >
              {checking ? (
                "Processing…"
              ) : (
                <>
                  <Icon d={Icons.check} size={18} /> Confirm Sale — Enter
                </>
              )}
            </button>

            {cart.length > 0 && !cashValid && cashAmt === 0 && (
              <div className="text-center text-[11px] text-[#4A5068] font-mono -mt-2">
                Enter cash amount above to confirm
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}

      <style>{`
        @keyframes scanLine {
          0%   { top: 15%; }
          50%  { top: 80%; }
          100% { top: 15%; }
        }
      `}</style>
    </div>
  );
}
