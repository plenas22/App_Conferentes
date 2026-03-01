import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { Screen, type Toast as ToastT, type ToastType, type FieldMemory, type ExpedicaoStatus, type Conferente, type Product } from '@/types'
import {
    fetchConferentes,
    fetchProdutos,
    fetchProgramacaoIn,
    fetchProgramacaoOut,
    fetchAllInboundItems,
    type ProgramacaoIn,
    type ProgramacaoOut,
} from '@/services/api'


interface AppState {
    /* Navigation */
    currentScreen: Screen
    screenHistory: Screen[]
    navigateTo: (screen: Screen) => void
    goBack: () => void

    /* Toast */
    toasts: ToastT[]
    showToast: (message: string, type?: ToastType) => void
    removeToast: (id: string) => void

    /* Recebimento */
    selectedContainerId: string | null
    setSelectedContainerId: (id: string | null) => void
    nfCount: number
    setNfCount: (n: number) => void
    currentNfIndex: number
    setCurrentNfIndex: (n: number) => void

    /* Expedição */
    selectedExpedicaoId: string | null
    setSelectedExpedicaoId: (id: string | null) => void
    expedicaoStatuses: Record<string, ExpedicaoStatus>
    updateExpedicaoStatus: (id: string, status: ExpedicaoStatus) => void

    /* Field Memory */
    fieldMemory: FieldMemory
    updateFieldMemory: (partial: Partial<FieldMemory>) => void

    /* Supabase data */
    conferentes: Conferente[]
    produtos: Product[]
    programacaoIn: ProgramacaoIn[]
    programacaoOut: ProgramacaoOut[]
    inboundItems: any[]
    isLoading: boolean

    refreshData: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.SPLASH_APP)

    const [screenHistory, setScreenHistory] = useState<Screen[]>([])
    const [toasts, setToasts] = useState<ToastT[]>([])

    /* Recebimento */
    const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null)
    const [nfCount, setNfCount] = useState(1)
    const [currentNfIndex, setCurrentNfIndex] = useState(0)

    /* Expedição */
    const [selectedExpedicaoId, setSelectedExpedicaoId] = useState<string | null>(null)
    const [expedicaoStatuses, setExpedicaoStatuses] = useState<Record<string, ExpedicaoStatus>>({})

    const updateExpedicaoStatus = useCallback((id: string, status: ExpedicaoStatus) => {
        setExpedicaoStatuses((prev) => ({ ...prev, [id]: status }))
    }, [])

    /* Field Memory */
    const [fieldMemory, setFieldMemory] = useState<FieldMemory>({
        doca: '',
        conferente: '',
        horaInicio: '',
        horaFim: '',
    })

    /* Supabase data */
    const [conferentes, setConferentes] = useState<Conferente[]>([])
    const [produtos, setProdutos] = useState<Product[]>([])
    const [programacaoIn, setProgramacaoIn] = useState<ProgramacaoIn[]>([])
    const [programacaoOut, setProgramacaoOut] = useState<ProgramacaoOut[]>([])
    const [inboundItems, setInboundItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)


    const refreshData = useCallback(async () => {
        try {
            const [conf, prod, progIn, progOut, items] = await Promise.all([
                fetchConferentes(),
                fetchProdutos(),
                fetchProgramacaoIn(),
                fetchProgramacaoOut(),
                fetchAllInboundItems(),
            ])

            setConferentes(conf)
            setProdutos(prod)
            setProgramacaoIn(progIn)
            setProgramacaoOut(progOut)
            setInboundItems(items)
        } catch (err) {
            console.error('refreshData error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])


    // Initial load
    useEffect(() => {
        refreshData()
    }, [refreshData])

    const navigateTo = useCallback((screen: Screen) => {
        setScreenHistory((h) => [...h, currentScreen])
        setCurrentScreen(screen)
    }, [currentScreen])

    const goBack = useCallback(() => {
        setScreenHistory((h) => {
            const copy = [...h]
            const prev = copy.pop()
            if (prev !== undefined) setCurrentScreen(prev)
            return copy
        })
    }, [])

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
        setToasts((t) => [...t, { id, message, type }])
        setTimeout(() => {
            setToasts((t) => t.filter((toast) => toast.id !== id))
        }, 3000)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((t) => t.filter((toast) => toast.id !== id))
    }, [])

    const updateFieldMemory = useCallback((partial: Partial<FieldMemory>) => {
        setFieldMemory((m) => ({ ...m, ...partial }))
    }, [])

    return (
        <AppContext.Provider
            value={{
                currentScreen,
                screenHistory,
                navigateTo,
                goBack,
                toasts,
                showToast,
                removeToast,
                selectedContainerId,
                setSelectedContainerId,
                nfCount,
                setNfCount,
                currentNfIndex,
                setCurrentNfIndex,
                selectedExpedicaoId,
                setSelectedExpedicaoId,
                expedicaoStatuses,
                updateExpedicaoStatus,
                fieldMemory,
                updateFieldMemory,
                conferentes,
                produtos,
                programacaoIn,
                programacaoOut,
                inboundItems,
                isLoading,
                refreshData,

            }}
        >
            {children}
        </AppContext.Provider>
    )
}

export function useApp(): AppState {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error('useApp must be used inside AppProvider')
    return ctx
}
