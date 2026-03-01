import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'
import Header from '@/components/Header'
import FilterChips from '@/components/FilterChips'
import SearchBar from '@/components/SearchBar'
import Modal from '@/components/Modal'
import { Clock, CheckCircle, Ban, FileText, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'

type Filter = 'todos' | 'aguardando' | 'conferidos'

const FILTER_OPTIONS: { label: string; value: Filter }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Aguardando', value: 'aguardando' },
    { label: 'Conferidos', value: 'conferidos' },
]

type ContainerStatus = 'aguardando' | 'conferido' | 'cancelado'

function mapStatus(supabaseStatus: string): ContainerStatus {
    const s = supabaseStatus.toLowerCase()
    if (s === 'concluído' || s === 'concluido' || s === 'conferido') return 'conferido'
    if (s === 'cancelado') return 'cancelado'
    return 'aguardando' // Programado, Em Andamento, etc.
}

const STATUS_CONFIG: Record<ContainerStatus, { icon: typeof Clock; color: string; label: string }> = {
    aguardando: { icon: Clock, color: 'text-white', label: 'Aguardando' },
    conferido: { icon: CheckCircle, color: 'text-success', label: 'Verificado' },
    cancelado: { icon: Ban, color: 'text-danger', label: 'Cancelado' },
}


