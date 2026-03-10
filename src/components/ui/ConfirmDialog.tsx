// src/components/ui/ConfirmDialog.tsx

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200]"
      style={{ animation: "fadeIn 0.15s" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="bg-[#13151E] border border-[#2E3248] rounded-2xl p-7 w-[400px] max-w-[95vw]"
        style={{ animation: "slideUp 0.2s" }}
      >
        <div className="font-display text-[18px] font-bold mb-3">{title}</div>
        <p className="text-[13px] text-[#8B90A8] leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#2E3248] hover:text-[#E8EAF0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              danger
                ? "bg-[rgba(239,68,68,0.12)] text-[#EF4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)]"
                : "bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
