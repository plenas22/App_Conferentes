import { useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'
import { Package, Truck } from 'lucide-react'
// Importa o arquivo que está na raiz da pasta src
import logoLogistica from '../logo-footer.png'

export default function MenuPrincipal() {
    const { navigateTo, programacaoIn, programacaoOut } = useApp()

    const dataBrasil = new Date();
    dataBrasil.setHours(dataBrasil.getHours() - 3);
    const hojeStr = dataBrasil.toISOString().split('T')[0];

    const totalRecebimentoHoje = programacaoIn.filter((p) => {
        const dataItem = String(p.data_programada || '').split('T')[0];
        return dataItem === hojeStr;
    }).length;

    const totalExpedicaoHoje = programacaoOut.filter((e) => {
        const dataItem = String(e.data_programada || '').split('T')[0];
        return dataItem === hojeStr;
    }).length;

    return (
        <div className="flex flex-col min-h-screen bg-bg-primary animate-fade-in">
            {/* Header — TCL SEMP Branding */}
            <div className="pt-40 pb-2 px-6 text-center">
                <h1
                    className="text-[2rem] font-black tracking-wide text-white leading-tight"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                    TCL SEMP
                </h1>
                <div className="w-48 h-[3px] bg-[#b30000] mx-auto mt-2 rounded-full" />
                <p
                    className="text-[#b30000] text-sm font-extrabold tracking-wide mt-3"
                    style={{ fontStyle: 'italic' }}
                >
                    Time to GO BIG
                </p>
            </div>

            {/* Módulos */}
            <div className="flex-1 px-5 pb-8 flex flex-col justify-start pt-12 gap-4 stagger-children">
                <div className="text-center mb-2 mt-6">
                    <h2 className="text-xl font-bold text-text-primary">App Conferentes</h2>
                    <p className="text-text-secondary text-sm mt-1">Selecione o módulo</p>
                </div>

                {/* Card Recebimento */}
                <button
                    onClick={() => navigateTo(Screen.SPLASH_RECEBIMENTO)}
                    className="group relative w-full p-5 rounded-2xl bg-bg-card border border-border hover:border-accent/40 transition-all duration-300 text-left active:scale-[0.98]"
                >
                    <div className="flex items-start gap-4">
                        {/* Aumentado o container do ícone para w-14 h-14 */}
                        <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                            {/* Ícone aumentado para size={28} */}
                            <Package size={28} className="text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-semibold text-text-primary">Recebimento</h3>
                                {totalRecebimentoHoje > 0 && (
                                    /* Badge aumentado: px-3 py-1 e text-sm */
                                    <span className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-bold shadow-sm">
                                        {totalRecebimentoHoje}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Conferência de Recebimentos de Containers
                            </p>
                        </div>
                    </div>
                </button>

                {/* Card Expedição */}
                <button
                    onClick={() => navigateTo(Screen.SPLASH_EXPEDICAO)}
                    className="group relative w-full p-5 rounded-2xl bg-bg-card border border-border hover:border-warning/40 transition-all duration-300 text-left active:scale-[0.98]"
                >
                    <div className="flex items-start gap-4">
                        {/* Aumentado o container do ícone para w-14 h-14 */}
                        <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center shrink-0 group-hover:bg-warning/20 transition-colors">
                            {/* Ícone aumentado para size={28} */}
                            <Truck size={28} className="text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-semibold text-text-primary">Expedição</h3>
                                {totalExpedicaoHoje > 0 && (
                                    /* Badge aumentado: px-3 py-1 e text-sm */
                                    <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-bold shadow-sm">
                                        {totalExpedicaoHoje}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Conferência e Expedição de Veículos
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Footer */}
            <div className="pb-6 flex items-center justify-center gap-[8px]">
                {/* Imagem do logo verde de logística da TCL SEMP */}
                <img
                    src={logoLogistica}
                    alt="Logo Logística"
                    className="w-[18px] h-[18px] object-contain opacity-80"
                />

                <p className="text-text-muted text-[11px] font-medium">
                    v1.0.0 — by Elias Plenas
                </p>
            </div>
        </div>
    )
}