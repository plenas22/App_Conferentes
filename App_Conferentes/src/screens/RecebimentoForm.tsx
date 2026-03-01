import { useState, useCallback, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'
import type { NotaFiscalForm } from '@/types'
import { lookupProductFromList, saveInboundItem, fetchInboundItemsByContainer, updateProgramacaoInStatus } from '@/services/api'
import { Save, ArrowLeft, ChevronLeft, Clock } from 'lucide-react'
import { formatQuantityBR, formatVolumeBR, parseVolumeBR, parseQuantityBR } from '@/utils/format'



const EMPTY_FORM: NotaFiscalForm = {
    notaFiscal: '',
    codigoProduto: '',
    tipo: '',
    modelo: '',
    descricao: '',
    quantidade: '',
    volume: '',
    conferente: '',
    doca: '',
    horaInicio: '',
    horaFim: '',
    avarias: '',
    molhadura: '',
    registroInicio: '',
    registroMeio: '',
    registroFim: '',
    fastlog: '',
}

export default function RecebimentoForm() {
    const {
        selectedContainerId,
        nfCount,
        currentNfIndex,
        setCurrentNfIndex,
        fieldMemory,
        updateFieldMemory,
        navigateTo,
        showToast,
        conferentes,
        produtos,
        programacaoIn,
        refreshData,
    } = useApp()

    const progItem = programacaoIn.find((p) => p.container === selectedContainerId)
    const isEditMode = progItem && (progItem.status.toLowerCase() === 'concluído' || progItem.status.toLowerCase() === 'concluido' || progItem.status.toLowerCase() === 'conferido')

    const [form, setForm] = useState<NotaFiscalForm>(() => ({
        ...EMPTY_FORM,
        doca: fieldMemory.doca,
        conferente: fieldMemory.conferente,
        horaInicio: fieldMemory.horaInicio,
        horaFim: fieldMemory.horaFim,
    }))
    const [saving, setSaving] = useState(false)

    // Edit mode: load existing data from inbound_items
    useEffect(() => {
        if (isEditMode && selectedContainerId) {
            fetchInboundItemsByContainer(selectedContainerId).then((items) => {
                if (items.length > 0) {
                    const item = items[0] as Record<string, unknown>
                    setForm({
                        notaFiscal: String(item.nota_fiscal ?? ''),
                        codigoProduto: String(item.cod_produto ?? ''),
                        tipo: String(item.tipo ?? ''),
                        modelo: String(item.modelo ?? ''),
                        descricao: String(item.descricao ?? ''),
                        quantidade: formatQuantityBR(item.quantidade as number),
                        volume: formatVolumeBR(item.volume_m3 as number),
                        conferente: String(item.conferente ?? ''),
                        doca: String(item.doca ?? ''),
                        horaInicio: String(item.hora_inicio ?? ''),
                        horaFim: String(item.hora_fim ?? ''),
                        avarias: String(item.avarias ?? ''),
                        molhadura: String(item.molhadura ?? ''),
                        registroInicio: String(item.av_inicio ?? ''),
                        registroMeio: String(item.av_meio ?? ''),
                        registroFim: String(item.av_fim ?? ''),
                        fastlog: String(item.fastlog ?? ''),
                    })

                }
            })
        }
    }, [isEditMode, selectedContainerId])

    const updateField = useCallback((field: keyof NotaFiscalForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }, [])

    function numericOnly(value: string): string {
        return value.replace(/[^\d.,]/g, '')
    }

    function handleProductBlur() {
        const codigoTrimmed = form.codigoProduto.trim().toUpperCase()

        if (codigoTrimmed === 'DAT') {
            setForm((prev) => ({
                ...prev,
                tipo: '',
                modelo: '',
                descricao: 'Cód. Não se Aplica',
            }))
            return
        }

        if (!codigoTrimmed) return

        const product = lookupProductFromList(form.codigoProduto, produtos)
        if (product) {
            setForm((prev) => ({
                ...prev,
                tipo: product.tipo,
                modelo: product.modelo,
                descricao: product.descricao,
            }))
        } else {
            // Product not found in database
            setForm((prev) => ({
                ...prev,
                tipo: '',
                modelo: '',
                descricao: 'Cód. Não Cadastrado',
            }))
        }
    }

    async function handleSave() {
        if (!form.notaFiscal || !form.codigoProduto || !form.quantidade) {
            showToast('Preencha NF, Cód. Produto e Quantidade', 'error')
            return
        }

        setSaving(true)
        try {
            // 1. Criamos a data com o fuso horário corrigido para o Brasil (-3h)
            const dataBrasil = new Date();
            dataBrasil.setHours(dataBrasil.getHours() - 3);
            const dataHoje = dataBrasil.toISOString().split('T')[0]; // Fica no formato "YYYY-MM-DD"

            const isDAT = form.codigoProduto.trim().toUpperCase() === 'DAT'

            await saveInboundItem({
                // 2. Adicionamos a linha enviando a data exata de hoje
                data_program: dataHoje,

                container_id: selectedContainerId ?? '',
                nota_fiscal: isDAT ? 'DAT' : form.notaFiscal,
                cod_produto: isDAT ? 'DAT' : form.codigoProduto,
                tipo: isDAT ? '' : form.tipo,
                modelo: isDAT ? '' : form.modelo,
                descricao: isDAT ? 'Cód. Não se Aplica' : form.descricao,
                quantidade: parseQuantityBR(form.quantidade),
                volume_m3: parseVolumeBR(form.volume),
                conferente: form.conferente,

                doca: form.doca,
                hora_inicio: form.horaInicio,
                hora_fim: form.horaFim,
                avarias: Number(form.avarias) || 0,
                molhadura: Number(form.molhadura) || 0,
                av_inicio: Number(form.registroInicio) || 0,
                av_meio: Number(form.registroMeio) || 0,
                av_fim: Number(form.registroFim) || 0,
                fastlog: Number(form.fastlog) || 0,
            })


            updateFieldMemory({
                doca: form.doca,
                conferente: form.conferente,
                horaInicio: form.horaInicio,
                horaFim: form.horaFim,
            })

            const isLast = currentNfIndex >= nfCount - 1

            if (isLast) {
                // Mark programacao_in as Concluído
                if (progItem) {
                    await updateProgramacaoInStatus(progItem.id, 'Concluído')
                }
                await refreshData()
                showToast(isEditMode ? 'Dados atualizados com sucesso!' : `Conferência completa! ${nfCount} NF(s) salvas.`, 'success')
                navigateTo(Screen.RECEBIMENTO_LIST)
            } else {
                showToast(`NF ${currentNfIndex + 1}/${nfCount} salva!`, 'success')
                const nextIndex = currentNfIndex + 1
                setCurrentNfIndex(nextIndex)
                setForm({
                    ...EMPTY_FORM,
                    doca: form.doca,
                    conferente: form.conferente,
                    horaInicio: form.horaInicio,
                    horaFim: form.horaFim,
                })
            }
        } catch {
            showToast('Erro ao salvar. Tente novamente.', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-primary">
            {/* Page title */}
            <div className="px-4 pt-2 pb-4 flex items-center gap-3">
                <button
                    onClick={() => navigateTo(Screen.RECEBIMENTO_LIST)}
                    className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center hover:bg-accent/25 transition-colors"
                >
                    <ChevronLeft size={18} className="text-accent" />
                </button>
                <h1 className="text-xl font-bold text-text-primary">
                    {isEditMode ? 'Editar Dados' : 'Preencher Dados'}
                </h1>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 px-4 pb-4 overflow-y-auto space-y-5">

                {/* === Container fieldset === */}
                <fieldset className="border border-border rounded-2xl p-4 space-y-4">
                    <legend className="text-[11px] text-text-white font-semibold uppercase tracking-wider px-2">
                        Container
                    </legend>
                    {/* Container ID — read-only display */}
                    <div className="w-full px-4 py-3 rounded-xl bg-bg-input border border-border text-sm font-semibold text-text-primary">
                        {selectedContainerId ?? '—'}
                    </div>

                    {/* NF + Código Produto */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label="NOTA FISCAL"
                            value={form.notaFiscal}
                            onChange={(v) => updateField('notaFiscal', v)}
                        />
                        <FormField
                            label="CÓD. PRODUTO"
                            value={form.codigoProduto}
                            onChange={(v) => updateField('codigoProduto', v)}
                            onBlur={handleProductBlur}
                            placeholder="Ex: TV-001"
                        />
                    </div>

                    {/* Tipo + Modelo — plain text display */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-[10px] text-text-white font-semibold uppercase tracking-wider">Tipo</span>
                            <p className="text-base font-bold text-text-primary mt-0.5">{form.tipo || '—'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-text-white font-semibold uppercase tracking-wider">Modelo</span>
                            <p className="text-base font-bold text-text-primary mt-0.5">{form.modelo || '—'}</p>
                        </div>
                    </div>

                    {/* Descrição — plain text display */}
                    <div>
                        <span className="text-[10px] text-text-white font-semibold uppercase tracking-wider">Descrição</span>
                        <p className="text-sm font-bold text-text-primary mt-0.5">{form.descricao || '—'}</p>
                    </div>

                    {/* Quantidade + Volume */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label="QUANTIDADE"
                            value={form.quantidade}
                            onChange={(v) => updateField('quantidade', numericOnly(v))}
                            onBlur={() => updateField('quantidade', formatQuantityBR(form.quantidade))}
                            type="numeric"
                        />
                        <FormField
                            label="VOLUME M³"
                            value={form.volume}
                            onChange={(v) => updateField('volume', numericOnly(v))}
                            onBlur={() => updateField('volume', formatVolumeBR(form.volume))}
                            type="numeric"
                        />

                    </div>
                </fieldset>

                {/* === Conferente + Doca === */}
                <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                    <div>
                        <label className="text-[10px] text-text-white font-semibold uppercase tracking-wider mb-1 block">
                            Conferente
                        </label>
                        <select
                            value={form.conferente}
                            onChange={(e) => updateField('conferente', e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-bg-input border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors appearance-none"
                        >
                            <option value="">Selecionar...</option>
                            {conferentes.map((c) => (
                                <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-text-white font-semibold uppercase tracking-wider mb-1 block text-right">
                            Doca
                        </label>
                        <FormField
                            value={form.doca}
                            onChange={(v) => updateField('doca', v)}
                            placeholder="—"
                        />
                    </div>
                </div>

                {/* === Avarias + Molhadura === */}
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        label="AVARIAS"
                        value={form.avarias}
                        onChange={(v) => updateField('avarias', numericOnly(v))}
                        type="numeric"
                        placeholder="0"
                    />
                    <FormField
                        label="MOLHADURA"
                        value={form.molhadura}
                        onChange={(v) => updateField('molhadura', numericOnly(v))}
                        type="numeric"
                        placeholder="0"
                    />
                </div>

                {/* === Registros de Avarias === */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-text-white font-semibold uppercase tracking-wider text-center w-full">
                            Registros de Avarias
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField
                            label="INICIO"
                            value={form.registroInicio}
                            onChange={(v) => updateField('registroInicio', numericOnly(v))}
                            type="numeric"
                        />
                        <FormField
                            label="MEIO"
                            value={form.registroMeio}
                            onChange={(v) => updateField('registroMeio', numericOnly(v))}
                            type="numeric"
                        />
                        <FormField
                            label="FIM"
                            value={form.registroFim}
                            onChange={(v) => updateField('registroFim', numericOnly(v))}
                            type="numeric"
                        />
                    </div>
                </div>

                {/* === Fastlog === */}
                <div className="flex flex-col items-center">
                    <FormField
                        label="FASTLOG"
                        value={form.fastlog}
                        onChange={(v) => updateField('fastlog', numericOnly(v))}
                        type="numeric"
                        centered
                    />
                </div>

                {/* === Horários === */}
                <div className="space-y-2">
                    <p className="text-[11px] text-text-white font-semibold uppercase tracking-wider text-center">
                        Horários
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1 block text-center">
                                Inicio
                            </label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={form.horaInicio}
                                    onChange={(e) => updateField('horaInicio', e.target.value)}
                                    className="w-full h-12 px-4 pr-10 rounded-xl bg-bg-input border border-border text-sm text-text-primary text-center focus:outline-none focus:border-border-focus transition-colors"
                                    placeholder="--:--"
                                />
                                <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1 block text-center">
                                Fim
                            </label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={form.horaFim}
                                    onChange={(e) => updateField('horaFim', e.target.value)}
                                    className="w-full h-12 px-4 pr-10 rounded-xl bg-bg-input border border-border text-sm text-text-primary text-center focus:outline-none focus:border-border-focus transition-colors"
                                    placeholder="--:--"
                                />
                                <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom spacer for sticky button */}
                <div className="h-4" />
            </div>

            {/* Save button — sticky bottom */}
            <div className="sticky bottom-0 px-4 py-4 bg-bg-primary/95 backdrop-blur-sm">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-accent/25 uppercase tracking-wide disabled:opacity-60"
                >
                    <Save size={18} />
                    {saving ? 'SALVANDO...' : isEditMode ? 'ATUALIZAR DADOS 📋' : 'SALVAR CONFERÊNCIA 📋'}
                </button>
            </div>
        </div>
    )
}

/* === Reusable Form Field === */
interface FormFieldProps {
    label?: string
    value: string
    onChange: (value: string) => void
    onBlur?: () => void
    placeholder?: string
    type?: 'text' | 'numeric' | 'time'
    centered?: boolean
}

function FormField({ label, value, onChange, onBlur, placeholder, type = 'text', centered }: FormFieldProps) {
    return (
        <div className={centered ? 'w-[200px]' : ''}>
            {label && (
                <label className="text-[10px] text-text-white font-semibold uppercase tracking-wider mb-1 block">
                    {label}
                </label>
            )}
            <input
                type={type === 'time' ? 'time' : 'text'}
                inputMode={type === 'numeric' ? 'decimal' : 'text'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                placeholder={placeholder}
                className="w-full h-12 px-4 rounded-xl bg-bg-input border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
            />
        </div>
    )
}
