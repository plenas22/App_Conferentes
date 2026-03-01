import { useApp } from '@/contexts/AppContext'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ICON_MAP = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
} as const

const COLOR_MAP = {
    success: 'border-success bg-success/10 text-success',
    error: 'border-danger bg-danger/10 text-danger',
    info: 'border-accent bg-accent/10 text-accent',
} as const

export default function ToastContainer() {
    const { toasts, removeToast } = useApp()

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100%-32px)] max-w-[448px]">
            {toasts.map((toast) => {
                const Icon = ICON_MAP[toast.type]
                return (
                    <div
                        key={toast.id}
                        className={`animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl border ${COLOR_MAP[toast.type]}`}
                        style={{ background: 'rgba(28,33,40,0.97)' }}
                    >
                        <Icon size={20} className="shrink-0" />
                        <span className="text-sm font-medium text-text-primary flex-1">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
