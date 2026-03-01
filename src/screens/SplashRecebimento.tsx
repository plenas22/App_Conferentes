import { useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'
import { Package } from 'lucide-react'

export default function SplashRecebimento() {
    const { navigateTo, refreshData } = useApp()

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-bg-primary animate-fade-in">
            {/* Logo area */}
            <div className="relative mb-10">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent/20 to-success/20 flex items-center justify-center border border-accent/20">
                    <Package size={48} className="text-accent" />
                </div>
                <div className="absolute -inset-4 rounded-[2rem] border border-accent/10 animate-pulse-glow" />
            </div>

            {/* Branding */}
            <p className="text-text-secondary text-sm font-medium tracking-widest uppercase mb-2">TCL SEMP</p>
            <h1 className="text-3xl font-bold text-text-primary mb-2 text-center">Sistema de</h1>
            <h1 className="text-3xl font-bold text-accent mb-8 text-center">Recebimento</h1>
            <p className="text-text-secondary text-sm text-center max-w-[260px] mb-12">
                Conferência e Recebimento de Containers
            </p>

            {/* Enter button */}
            <button
                onClick={() => {
                    refreshData()
                    navigateTo(Screen.RECEBIMENTO_LIST)
                }}
                className="w-full max-w-[280px] py-4 rounded-2xl bg-accent text-white font-semibold text-base tracking-wide hover:bg-accent-hover active:scale-[0.97] transition-all duration-200 shadow-lg shadow-accent/20"
            >
                Entrar
            </button>

            {/* Back link */}
            <button
                onClick={() => navigateTo(Screen.MENU)}
                className="mt-6 px-5 py-2.5 bg-[#00B050]/10 text-[#00B050] hover:bg-[#00B050] hover:text-white text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
                ← Voltar ao Menu
            </button>
        </div>
    )
}
