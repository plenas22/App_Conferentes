import { Search } from 'lucide-react'

interface SearchBarProps {
    value: string
    onChange: (v: string) => void
    placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Buscar...' }: SearchBarProps) {
    return (
        <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-bg-input border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
            />
        </div>
    )
}
