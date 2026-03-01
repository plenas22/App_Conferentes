import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    open: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    width?: string
}

export default function Modal({ open, onClose, title, children, width = 'max-w-[400px]' }: ModalProps) {
    /* Lock scroll when modal is open */
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-bg-overlay" />

            {/* Content */}
            <div
                className={`animate-scale-in relative glass-dark rounded-2xl border border-border ${width} w-full shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-5 pt-5 pb-2">
                        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                        <button
                            onClick={onClose}
                            className="touch-target flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <X size={20} className="text-text-secondary" />
                        </button>
                    </div>
                )}

                <div className={title ? 'px-5 pb-5' : 'p-5'}>
                    {children}
                </div>
            </div>
        </div>
    )
}
