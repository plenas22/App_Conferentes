import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'
import type { ConferenciaStep, ExpedicaoStatus } from '@/types'
import { saveOutboundItem, fetchOutboundItemByIDN, updateProgramacaoOutStatus } from '@/services/api'

import Modal from '@/components/Modal'
import { ChevronLeft, Clock, AlertTriangle, Save } from 'lucide-react'
import { formatVolumeBR, parseVolumeBR } from '@/utils/format'



function mapExpStatus(supabaseStatus: string): ExpedicaoStatus {
    const s = supabaseStatus.toLowerCase()
    if (s === 'expedido' || s === 'concluído' || s === 'concluido') return 'expedido'
    if (s === 'em conferência' || s === 'em conferencia' || s === 'em_conferencia' || s === 'em andamento') return 'em_conferencia'
    return 'aguardando'
}

export default function ExpedicaoForm() {
    const { selectedExpedicaoId, navigateTo, showToast, updateExpedicaoStatus, expedicaoStatuses, programacaoOut, conferentes, refreshData } = useApp()

    const prog = programacaoOut.find((p) => p.id === selectedExpedicaoId)
    const baseStatus = prog ? mapExpStatus(prog.status) : 'aguardando'
    const currentStatus = prog ? (expedicaoStatuses[prog.id] ?? baseStatus) : 'aguardando'

    const isEditMode = currentStatus === 'expedido'

    const [stepModal, setStepModal] = useState(!isEditMode)
    const [editModal, setEditModal] = useState(isEditMode)
    const [step, setStep] = useState<ConferenciaStep | null>(isEditMode ? null : null)
    const [saving, setSaving] = useState(false)

    /* Step 1 fields */
    const [conferente1, setConferente1] = useState('')
    const [horaInicio1, setHoraInicio1] = useState('')

    /* Step 2 fields */
    const [conferente2, setConferente2] = useState('')
    const [horaFim2, setHoraFim2] = useState('')
    const [ocorrencia, setOcorrencia] = useState<boolean | null>(null)
    const [ocorrenciaTexto, setOcorrenciaTexto] = useState('')
    const [ocorrenciaModal, setOcorrenciaModal] = useState(false)

    /* Doca de saída */
    const [docaSaida, setDocaSaida] = useState('')

    // Load existing outbound data for edit mode or step 2
    useEffect(() => {
        if (!prog) return
        // Fetch using IDN (Programação ID) to avoid DT conflicts
        fetchOutboundItemByIDN(prog.id).then((item) => {
            if (item) {
                setDocaSaida(item.doca || '')
                setConferente1(item.conferente1 || '')
                setHoraInicio1(item.hora_inicial || '')
                setConferente2(item.conferente2 || '')
                setHoraFim2(item.hora_final || '')
                setOcorrencia(item.ocorrencia || false)
                setOcorrenciaTexto(item.ocorrencia_texto || '')
            }
        })

    }, [prog])

    if (!prog) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-primary">
                <div className="flex-1 flex items-center justify-center text-text-muted">
                    Expedição não encontrada
                </div>
            </div>
        )
    }

    function selectStep(s: ConferenciaStep) {
        setStep(s)
        setStepModal(false)
        setEditModal(false)
    }

    async function handleSave() {
        if (step === 1) {
            if (!conferente1 || !horaInicio1) {
                showToast('Preencha Conferente e Hora Início', 'error')
                return
            }
            setSaving(true)
            try {
                // Parallelize save and status update for performance
                await Promise.all([
                    saveOutboundItem({
                        num_transporte: prog!.transporte,
                        data_prog: prog!.data_programada,
                        // Extra fields to ensure they are saved/updated
                        cliente: prog!.cliente,
                        veiculo: prog!.veiculo,
                        produto: prog!.produto,
                        volume_m3: Number(prog!.volume),

                        prioridade: prog!.prioridade,



                        doca: docaSaida,
                        conferente1,
                        hora_inicial: horaInicio1,
                        status: 'em_conferencia',
                        idn: prog!.id,

                    }),
                    updateProgramacaoOutStatus(prog!.id, 'Em Conferência')
                ])

                updateExpedicaoStatus(prog!.id, 'em_conferencia')
                refreshData() // Non-blocking refresh
                showToast('1ª Conferência salva com sucesso!', 'success')
                navigateTo(Screen.EXPEDICAO_LIST)
            } catch {
                showToast('Erro ao salvar. Tente novamente.', 'error')
            } finally {
                setSaving(false)
            }
        } else {
            if (!conferente2 || !horaFim2) {
                showToast('Preencha Conferente 2 e Hora Fim', 'error')
                return
            }
            // Logic: if confirmed occurrence is null/false, we assume NO occurrence
            const hasOcorrencia = ocorrencia === true
            const finalTexto = hasOcorrencia ? ocorrenciaTexto : 'NÃO'

            if (hasOcorrencia && !ocorrenciaTexto) {
                showToast('Descreva a ocorrência', 'error')
                return
            }

            setSaving(true)
            try {
                // Parallelize save and status update for performance
                await Promise.all([
                    saveOutboundItem({
                        num_transporte: prog!.transporte,
                        data_prog: prog!.data_programada,
                        // Extra fields
                        cliente: prog!.cliente,
                        veiculo: prog!.veiculo,
                        produto: prog!.produto,
                        volume_m3: Number(prog!.volume),

                        prioridade: prog!.prioridade,



                        doca: docaSaida,
                        conferente1, // Preserves step 1 data
                        hora_inicial: horaInicio1, // Preserves step 1 data
                        conferente2,
                        hora_final: horaFim2,
                        ocorrencia: hasOcorrencia,
                        ocorrencia_texto: finalTexto,
                        status: 'expedido',
                        idn: prog!.id,

                    }),
                    updateProgramacaoOutStatus(prog!.id, 'Expedido')
                ])

                updateExpedicaoStatus(prog!.id, 'expedido')
                refreshData() // Non-blocking refresh
                showToast('2ª Conferência salva! Expedição concluída.', 'success')
                navigateTo(Screen.EXPEDICAO_LIST)
            } catch {
                showToast('Erro ao salvar. Tente novamente.', 'error')
            } finally {
                setSaving(false)
            }
        }
    }

    function handleOcorrenciaSim() {
        setOcorrencia(true)
        setOcorrenciaModal(true)
    }

    // For edit mode: only Doca and Hora are editable
    const editReadOnly = isEditMode && step !== null

    return (
        <div className="flex flex-col min-h-screen bg-bg-primary">
            {/* Header */}
            <div className="px-4 pt-4 pb-4 flex items-center gap-3">
                <button
                    onClick={() => navigateTo(Screen.EXPEDICAO_LIST)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                >
                    <ChevronLeft size={22} className="text-text-primary" />
                </button>
                <h1 className="text-xl font-bold text-text-primary">
                    {isEditMode ? 'Editar Expedição' : 'Conferir Expedição'}
                </h1>
            </div>

            <div className="flex-1 px-4 pb-4 overflow-y-auto space-y-5">

                {/* === Identification fieldset === */}
                <fieldset className="border border-border rounded-2xl p-4 space-y-3">
                    <legend className="text-[11px] text-text-white font-semibold uppercase tracking-wider px-2">
                        Identificação
                    </legend>

                    {/* Cliente — full width */}
                    <div>
                        <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Cliente</span>
                        <p className="text-base font-bold text-text-primary mt-0.5">{prog.cliente}</p>
                    </div>

                    {/* DT + Prioridade */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="px-4 py-3 rounded-xl bg-bg-input border border-border">
                            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">DT</span>
                            <p className="text-sm font-bold text-text-primary mt-0.5">{prog.transporte}</p>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-bg-input border border-border">
                            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Prioridade</span>
                            <p className="text-sm font-bold text-[#ED7D31] mt-0.5">{prog.prioridade}</p>
                        </div>
                    </div>

                    {/* Produto */}
                    <div className="px-4 py-3 rounded-xl bg-bg-input border border-border">
                        <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Produto</span>
                        <p className="text-sm font-bold text-text-primary mt-0.5">{prog.produto}</p>
                    </div>

                    {/* Veículo + Volume */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="px-4 py-3 rounded-xl bg-bg-input border border-border">
                            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Veículo</span>
                            <p className="text-sm font-bold text-text-primary mt-0.5">{prog.veiculo}</p>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-bg-input border border-border">
                            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Volume (M³)</span>
                            <p className="text-sm font-bold text-text-primary mt-0.5">{formatVolumeBR(prog.volume)}</p>
                        </div>

                    </div>
                </fieldset>

                {/* Occurrence warning (if exists) */}
                {ocorrencia && ocorrenciaTexto && (
                    <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 animate-fade-in-up">
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-danger mb-1">OCORRÊNCIA REGISTRADA</p>
                                <p className="text-xs text-danger/90 font-medium">{ocorrenciaTexto}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* === Conference form fieldset === */}
                {step && (
                    <fieldset className="border border-[#ED7D31]/30 rounded-2xl p-4 space-y-4 animate-fade-in-up">
                        <legend className="text-[11px] text-[#ED7D31] font-semibold uppercase tracking-wider px-2">
                            {step === 1 ? '1ª Conferência' : '2ª Conferência'}
                            {isEditMode && ' (Edição)'}
                        </legend>

                        {/* Doca de Saída — always editable */}
                        <div>
                            <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1 block">
                                Doca de Saída
                            </label>
                            <input
                                type="text"
                                value={docaSaida}
                                onChange={(e) => setDocaSaida(e.target.value)}
                                placeholder="Ex: 04"
                                className="w-full max-w-[200px] h-12 px-4 rounded-xl bg-bg-input border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                            />
                        </div>

                        {/* STEP 1 FORM */}
                        {step === 1 && (
                            <div className="space-y-4">
                                {/* Conferente 1 */}
                                <div>
                                    <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1 block">
                                        1º Conferente
                                    </label>
                                    <select
                                        value={conferente1}
                                        onChange={(e) => setConferente1(e.target.value)}
                                        disabled={editReadOnly}
                                        className="w-full h-12 px-4 rounded-xl bg-bg-input border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Selecione...</option>
                                        {conferentes.map((c) => (
                                            <option key={c.id} value={c.nome}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Hora Início — always editable */}
                                <div>
                                    <label className="text-[10px] text-[#ED7D31] font-bold uppercase tracking-wider mb-1 block text-center">
                                        Hora Inicial
                                    </label>
                                    <div className="relative max-w-[200px] mx-auto">
                                        <input
                                            type="time"
                                            value={horaInicio1}
                                            onChange={(e) => setHoraInicio1(e.target.value)}
                                            className="w-full h-12 px-4 pr-10 rounded-xl bg-bg-input border border-border text-sm text-text-primary text-center focus:outline-none focus:border-border-focus transition-colors"
                                            placeholder="--:--"
                                        />
                                        <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 FORM */}
                        {step === 2 && (
                            <div className="space-y-4">
                                {/* Conferentes side by side */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1 block">
                                            1º Conferente
                                        </label>
                                        <select
                                            value={conferente1}
                                            onChange={(e) => setConferente1(e.target.value)}
                                            disabled={editReadOnly}
                                            className="w-full h-12 px-3 rounded-xl bg-bg-input border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors appearance-none disabled:opacity-50"
                                        >
                                            <option value="">Selecione...</option>
                                            {conferentes.map((c) => (
                                                <option key={c.id} value={c.nome}>{c.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1 block">
                                            2º Conferente
                                        </label>
                                        <select
                                            value={conferente2}
                                            onChange={(e) => setConferente2(e.target.value)}
                                            disabled={editReadOnly}
                                            className="w-full h-12 px-3 rounded-xl bg-bg-input border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors appearance-none disabled:opacity-50"
                                        >
                                            <option value="">Selecione...</option>
                                            {conferentes.map((c) => (
                                                <option key={c.id} value={c.nome}>{c.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Hora Fim — always editable */}
                                <div>
                                    <label className="text-[10px] text-[#ED7D31] font-bold uppercase tracking-wider mb-1 block text-center">
                                        Hora Fim
                                    </label>
                                    <div className="relative max-w-[200px] mx-auto">
                                        <input
                                            type="time"
                                            value={horaFim2}
                                            onChange={(e) => setHoraFim2(e.target.value)}
                                            className="w-full h-12 px-4 pr-10 rounded-xl bg-bg-input border border-border text-sm text-text-primary text-center focus:outline-none focus:border-border-focus transition-colors"
                                            placeholder="--:--"
                                        />
                                        <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    </div>
                                </div>

                                {/* Ocorrência — not editable in edit mode */}
                                {!editReadOnly && (
                                    <div>
                                        <label className="text-xs text-text-secondary font-medium mb-2 block">Ocorrência?</label>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleOcorrenciaSim}
                                                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${ocorrencia === true
                                                    ? 'bg-danger/15 border-danger text-danger'
                                                    : 'bg-bg-input border-border text-text-secondary hover:border-text-muted'
                                                    }`}
                                            >
                                                SIM
                                            </button>
                                            <button
                                                onClick={() => { setOcorrencia(false); setOcorrenciaTexto('') }}
                                                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${ocorrencia === false
                                                    ? 'bg-success/15 border-success text-success'
                                                    : 'bg-bg-input border-border text-text-secondary hover:border-text-muted'
                                                    }`}
                                            >
                                                NÃO
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </fieldset>
                )}

                <div className="h-4" />
            </div>

            {/* Save button */}
            {step && (
                <div className="sticky bottom-0 px-4 py-4 bg-bg-primary/95 backdrop-blur-sm">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 rounded-2xl bg-[#00B050] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-[#00B050]/25 uppercase tracking-wide disabled:opacity-60"
                    >
                        <Save size={18} />
                        {saving ? 'SALVANDO...' : isEditMode ? 'ATUALIZAR' : 'SALVAR ALTERAÇÕES'}
                    </button>
                </div>
            )}

            {/* Step Selection Modal — shows only the relevant step */}
            <Modal open={stepModal} onClose={() => { setStepModal(false); if (!step) navigateTo(Screen.EXPEDICAO_LIST) }} title="Selecionar Conferência">
                <div className="space-y-3 pt-2">
                    {currentStatus !== 'em_conferencia' && currentStatus !== 'expedido' && (
                        <button
                            onClick={() => selectStep(1)}
                            className="w-full p-4 rounded-xl bg-bg-input border border-border hover:border-[#ED7D31]/40 transition-all text-left active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#ED7D31]/10 flex items-center justify-center">
                                    <span className="text-[#ED7D31] font-bold text-sm">1º</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">1º Conferente</p>
                                    <p className="text-xs text-text-secondary">1ª etapa de Conferência</p>
                                </div>
                            </div>
                        </button>
                    )}

                    {currentStatus === 'em_conferencia' && (
                        <button
                            onClick={() => selectStep(2)}
                            className="w-full p-4 rounded-xl bg-bg-input border border-border hover:border-success/40 transition-all text-left active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                    <span className="text-success font-bold text-sm">2º</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">2º Conferente</p>
                                    <p className="text-xs text-text-secondary">2ª Etapa de Conferência</p>
                                </div>
                            </div>
                        </button>
                    )}
                </div>
            </Modal>

            {/* Edit mode — select which conferente to edit */}
            <Modal open={editModal} onClose={() => { setEditModal(false); navigateTo(Screen.EXPEDICAO_LIST) }} title="Editar Expedição">
                <div className="space-y-3 pt-2">
                    <p className="text-text-secondary text-sm mb-2">Qual conferente deseja editar? (Somente Doca e Horário são editáveis)</p>
                    <button
                        onClick={() => selectStep(1)}
                        className="w-full p-4 rounded-xl bg-bg-input border border-border hover:border-[#ED7D31]/40 transition-all text-left active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#ED7D31]/10 flex items-center justify-center">
                                <span className="text-[#ED7D31] font-bold text-sm">1º</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">1º Conferente</p>
                                <p className="text-xs text-text-secondary">1ª Etapa de Conferência</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => selectStep(2)}
                        className="w-full p-4 rounded-xl bg-bg-input border border-border hover:border-success/40 transition-all text-left active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                <span className="text-success font-bold text-sm">2º</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">2º Conferente</p>
                                <p className="text-xs text-text-secondary">2ª Etapa de Conferência</p>
                            </div>
                        </div>
                    </button>
                </div>
            </Modal>

            {/* Ocorrência Textarea Modal */}
            <Modal open={ocorrenciaModal} onClose={() => setOcorrenciaModal(false)} title="Descrever Ocorrência">
                <div className="space-y-4 pt-2">
                    <p className="text-text-secondary text-sm">
                        Descreva a ocorrência em detalhes. O texto será convertido para CAIXA ALTA.
                    </p>
                    <textarea
                        value={ocorrenciaTexto}
                        onChange={(e) => setOcorrenciaTexto(e.target.value.toUpperCase())}
                        placeholder="DESCREVA A OCORRÊNCIA..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-bg-input border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors resize-none uppercase"
                        autoFocus
                    />
                    <button
                        onClick={() => setOcorrenciaModal(false)}
                        className="w-full py-3 rounded-xl bg-danger/10 text-danger font-medium text-sm hover:bg-danger/20 transition-colors"
                    >
                        Confirmar Ocorrência
                    </button>
                </div>
            </Modal>
        </div>
    )
}
