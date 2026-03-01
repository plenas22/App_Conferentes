import type { ReactNode } from 'react'

export default function MobileWrapper({ children }: { children: ReactNode }) {
    return (
        <div className="relative mx-auto w-full max-w-[480px] min-h-screen bg-bg-primary">
            {children}
        </div>
    )
}
