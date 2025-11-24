

export const getCategoryTheme = (id: string) => {
    switch (id) {
        case 'characters':
            return {
                bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900',
                text: 'text-emerald-900 dark:text-emerald-100',
                accent: 'bg-emerald-200 dark:bg-emerald-900',
                iconColor: 'text-emerald-400 dark:text-emerald-800',
                border: 'border-emerald-200 dark:border-emerald-800'
            };
        case 'magic':
            return {
                bg: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900',
                text: 'text-purple-900 dark:text-purple-100',
                accent: 'bg-purple-200 dark:bg-purple-900',
                iconColor: 'text-purple-400 dark:text-purple-800',
                border: 'border-purple-200 dark:border-purple-800'
            };
        case 'world':
            return {
                bg: 'bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950 dark:to-sky-900',
                text: 'text-sky-900 dark:text-sky-100',
                accent: 'bg-sky-200 dark:bg-sky-900',
                iconColor: 'text-sky-400 dark:text-sky-800',
                border: 'border-sky-200 dark:border-sky-800'
            };
        case 'factions':
            return {
                bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-orange-950 dark:to-amber-900',
                text: 'text-amber-900 dark:text-amber-100',
                accent: 'bg-amber-200 dark:bg-amber-900',
                iconColor: 'text-amber-400 dark:text-amber-800',
                border: 'border-amber-200 dark:border-amber-800'
            };
        case 'plot':
            return {
                bg: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900',
                text: 'text-rose-900 dark:text-rose-100',
                accent: 'bg-rose-200 dark:bg-rose-900',
                iconColor: 'text-rose-400 dark:text-rose-800',
                border: 'border-rose-200 dark:border-rose-800'
            };
        case 'notes':
             return {
                bg: 'bg-gradient-to-br from-slate-100 to-zinc-200 dark:from-slate-800 dark:to-zinc-900',
                text: 'text-slate-800 dark:text-slate-200',
                accent: 'bg-slate-200 dark:bg-slate-700',
                iconColor: 'text-slate-400 dark:text-slate-600',
                border: 'border-slate-300 dark:border-slate-700'
            };
        default:
            return {
                bg: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
                text: 'text-gray-800 dark:text-gray-200',
                accent: 'bg-gray-200 dark:bg-gray-700',
                iconColor: 'text-gray-400 dark:text-gray-600',
                border: 'border-gray-200 dark:border-gray-700'
            };
    }
};
