/* === Screen enum === */
export enum Screen {
    SPLASH_APP = 'SPLASH_APP',
    MENU = 'MENU',
    SPLASH_RECEBIMENTO = 'SPLASH_RECEBIMENTO',
    SPLASH_EXPEDICAO = 'SPLASH_EXPEDICAO',
    RECEBIMENTO_LIST = 'RECEBIMENTO_LIST',
    RECEBIMENTO_FORM = 'RECEBIMENTO_FORM',
    EXPEDICAO_LIST = 'EXPEDICAO_LIST',
    EXPEDICAO_FORM = 'EXPEDICAO_FORM',
}


/* === Recebimento (Inbound) === */
export type ContainerStatus = 'aguardando' | 'conferido' | 'cancelado'

export interface Container {
    id: string
    status: ContainerStatus
    notasFiscais: string[]
    doca: string
    dataChegada: string
}

export interface Product {
    codigo: string
    tipo: string
    modelo: string
    descricao: string
}

export interface NotaFiscalForm {
    notaFiscal: string
    codigoProduto: string
    tipo: string
    modelo: string
    descricao: string
    quantidade: string
    volume: string
    conferente: string
    doca: string
    horaInicio: string
    horaFim: string
    avarias: string
    molhadura: string
    registroInicio: string
    registroMeio: string
    registroFim: string
    fastlog: string
}

/* === Expedição (Outbound) === */
export type ExpedicaoStatus = 'aguardando' | 'em_conferencia' | 'expedido'
export type ExpedicaoFilter = 'hoje' | 'expedidos' | 'aguardando'
export type Priority = 1 | 2 | 3 | 4 | 5

export interface Expedicao {
    id: string
    cliente: string
    dt: string
    prioridade: Priority
    status: ExpedicaoStatus
    produto: string
    veiculo: string
    volume: string
    data: string
    conferente1: string
    horaInicio1: string
    conferente2: string
    horaInicio2: string
    horaFim2: string
    ocorrencia: boolean
    ocorrenciaTexto: string
}

export type ConferenciaStep = 1 | 2

/* === Conferente === */
export interface Conferente {
    id: string
    nome: string
}

/* === Toast === */
export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
    id: string
    message: string
    type: ToastType
}

/* === Field Memory (persists between NF iterations) === */
export interface FieldMemory {
    doca: string
    conferente: string
    horaInicio: string
    horaFim: string
}
