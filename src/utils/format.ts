
/**
 * Formats a number to PT-BR standard (thousands separator: .)
 */
export function formatQuantityBR(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === '') return '—';
    const num = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val;
    if (isNaN(num)) return String(val);
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

/**
 * Formats a volume to PT-BR standard (decimal separator: , | NO thousands separator)
 * Integers in DB are milli-units (e.g. 1602 -> 1,602)
 * Always shows 3 decimal places as requested
 */
export function formatVolumeBR(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === '') return '—';
    // Convert to number and shift decimal point 3 places (e.g. 1602 -> 1.602)
    const rawNum = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
    if (isNaN(rawNum)) return String(val);

    const scaledNum = rawNum / 1000;

    return new Intl.NumberFormat('pt-BR', {
        useGrouping: false,
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(scaledNum);
}

/**
 * Parses a PT-BR formatted string back to a scaled integer for the database
 * Specifically for Volume: treats BOTH dot and comma as decimal separators
 * Multiplies by 1000 (e.g. 1,602 -> 1602)
 */
/**
 * Parses a PT-BR formatted string back to a scaled integer for the database
 * SMART LOGIC: 
 * - If input has comma/dot, we treat it as a decimal and multiply by 1000.
 * - If input is a pure integer, we treat it as already being milli-units (no scaling).
 */
export function parseVolumeBR(val: string | number): number {
    if (val === null || val === undefined) return 0;
    const s = String(val).trim();
    if (!s) return 0;

    const hasDecimalSeparator = s.includes(',') || s.includes('.');
    const clean = s.replace(',', '.');
    const num = parseFloat(clean);

    if (isNaN(num)) return 0;

    return hasDecimalSeparator ? Math.round(num * 1000) : Math.round(num);
}


/**
 * Parses a PT-BR quantity (integer with dot as thousands separator)
 */
export function parseQuantityBR(val: string): number {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    const num = Math.floor(parseFloat(clean));
    return isNaN(num) ? 0 : num;
}
