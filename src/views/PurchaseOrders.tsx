// src/views/PurchaseOrders.tsx
import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { Badge } from "@/components/ui/Badge";
import { Icon, Icons } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { PurchaseOrder, PurchaseOrderItem } from "@/types";

const STATUS_COLORS: Record<
  string,
  "amber" | "blue" | "green" | "gray" | "red"
> = {
  draft: "gray",
  sent: "blue",
  partial: "amber",
  received: "green",
  cancelled: "red",
};

const STATUS_OPTIONS = ["draft", "sent", "partial", "received", "cancelled"];

// ── New Order Modal ───────────────────────────────────────────────────────────
function NewOrderModal({
  suppliers,
  products,
  onClose,
  onCreate,
}: {
  suppliers: { id: number; name: string }[];
  products: { id: number; name: string; cost: number }[];
  onClose: () => void;
  onCreate: (
    order: {
      supplier_id: number | null;
      notes: string | null;
      expected_at: string | null;
    },
    items: {
      product_id: number | null;
      product_name: string;
      quantity_ordered: number;
      unit_cost: number;
    }[],
  ) => Promise<void>;
}) {
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [items, setItems] = useState<
    { pid: number | ""; name: string; qty: number; cost: number }[]
  >([{ pid: "", name: "", qty: 1, cost: 0 }]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addItem = () =>
    setItems((i) => [...i, { pid: "", name: "", qty: 1, cost: 0 }]);
  const removeItem = (idx: number) =>
    setItems((i) => i.filter((_, j) => j !== idx));
  const setItem = (idx: number, k: string, v: unknown) =>
    setItems((i) =>
      i.map((item, j) => (j === idx ? { ...item, [k]: v } : item)),
    );

  const handleProductPick = (idx: number, pid: number | "") => {
    const p = products.find((p) => p.id === Number(pid));
    setItems((i) =>
      i.map((item, j) =>
        j === idx
          ? {
              ...item,
              pid,
              name: p?.name ?? item.name,
              cost: p?.cost ?? item.cost,
            }
          : item,
      ),
    );
  };

  const handleSave = async () => {
    if (items.every((i) => !i.name.trim())) {
      setErr("Add at least one item");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onCreate(
        {
          supplier_id: supplierId ? Number(supplierId) : null,
          notes: notes || null,
          expected_at: expectedAt || null,
        },
        items
          .filter((i) => i.name.trim())
          .map((i) => ({
            product_id: i.pid ? Number(i.pid) : null,
            product_name: i.name,
            quantity_ordered: i.qty,
            unit_cost: i.cost,
          })),
      );
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const inp =
    "w-full bg-[#0C0E14] border border-[#2E3248] rounded-lg px-3 py-2 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B]";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#13151E] border border-[#2E3248] rounded-2xl p-7 w-[620px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[18px] font-bold">
            New Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-white"
          >
            ✕
          </button>
        </div>
        {err && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-[12px]">
            {err}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Supplier
            </label>
            <select
              className={inp}
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Expected Delivery
            </label>
            <input
              type="date"
              className={inp}
              value={expectedAt}
              onChange={(e) => setExpectedAt(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Notes
            </label>
            <input
              className={inp}
              placeholder="e.g. Urgent restock, standard delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Items */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] tracking-widest uppercase text-[#4A5068] font-mono">
              Order Items
            </label>
            <button
              onClick={addItem}
              className="text-[11px] text-[#F59E0B] hover:underline"
            >
              + Add item
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center"
              >
                <select
                  className={inp}
                  value={item.pid}
                  onChange={(e) =>
                    handleProductPick(
                      idx,
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                >
                  <option value="">Custom item…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {!item.pid && (
                  <input
                    className={inp}
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => setItem(idx, "name", e.target.value)}
                  />
                )}
                {item.pid && (
                  <div className="text-[12px] text-[#8B90A8] truncate px-1">
                    {item.name}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    className={inp}
                    style={{ width: 64 }}
                    value={item.qty}
                    onChange={(e) =>
                      setItem(idx, "qty", parseInt(e.target.value) || 1)
                    }
                  />
                  <span className="text-[11px] text-[#4A5068]">×</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inp}
                    style={{ width: 80 }}
                    value={item.cost}
                    placeholder="Cost"
                    onChange={(e) =>
                      setItem(idx, "cost", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="p-1.5 rounded text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-right text-[12px] font-mono text-[#8B90A8]">
            Total:{" "}
            <span className="text-[#F59E0B] font-bold">
              ${items.reduce((s, i) => s + i.qty * i.cost, 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-2.5 justify-end pt-4 border-t border-[#252836]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#2E3248] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Detail Panel ────────────────────────────────────────────────────────
function OrderDetail({
  order,
  items,
  onStatusChange,
  onReceiveItem,
  onClose,
}: {
  order: PurchaseOrder;
  items: PurchaseOrderItem[];
  onStatusChange: (id: number, status: string) => Promise<void>;
  onReceiveItem: (itemId: number, qty: number) => Promise<void>;
  onClose: () => void;
}) {
  const [receivingId, setReceivingId] = useState<number | null>(null);
  const [receiveQty, setReceiveQty] = useState(1);

  const handleReceive = async (item: PurchaseOrderItem) => {
    await onReceiveItem(item.id, receiveQty);
    setReceivingId(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#13151E] border border-[#2E3248] rounded-2xl p-7 w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-[18px] font-bold">
              PO #{order.id}
            </h2>
            <div className="text-[12px] text-[#8B90A8] mt-0.5">
              {order.supplier_name ?? "No supplier"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Status */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(order.id, s)}
              className={`px-3 py-1 rounded-md text-[11px] font-mono font-semibold border capitalize transition-all ${
                order.status === s
                  ? "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]"
                  : "bg-[#1A1D2A] text-[#8B90A8] border-[#252836] hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="bg-[#0C0E14] rounded-xl overflow-hidden border border-[#252836]">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                {["Product", "Ordered", "Received", "Cost", ""].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[10px] tracking-widest uppercase text-[#4A5068] font-mono border-b border-[#252836] font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#13151E] transition-colors"
                >
                  <td className="px-3 py-2.5 border-b border-[#252836] font-medium">
                    {item.product_name}
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#252836] font-mono">
                    {item.quantity_ordered}
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#252836]">
                    <span
                      className={`font-mono font-bold ${item.quantity_received >= item.quantity_ordered ? "text-[#10B981]" : item.quantity_received > 0 ? "text-[#F59E0B]" : "text-[#8B90A8]"}`}
                    >
                      {item.quantity_received}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#252836] font-mono text-[#8B90A8]">
                    ${Number(item.unit_cost).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#252836]">
                    {item.quantity_received < item.quantity_ordered &&
                      order.status !== "cancelled" &&
                      (receivingId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max={item.quantity_ordered - item.quantity_received}
                            value={receiveQty}
                            onChange={(e) =>
                              setReceiveQty(parseInt(e.target.value) || 1)
                            }
                            className="w-14 bg-[#1A1D2A] border border-[#2E3248] rounded px-2 py-1 text-[12px] font-mono text-center outline-none focus:border-[#F59E0B]"
                          />
                          <button
                            onClick={() => handleReceive(item)}
                            className="px-2 py-1 rounded text-[11px] bg-[#10B981] text-white font-semibold"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setReceivingId(null)}
                            className="px-2 py-1 rounded text-[11px] bg-[#1A1D2A] text-[#8B90A8]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReceivingId(item.id);
                            setReceiveQty(
                              item.quantity_ordered - item.quantity_received,
                            );
                          }}
                          className="text-[11px] px-2.5 py-1 rounded bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)] hover:bg-[rgba(16,185,129,0.2)] font-semibold"
                        >
                          Receive
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-right text-[12px] font-mono text-[#8B90A8]">
          Total:{" "}
          <span className="text-[#F59E0B] font-bold text-[14px]">
            ${Number(order.total_cost).toFixed(2)}
          </span>
        </div>
        {order.notes && (
          <p className="mt-3 text-[12px] text-[#4A5068] italic">
            {order.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function PurchaseOrders() {
  const {
    suppliers,
    products,
    purchaseOrders,
    orderItems,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    addOrderItem,
    receiveOrderItem,
    deleteOrder,
  } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [delTarget, setDelTarget] = useState<PurchaseOrder | null>(null);

  const supplierList = suppliers.map((s) => ({ id: s.id, name: s.name }));
  const productList = products.map((p) => ({
    id: p.id,
    name: p.name,
    cost: p.cost,
  }));

  const handleCreate = async (
    orderInput: {
      supplier_id: number | null;
      notes: string | null;
      expected_at: string | null;
    },
    items: {
      product_id: number | null;
      product_name: string;
      quantity_ordered: number;
      unit_cost: number;
    }[],
  ) => {
    const order = await createOrder(orderInput);
    if (order && items.length > 0) {
      for (const item of items) {
        await addOrderItem({ purchase_order_id: order.id, ...item });
      }
      await fetchOrders();
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await updateOrderStatus(id, status);
    if (detailOrder?.id === id) {
      const updated = purchaseOrders.find((o: any) => o.id === id);
      if (updated) setDetailOrder(updated);
    }
  };

  const handleReceive = async (itemId: number, qty: number) => {
    await receiveOrderItem(itemId, qty);
    await fetchOrders();
  };

  const statusFilter = (s: string) =>
    purchaseOrders.filter((o: any) => o.status === s);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-3 text-[12px] font-mono text-[#4A5068]">
          {["draft", "sent", "partial", "received", "cancelled"].map((s) => (
            <span key={s}>
              {statusFilter(s).length} {s}
            </span>
          ))}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] transition-all"
        >
          <Icon d={Icons.plus} size={14} /> New Order
        </button>
      </div>

      {/* Orders table */}
      <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
        {purchaseOrders.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#4A5068]">
            No purchase orders yet. Create one to track orders to your
            suppliers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr>
                  {[
                    "PO #",
                    "Supplier",
                    "Status",
                    "Items",
                    "Total",
                    "Expected",
                    "Created",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3.5 py-3 text-left text-[10px] tracking-widest uppercase text-[#4A5068] font-mono border-b border-[#252836] font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-[#1A1D2A] transition-colors group cursor-pointer"
                    onClick={() => {
                      setDetailOrder(o);
                    }}
                  >
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      <span className="font-mono font-bold">#{o.id}</span>
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      {o.supplier_name ?? (
                        <span className="text-[#4A5068]">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      <Badge variant={STATUS_COLORS[o.status] ?? "gray"}>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836] font-mono text-[#8B90A8]">
                      {o.items_count}
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836] font-mono font-bold">
                      ${Number(o.total_cost).toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836] text-[12px] text-[#8B90A8]">
                      {o.expected_at
                        ? new Date(o.expected_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836] text-[12px] text-[#8B90A8]">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDelTarget(o);
                        }}
                        className="p-1.5 rounded bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon d={Icons.trash} size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNew && (
        <NewOrderModal
          suppliers={supplierList}
          products={productList}
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}

      {detailOrder && (
        <OrderDetail
          order={detailOrder}
          items={orderItems[detailOrder.id] ?? []}
          onStatusChange={handleStatusChange}
          onReceiveItem={handleReceive}
          onClose={() => setDetailOrder(null)}
        />
      )}

      {delTarget && (
        <ConfirmDialog
          title="Delete Purchase Order"
          message={`Delete PO #${delTarget.id}? All items will also be deleted.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteOrder(delTarget.id);
            setDelTarget(null);
          }}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}
