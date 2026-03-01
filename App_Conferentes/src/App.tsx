import { AppProvider, useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'
import MobileWrapper from '@/components/MobileWrapper'
import ToastContainer from '@/components/Toast'
import MenuPrincipal from '@/screens/MenuPrincipal'
import SplashScreenApp from '@/screens/SplashScreenApp'
import SplashRecebimento from '@/screens/SplashRecebimento'
import SplashExpedicao from '@/screens/SplashExpedicao'
import RecebimentoList from '@/screens/RecebimentoList'
import RecebimentoForm from '@/screens/RecebimentoForm'
import ExpedicaoList from '@/screens/ExpedicaoList'
import ExpedicaoForm from '@/screens/ExpedicaoForm'

function Router() {
    const { currentScreen } = useApp()

    const screens: Record<Screen, React.ReactNode> = {
        [Screen.SPLASH_APP]: <SplashScreenApp />,
        [Screen.MENU]: <MenuPrincipal />,
        [Screen.SPLASH_RECEBIMENTO]: <SplashRecebimento />,
        [Screen.SPLASH_EXPEDICAO]: <SplashExpedicao />,
        [Screen.RECEBIMENTO_LIST]: <RecebimentoList />,
        [Screen.RECEBIMENTO_FORM]: <RecebimentoForm />,
        [Screen.EXPEDICAO_LIST]: <ExpedicaoList />,
        [Screen.EXPEDICAO_FORM]: <ExpedicaoForm />,
    }

    return <>{screens[currentScreen]}</>
}

export default function App() {
    return (
        <AppProvider>
            <MobileWrapper>
                <Router />
            </MobileWrapper>
            <ToastContainer />
        </AppProvider>
    )
}
