interface FilterChipsProps<T extends string> {
    options: { label: string; value: T }[]
    active: T
    onChange: (value: T) => void
}

export default function FilterChips<T extends string>({ options, active, onChange }: FilterChipsProps<T>) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {options.map((opt) => {
                const isActive = opt.value === active
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`touch-target shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActive
                                ? 'bg-accent/15 border-accent text-accent'
                                : 'bg-bg-card border-border text-text-secondary hover:border-text-muted'
                            }`}
                    >
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )
}