export default function RecebimentoList() {
    const {
        navigateTo,
        setSelectedContainerId,
        setNfCount,
        setCurrentNfIndex,
        showToast,
        programacaoIn,
        inboundItems,
        isLoading,
        refreshData,
        updateFieldMemory
    } = useApp()


    const [filter, setFilter] = useState<Filter>('todos')
    const [search, setSearch] = useState('')
    const [refreshing, setRefreshing] = useState(false)
    const [blockedModal, setBlockedModal] = useState(false)
    const [nfModal, setNfModal] = useState(false)
    const [nfInput, setNfInput] = useState('')
    const [pendingContainerId, setPendingContainerId] = useState<string | null>(null)

    // Map programacao_in data to container-like objects
    const containers = programacaoIn.map((p) => {
        const relatedItems = inboundItems.filter(item => item.container_id === p.container)
        const nfs = relatedItems.map(i => i.nota_fiscal).filter(Boolean)
        return {
            id: p.container,
            programacaoId: p.id,
            status: mapStatus(p.status),
            origem: p.origem,
            dataProgramada: p.data_programada,
            nfs
        }
    })


    const filtered = containers
        .filter((c) => {
            if (filter === 'aguardando' && c.status !== 'aguardando') return false
            if (filter === 'conferidos' && c.status !== 'conferido') return false
            if (search && !c.id.toLowerCase().includes(search.toLowerCase())) return false
            return true
        })
        .sort((a, b) => {
            const statusOrder = { conferido: 0, aguardando: 1, cancelado: 2 }
            return statusOrder[a.status] - statusOrder[b.status]
        })

    function handleCardClick(containerId: string, status: ContainerStatus) {
        if (status === 'cancelado') {
            setBlockedModal(true)
            return
        }
        if (status === 'conferido') {
            // Edit mode: open form with existing data
            setSelectedContainerId(containerId)
            setNfCount(1)
            setCurrentNfIndex(0)
            navigateTo(Screen.RECEBIMENTO_FORM)
            return
        }
        /* Aguardando → open NF count modal */
        setPendingContainerId(containerId)
        setNfInput('')
        setNfModal(true)
    }

    function handleNfSubmit() {
        const count = parseInt(nfInput)
        if (!count || count < 1 || count > 20) {
            showToast('Informe entre 1 e 20 NFs', 'error')
            return
        }

        // Reset field memory whenever starting a NEW container
        updateFieldMemory({
            doca: '',
            conferente: '',
            horaInicio: '',
            horaFim: '',
        })

        setSelectedContainerId(pendingContainerId)
        setNfCount(count)
        setCurrentNfIndex(0)
        setNfModal(false)
        navigateTo(Screen.RECEBIMENTO_FORM)
    }

    async function handleRefresh() {
        setRefreshing(true)
        await refreshData()
        setRefreshing(false)
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-primary">
            <Header title="Lista de Containers" onBack={() => navigateTo(Screen.MENU)} />


            <div className="px-4 pt-4 pb-2 space-y-3">
                <SearchBar value={search} onChange={setSearch} placeholder="Filtrar container..." />
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <FilterChips options={FILTER_OPTIONS} active={filter} onChange={setFilter} />
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || isLoading}
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-bg-card border border-border text-text-secondary hover:border-accent/40 hover:text-accent transition-all duration-200 active:scale-95 disabled:opacity-50"
                        title="Atualizar"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Container list */}
            <div className="flex-1 px-4 pb-6 overflow-y-auto space-y-5 stagger-children">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                        <Loader2 size={32} className="animate-spin mb-3 opacity-60" />
                        <p className="text-sm">Carregando containers...</p>
                    </div>
                )}

                {!isLoading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                        <FileText size={40} className="mb-3 opacity-40" />
                        <p className="text-sm">Nenhum container encontrado</p>
                    </div>
                )}

                {!isLoading && filtered.map((container) => {
                    const cfg = STATUS_CONFIG[container.status]
                    const Icon = cfg.icon
                    return (
                        <button
                            key={container.programacaoId}
                            onClick={() => handleCardClick(container.id, container.status)}
                            className={`w-full text-left p-5 rounded-2xl bg-bg-card border border-border hover:border-text-muted/30 transition-all duration-200 active:scale-[0.98] ${container.status === 'cancelado' ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${container.status === 'aguardando' ? 'bg-white/10' :
                                    container.status === 'conferido' ? 'bg-success/10' :
                                        'bg-danger/10'
                                    }`}>
                                    <Icon size={24} className={container.status === 'aguardando' ? 'text-white' : cfg.color} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-[16px] font-bold text-text-primary truncate">{container.id}</h5>
                                        <span className={`text-xs font-medium ${container.status === 'aguardando' ? 'text-white' :
                                            container.status === 'conferido' ? 'text-success' :
                                                'text-danger'
                                            }`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    {container.status === 'conferido' && container.nfs.length > 0 && (
                                        <div className="mt-1.5">
                                            <p className={`text-sm font-bold leading-tight ${container.nfs.length === 1 ? 'text-blue-400' : 'text-orange-400'}`}>
                                                NF: {container.nfs.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                    {container.origem && (
                                        <p className="text-text-secondary text-xs mt-0.5">Origem: {container.origem}</p>
                                    )}

                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Blocked Modal */}
            <Modal open={blockedModal} onClose={() => setBlockedModal(false)} title="Acesso Negado">
                <div className="flex flex-col items-center py-4">
                    <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
                        <AlertTriangle size={32} className="text-danger" />
                    </div>
                    <p className="text-text-primary text-sm text-center mb-1 font-medium">
                        Este container foi cancelado
                    </p>
                    <p className="text-text-secondary text-xs text-center mb-5">
                        Não é possível realizar conferência em containers com status cancelado.
                    </p>
                    <button
                        onClick={() => setBlockedModal(false)}
                        className="w-full py-3 rounded-xl bg-danger/10 text-danger font-medium text-sm hover:bg-danger/20 transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </Modal>

            {/* NF Count Modal */}
            <Modal open={nfModal} onClose={() => setNfModal(false)} title="Quantidade de NFs">
                <div className="space-y-4 pt-2">
                    <p className="text-text-secondary text-sm">
                        Quantas notas fiscais serão abertas para este container?
                    </p>
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={nfInput}
                        onChange={(e) => setNfInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 3"
                        className="w-full h-12 px-4 rounded-xl bg-bg-input border border-border text-text-primary text-center text-lg font-semibold placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                        autoFocus
                    />
                    <button
                        onClick={handleNfSubmit}
                        className="w-full py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors"
                    >
                        Iniciar Conferência
                    </button>
                </div>
            </Modal>
        </div>
    )
}
