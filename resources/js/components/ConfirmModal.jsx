import React from 'react';
import { AlertTriangle, Trash2, CheckCircle, Info, XCircle } from 'lucide-react';

const iconMap = {
  success: { Icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  warning: { Icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-500' },
  delete:  { Icon: Trash2, bg: 'bg-red-50', text: 'text-red-600' },
  confirm: { Icon: Info, bg: 'bg-blue-50', text: 'text-blue-600' },
  error:   { Icon: XCircle, bg: 'bg-red-50', text: 'text-red-600' },
};

const colorMap = {
  green:  { btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', ring: 'ring-emerald-300' },
  blue:   { btn: 'bg-blue-600 hover:bg-blue-700 text-white', ring: 'ring-blue-300' },
  red:    { btn: 'bg-red-600 hover:bg-red-700 text-white', ring: 'ring-red-300' },
  orange: { btn: 'bg-amber-500 hover:bg-amber-600 text-white', ring: 'ring-amber-300' },
};

/**
 * ConfirmModal - Reusable Confirmation Modal for UMKM Role
 *
 * Props:
 * - isOpen: boolean
 * - onConfirm: () => void
 * - onCancel: () => void
 * - type: 'success' | 'warning' | 'delete' | 'confirm' | 'error'
 * - title: string
 * - message: string (can include <strong> HTML)
 * - confirmText: string
 * - cancelText: string
 * - confirmColor: 'green' | 'blue' | 'red' | 'orange'
 * - highlightCancel: boolean (makes cancel button blue/primary to prevent accidents)
 */
export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  type = 'confirm',
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmColor = 'blue',
  highlightCancel = false,
}) {
  if (!isOpen) return null;

  const { Icon, bg, text } = iconMap[type] || iconMap.confirm;
  const { btn, ring } = colorMap[confirmColor] || colorMap.blue;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-7 w-7 ${text}`} />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-lg font-bold text-[#0F172A] leading-tight">
          {title}
        </h2>

        {/* Message */}
        <p
          className="mb-6 text-center text-sm leading-relaxed text-[#475569]"
          dangerouslySetInnerHTML={{ __html: message }}
        />

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${btn} ${ring}`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 rounded-xl border py-2.5 px-4 text-sm font-semibold transition-all duration-200 focus:outline-none
              ${highlightCancel
                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                : 'border-slate-200 bg-white text-[#475569] hover:bg-slate-50'
              }`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
