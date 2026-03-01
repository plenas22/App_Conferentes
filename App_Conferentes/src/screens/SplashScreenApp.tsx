import { useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Screen } from '@/types'

export default function SplashScreenApp() {
    const { navigateTo } = useApp()

    useEffect(() => {
        const timer = setTimeout(() => {
            navigateTo(Screen.MENU)
        }, 4500) // Increased to 4.5 seconds

        return () => clearTimeout(timer)
    }, [navigateTo])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary overflow-hidden">
            <div className="relative flex flex-col items-center">
                {/* Background Glow */}
                <div className="absolute -inset-10 bg-[#b30000]/10 blur-[60px] rounded-full animate-pulse-glow" />

                {/* TCL SEMP Logo with animation */}
                <div className="relative animate-scale-in">
                    <h1
                        className="text-[3rem] font-black tracking-widest text-white leading-tight"
                        style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            textShadow: '0 0 20px rgba(255,255,255,0.2)'
                        }}
                    >
                        TCL SEMP
                    </h1>

                    {/* Animated Underline */}
                    <div className="w-0 h-[4px] bg-[#b30000] mx-auto mt-2 rounded-full animate-expand-width" style={{ animationDelay: '0.4s' }} />

                    {/* Subtitle */}
                    <p
                        className="text-[#b30000] text-lg font-black tracking-[0.2em] mt-4 opacity-0 animate-fade-in text-center w-full"
                        style={{
                            fontStyle: 'italic',
                            animationDelay: '0.8s',
                            animationFillMode: 'forwards'
                        }}
                    >
                        Time to GO BIG
                    </p>
                </div>

                {/* Loading indicator */}
                <div className="absolute bottom-[-100px] flex gap-1.5 pt-10">
                    <div className="w-2 h-2 rounded-full bg-[#b30000] animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 rounded-full bg-[#b30000] animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-[#b30000] animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>

            <div className="absolute bottom-10 animate-fade-in" style={{ animationDelay: '1.2s', animationFillMode: 'forwards', opacity: 0 }}>
                <p className="text-text-muted text-xs font-medium tracking-widest">
                    Sistema de Logística v1.0 - by Elias Plenas
                </p>
            </div>
        </div>
    )
}
