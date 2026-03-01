import { useApp } from '@/contexts/AppContext'
import { ArrowLeft } from 'lucide-react'

interface HeaderProps {
    title: string
    showBack?: boolean
    onBack?: () => void
}

export default function Header({ title, showBack = true, onBack }: HeaderProps) {
    const { goBack } = useApp()

    return (
        <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-bg-secondary/80 backdrop-blur-lg border-b border-border">
            {showBack && (
                <button
                    onClick={onBack || goBack}
                    className="touch-target flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft size={22} className="text-text-primary" />
                </button>
            )}
            <h1 className="text-lg font-semibold text-text-primary truncate">{title}</h1>
        </header>
    )
}
