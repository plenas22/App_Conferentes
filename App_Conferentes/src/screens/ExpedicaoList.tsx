import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'
import type { ExpedicaoStatus } from '@/types'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import { AlertCircle, CheckCircle2, Clock, TruckIcon, Loader2, Building2, RefreshCw } from 'lucide-react'

type Filter = 'todos' | 'expedidos' | 'aguardando'

const FILTER_OPTIONS: { label: string; value: Filter }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Expedidos', value: 'expedidos' },
    { label: 'Aguardando', value: 'aguardando' },
]

function mapExpStatus(supabaseStatus: string): ExpedicaoStatus {
    const s = supabaseStatus.toLowerCase()
    if (s === 'expedido' || s === 'concluído' || s === 'concluido') return 'expedido'
    if (s === 'em conferência' || s === 'em conferencia' || s === 'em_conferencia' || s === 'em andamento') return 'em_conferencia'
    return 'aguardando'
}

const STATUS_CONFIG: Record<ExpedicaoStatus, { label: string; icon: typeof Clock; color: string }> = {
    aguardando: { label: 'Aguardando', icon: Clock, color: 'text-white' },
    em_conferencia: { label: 'Em Conferência', icon: AlertCircle, color: 'text-[#ED7D31]' },

    expedido: { label: 'Expedido', icon: CheckCircle2, color: 'text-success' },
}

function getPriorityColor(priority: number): string {
    switch (priority) {
        case 1:
            return 'text-red-500' // Urgente
        case 2:
            return 'text-orange-500' // Alta
        case 3:
            return 'text-yellow-500' // Média
        case 4:
            return 'text-blue-500' // Baixa
        default:
            return 'text-green-500' // Normal/Baixa
    }
}

export default function ExpedicaoList() {
    const { navigateTo, setSelectedExpedicaoId, expedicaoStatuses, programacaoOut, isLoading, refreshData } = useApp()
    const [filter, setFilter] = useState<Filter>('todos')
    const [search, setSearch] = useState('')
    const [refreshing, setRefreshing] = useState(false)

    // Map programacao_out to expedition-like objects
    const expedicoes = programacaoOut.map((p) => ({
        id: p.id,
        cliente: p.cliente,
        dt: p.transporte,
        prioridade: p.prioridade,
        produto: p.produto,
        veiculo: p.veiculo,
        volume: p.volume,
        status: mapExpStatus(p.status),
    }))

    const filtered = expedicoes
        .filter((exp) => {
            const currentStatus = expedicaoStatuses[exp.id] ?? exp.status
            if (filter === 'expedidos' && currentStatus !== 'expedido') return false
            if (filter === 'aguardando' && currentStatus !== 'aguardando') return false
            if (search) {
                const q = search.toLowerCase()
                if (!exp.cliente.toLowerCase().includes(q) && !exp.dt.toLowerCase().includes(q)) return false
            }
            return true
        })
        .sort((a, b) => {
            const statusOrder = { expedido: 0, em_conferencia: 1, aguardando: 2 }
            const statusA = expedicaoStatuses[a.id] ?? a.status
            const statusB = expedicaoStatuses[b.id] ?? b.status
            return statusOrder[statusA] - statusOrder[statusB]
        })

    function handleCardClick(expId: string) {
        setSelectedExpedicaoId(expId)
        navigateTo(Screen.EXPEDICAO_FORM)
    }

    async function handleRefresh() {
        setRefreshing(true)
        await refreshData()
        setRefreshing(false)
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-primary">
            <Header title="Expedição" onBack={() => navigateTo(Screen.MENU)} />

            <div className="px-4 pt-5 pb-2 space-y-3">
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar Cliente ou DT..." />

                {/* Filter chips + Refresh button */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {FILTER_OPTIONS.map((opt) => {
                            const isActive = opt.value === filter
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilter(opt.value)}
                                    className={`touch-target shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActive
                                        ? 'bg-[#ED7D31]/15 border-[#ED7D31] text-[#ED7D31]'
                                        : 'bg-bg-card border-border text-text-white hover:border-text-muted'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || isLoading}
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-bg-card border border-border text-text-secondary hover:border-[#ED7D31]/40 hover:text-[#ED7D31] transition-all duration-200 active:scale-95 disabled:opacity-50"
                        title="Atualizar"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Expedição list */}
            <div className="flex-1 px-4 pb-6 overflow-y-auto space-y-3 stagger-children">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                        <Loader2 size={32} className="animate-spin mb-3 opacity-60" />
                        <p className="text-sm">Carregando expedições...</p>
                    </div>
                )}

                {!isLoading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                        <TruckIcon size={40} className="mb-3 opacity-40" />
                        <p className="text-sm">Nenhuma expedição encontrada</p>
                    </div>
                )}

                {!isLoading && filtered.map((exp) => {
                    const currentStatus = expedicaoStatuses[exp.id] ?? exp.status
                    const status = STATUS_CONFIG[currentStatus]
                    const StatusIcon = status.icon
                    const priorityColor = getPriorityColor(exp.prioridade)

                    return (
                        <button
                            key={exp.id}
                            onClick={() => handleCardClick(exp.id)}
                            className="w-full text-left p-6 px-5 rounded-2xl bg-bg-card border border-border hover:border-text-muted/30 transition-all duration-200 active:scale-[0.98]"
                        >

                            {/* Row 1: Cliente with Icon */}
                            <div className="flex items-center gap-2 mb-2.5">

                                <Building2 size={22} className={currentStatus === 'em_conferencia' ? 'text-[#ED7D31]' : currentStatus === 'expedido' ? 'text-success' : 'text-[#ffffff]'} />
                                <h3 className={`text-[16px] font-bold truncate ${currentStatus === 'em_conferencia' ? 'text-[#ED7D31]' : currentStatus === 'expedido' ? 'text-success' : 'text-text-primary'}`}>
                                    {exp.cliente}
                                </h3>
                            </div>

                            {/* Row 2: DT + Prioridade + Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium ${currentStatus === 'expedido' ? 'text-success' :
                                        currentStatus === 'em_conferencia' ? 'text-[#ED7D31]' :
                                            'text-text-secondary'
                                        }`}>
                                        DT: {exp.dt}
                                    </span>
                                    <span className={`text-[14px] font-medium ${priorityColor}`}>
                                        Prioridade {exp.prioridade}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-1.5 text-[12px] font-semibold ${status.color}`}>
                                    <StatusIcon size={16} />
                                    <span>{status.label}</span>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
