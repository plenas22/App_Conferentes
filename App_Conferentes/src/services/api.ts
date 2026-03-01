import { supabase } from '@/lib/supabase'
import type { Conferente, Product } from '@/types'

/* ──────────────────────────────────────────
   Conferentes
   ────────────────────────────────────────── */

export async function fetchConferentes(): Promise<Conferente[]> {
    const { data, error } = await supabase
        .from('conferentes')
        .select('*')
        .order('nome')

    if (error) {
        console.error('fetchConferentes error:', error)
        return []
    }
    return (data ?? []).map((c: Record<string, unknown>) => ({
        id: String(c.id),
        nome: String(c.nome ?? ''),
    }))
}

/* ──────────────────────────────────────────
   Produtos
   ────────────────────────────────────────── */

export async function fetchProdutos(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('base_produtos')
        .select('*')

    if (error) {
        console.error('fetchProdutos error:', error)
        return []
    }
    return (data ?? []).map((p: Record<string, unknown>) => ({
        codigo: String(p.cod_produto ?? p.codigo ?? ''),
        tipo: String(p.tipo ?? ''),
        modelo: String(p.modelo ?? ''),
        descricao: String(p.descricao ?? ''),
    }))
}

export function lookupProductFromList(codigo: string, produtos: Product[]): Product | undefined {
    return produtos.find(
        (p) => p.codigo.toLowerCase() === codigo.trim().toLowerCase()
    )
}

/* ──────────────────────────────────────────
   Programação IN (Recebimento) — lista p/ conferente
   ────────────────────────────────────────── */

export interface ProgramacaoIn {
    id: string
    container: string
    origem: string
    data_programada: string
    status: string
    observacao: string
}

export async function fetchProgramacaoIn(): Promise<ProgramacaoIn[]> {
    // Calcula a data de hoje no fuso do Brasil (UTC-3)
    const dataBrasil = new Date()
    dataBrasil.setHours(dataBrasil.getHours() - 3)
    const hoje = dataBrasil.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('programacao_in')
        .select('*')
        .eq('data_programada', hoje)
        .order('data_programada', { ascending: false })

    if (error) {
        console.error('fetchProgramacaoIn error:', error)
        return []
    }
    return (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        container: String(r.container ?? ''),
        origem: String(r.origem ?? ''),
        data_programada: String(r.data_programada ?? ''),
        status: String(r.status ?? 'Programado'),
        observacao: String(r.observacao ?? ''),
    }))
}

export async function updateProgramacaoInStatus(id: string, status: string) {
    const { error } = await supabase
        .from('programacao_in')
        .update({ status })
        .eq('id', id)

    if (error) console.error('updateProgramacaoInStatus error:', error)
}

/* ──────────────────────────────────────────
   Programação OUT (Expedição) — lista p/ conferente
   ────────────────────────────────────────── */

export interface ProgramacaoOut {
    id: string
    transporte: string
    transportadora: string
    cliente: string
    produto: string
    veiculo: string
    volume: string
    prioridade: number
    data_programada: string
    status: string
    observacao: string
}

export async function fetchProgramacaoOut(): Promise<ProgramacaoOut[]> {
    // Calcula a data de hoje no fuso do Brasil (UTC-3)
    const dataBrasil = new Date()
    dataBrasil.setHours(dataBrasil.getHours() - 3)
    const hoje = dataBrasil.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('programacao_out')
        .select('*')
        .eq('data_programada', hoje)
        .order('data_programada', { ascending: false })

    if (error) {
        console.error('fetchProgramacaoOut error:', error)
        return []
    }
    return (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        transporte: String(r.transporte ?? ''),
        transportadora: String(r.transportadora ?? ''),
        cliente: String(r.cliente ?? ''),
        produto: String(r.produto ?? ''),
        veiculo: String(r.veiculo ?? ''),
        volume: String(r.volume ?? ''),

        prioridade: Number(r.prioridade ?? 1),
        data_programada: String(r.data_programada ?? ''),
        status: String(r.status ?? 'Programado'),
        observacao: String(r.observacao ?? ''),
    }))
}

export async function updateProgramacaoOutStatus(id: string, status: string) {
    const { error } = await supabase
        .from('programacao_out')
        .update({ status })
        .eq('id', id)

    if (error) console.error('updateProgramacaoOutStatus error:', error)
}

/* ──────────────────────────────────────────
   Inbound Items (Recebimento — dados do conferente)
   ────────────────────────────────────────── */

