import { useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'
import { Truck } from 'lucide-react'

export default function SplashExpedicao() {
    const { navigateTo, refreshData } = useApp()

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-bg-primary animate-fade-in">
            {/* Logo area */}
            <div className="relative mb-10">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-warning/20 to-danger/20 flex items-center justify-center border border-warning/20">
                    <Truck size={48} className="text-warning" />
                </div>
                <div className="absolute -inset-4 rounded-[2rem] border border-warning/10 animate-pulse-glow" style={{ '--tw-shadow-color': 'rgba(210,153,34,0.4)' } as React.CSSProperties} />
            </div>

            {/* Branding */}
            <p className="text-text-secondary text-sm font-medium tracking-widest uppercase mb-2">TCL SEMP</p>
            <h1 className="text-3xl font-bold text-text-primary mb-2 text-center">Sistema de</h1>
            <h1 className="text-3xl font-bold text-warning mb-8 text-center">Expedição</h1>
            <p className="text-text-secondary text-sm text-center max-w-[260px] mb-12">
                Conferência e Expedição de Veículos
            </p>

            {/* Enter button */}
            <button
                onClick={() => {
                    refreshData()
                    navigateTo(Screen.EXPEDICAO_LIST)
                }}
                className="w-full max-w-[280px] py-4 rounded-2xl bg-[#ED7D31] text-white font-semibold text-base tracking-wide hover:brightness-110 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-warning/20"
            >
                Entrar
            </button>

            {/* Back link */}
            <button
                onClick={() => navigateTo(Screen.MENU)}
                className="mt-6 px-5 py-2.5 bg-[#F1B00F]/10 text-[#F1B00F] hover:bg-[#F1B00F] hover:text-white text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
                Voltar ao Menu
            </button>
        </div>
    )
}
