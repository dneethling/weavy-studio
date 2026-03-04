import { useToastStore } from '../../store/useToastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  error: <AlertCircle size={16} className="text-red-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
};

const borders = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2 px-3 py-2.5 bg-zinc-900 border ${borders[toast.type]} rounded-lg shadow-xl animate-in slide-in-from-right`}
        >
          {icons[toast.type]}
          <p className="text-sm text-zinc-200 flex-1 break-words">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-500 hover:text-zinc-300 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