export interface InboundItemPayload {
    container_id: string
    nota_fiscal: string
    cod_produto: string
    tipo: string
    modelo: string
    descricao: string
    quantidade: number
    volume_m3: number
    conferente: string
    doca: string
    hora_inicio: string
    hora_fim: string
    avarias: number
    molhadura: number
    av_inicio: number
    av_meio: number
    av_fim: number
    fastlog: number
    data_program?: string // Corrected column name
    sla?: number
    status_doca?: string
}
export async function saveInboundItem(payload: InboundItemPayload) {
    // 1. Pega a data atual e subtrai 3 horas para forçar o fuso do Brasil
    const dataBrasil = new Date();
    dataBrasil.setHours(dataBrasil.getHours() - 3);
    const dataHoje = dataBrasil.toISOString().split('T')[0]; // Agora sim, fica no dia certo!

    // 2. Map to correct DB column com a data corrigida
    const finalPayload = {
        ...payload,
        data_program: dataHoje,
        status_doca: 'Conferido',
        sla: 90,
    }

    // ... o resto do seu código de envio (supabase.from...) continua igualzinho aqui para baixo!

    // Manually check if item exists since we lack a unique constraint for UPSERT
    const { data: existing } = await supabase
        .from('inbound_items')
        .select('id')
        .eq('container_id', payload.container_id)
        .eq('nota_fiscal', payload.nota_fiscal)
        .maybeSingle()

    if (existing) {
        // Update
        const { data, error } = await supabase
            .from('inbound_items')
            .update(finalPayload)
            .eq('id', existing.id)
            .select()

        if (error) {
            console.error('saveInboundItem update error:', error)
            throw error
        }
        return data
    } else {
        // Insert
        const { data, error } = await supabase
            .from('inbound_items')
            .insert(finalPayload)
            .select()

        if (error) {
            console.error('saveInboundItem insert error:', error)
            throw error
        }
        return data
    }
}

export async function fetchInboundItemsByContainer(containerId: string) {
    const { data, error } = await supabase
        .from('inbound_items')
        .select('*')
        .eq('container_id', containerId)

    if (error) {
        console.error('fetchInboundItemsByContainer error:', error)
        return []
    }
    return data ?? []
}

export async function fetchAllInboundItems(): Promise<any[]> {
    const dataBrasil = new Date()
    dataBrasil.setHours(dataBrasil.getHours() - 3)
    const hoje = dataBrasil.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('inbound_items')
        .select('container_id, nota_fiscal, status_sla')
        .eq('data_program', hoje)

    if (error) {
        console.error('fetchAllInboundItems error:', error)
        return []
    }
    return data ?? []
}


/* ──────────────────────────────────────────
   Outbound Items (Expedição — dados do conferente)
   ────────────────────────────────────────── */

export interface OutboundItemPayload {
    num_transporte: string
    data_prog: string
    cliente: string
    veiculo: string
    produto: string
    volume_m3: number
    prioridade: number
    doca: string
    conferente1: string
    hora_inicial: string
    conferente2?: string
    hora_final?: string
    ocorrencia?: boolean
    ocorrencia_texto?: string
    status: string
    sla?: number // Added for override
}

export async function saveOutboundItem(payload: any) {
    const dataBrasil = new Date();
    dataBrasil.setHours(dataBrasil.getHours() - 3);
    const dataHoje = dataBrasil.toISOString().split('T')[0];

    const finalPayload = {
        ...payload,
        data_prog: dataHoje,
        sla: 90,
    }


    // Check if record already exists by idn (unique key)
    const { data: existing } = await supabase
        .from('outbound_items')
        .select('id')
        .eq('idn', payload.idn)
        .maybeSingle()


    if (existing) {
        // Update existing
        const { data, error } = await supabase
            .from('outbound_items')
            .update(finalPayload)
            .eq('id', existing.id)
            .select()

        if (error) {
            console.error('saveOutboundItem update error:', error)
            throw error
        }
        return data
    } else {
        // Insert new
        const { data, error } = await supabase
            .from('outbound_items')
            .insert(finalPayload)
            .select()

        if (error) {
            console.error('saveOutboundItem insert error:', error)
            throw error
        }
        return data
    }
}

export async function fetchOutboundItemByTransporte(numTransporte: string) {
    const { data, error } = await supabase
        .from('outbound_items')
        .select('*')
        .eq('num_transporte', numTransporte)
        .maybeSingle()

    if (error) {
        console.error('fetchOutboundItemByTransporte error:', error)
        return null
    }
    return data
}

export async function fetchOutboundItemByIDN(idn: string) {
    const { data, error } = await supabase
        .from('outbound_items')
        .select('*')
        .eq('idn', idn)
        .maybeSingle()

    if (error) {
        console.error('fetchOutboundItemByIDN error:', error)
        return null
    }
    return data
}

