
import React, { useState, useEffect, useRef } from 'react';
import { getRecentArticles, getCategories, exportData, importData, resetToDefaults } from '../services/storageService';
import { Article, Category } from '../types';
import { Icons } from '../components/Icon';
import { getCategoryTheme } from '../utils/themeUtils';

interface DashboardProps {
    onNavigate: (page: string, id?: string) => void;
    onCreate: (catId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onCreate }) => {
    const [recent, setRecent] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setRecent(getRecentArticles(6));
        setCategories(getCategories());
    }, []);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (window.confirm("ВНИМАНИЕ: Загрузка бэкапа перезапишет текущие данные. Продолжить?")) {
                try {
                    await importData(e.target.files[0]);
                    alert("Данные восстановлены. Перезагрузка...");
                    // Small delay to ensure localStorage flush
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } catch (err) {
                    alert("Ошибка: Неверный формат файла.");
                }
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleReset = () => {
        if (window.confirm("ВЫ УВЕРЕНЫ? Это удалит все ваши изменения и вернет стандартный набор статей.")) {
            resetToDefaults();
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-24">
            {/* 1. Hero Header */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-900 dark:bg-black border-l-8 border-emerald-500">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-900/50 dark:from-black dark:to-slate-900/80"></div>
                
                <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 flex items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold uppercase tracking-[0.2em] text-xs">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            Project: Phantoms
                        </div>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
                            Наследник Двух Родов
                        </h1>
                        <p className="text-slate-400 font-light text-base md:text-lg max-w-2xl">
                            Интерактивная база знаний. Структурируйте сюжет, персонажей и механику мира.
                        </p>
                    </div>
                    
                    <div className="hidden md:block opacity-20 transform translate-x-4">
                        <Icons.BookOpen className="w-24 h-24 text-emerald-500" />
                    </div>
                </div>
            </div>

            {/* 2. Categories Grid */}
            <div>
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3 uppercase tracking-wide">
                        <Icons.Grid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Картотека
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {categories.map(cat => {
                        const IconComp = (Icons as any)[cat.icon] || Icons.BookOpen;
                        const theme = getCategoryTheme(cat.id);
                        
                        return (
                            <button 
                                key={cat.id}
                                onClick={() => onNavigate('category', cat.id)}
                                className={`relative h-40 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group text-left flex flex-col p-6 border ${theme.border} ${theme.bg}`}
                            >
                                <IconComp className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500 ${theme.iconColor}`} />
                                
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-start justify-between">
                                        <div className={`w-10 h-10 rounded-lg ${theme.accent} flex items-center justify-center shadow-sm`}>
                                            <IconComp className={`w-5 h-5 ${theme.text}`} />
                                        </div>
                                        <Icons.ArrowUp className={`w-4 h-4 rotate-45 opacity-0 group-hover:opacity-100 transition-opacity ${theme.text}`} />
                                    </div>
                                    
                                    <div>
                                        <h3 className={`font-bold text-lg ${theme.text} leading-tight`}>{cat.name}</h3>
                                        <p className={`text-xs ${theme.text} opacity-70 line-clamp-1 mt-1.5`}>{cat.description}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Main Content Grid (Data & Activity) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                
                {/* Left Column: Data Management (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                <Icons.Save className="w-5 h-5 text-emerald-600" />
                                Управление данными
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                Данные хранятся в браузере. Скачивайте бэкап (JSON) для сохранения.
                            </p>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={exportData}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 py-3 rounded-lg font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
                                >
                                    <Icons.Download className="w-5 h-5" />
                                    Скачать Бэкап
                                </button>
                                
                                <button 
                                    onClick={handleImportClick}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-3 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Icons.ArrowUp className="w-5 h-5" />
                                    Загрузить Бэкап
                                </button>

                                <button 
                                    onClick={handleReset}
                                    className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 py-2 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors mt-2"
                                >
                                    <Icons.Delete className="w-4 h-4" />
                                    Полный Сброс
                                </button>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept=".json,application/json" 
                                    className="hidden" 
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 text-xs text-slate-400 text-center border-t border-slate-100 dark:border-slate-800">
                           Версия данных: v2 (Stable)
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity (8 cols) */}
                <div className="lg:col-span-8">
                     <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide flex items-center gap-2">
                                <Icons.Clock className="w-4 h-4 text-slate-400" />
                                Последние изменения
                            </h3>
                            <span className="text-xs font-mono text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                {recent.length}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                             {recent.map(article => (
                                <div 
                                    key={article.id} 
                                    onClick={() => onNavigate('article', article.id)}
                                    className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group flex items-center justify-between"
                                >
                                    <div className="flex flex-col gap-1 w-3/4">
                                        <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                                            {article.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${categories.find(c => c.id === article.categoryId)?.id === 'characters' ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                                            {categories.find(c => c.id === article.categoryId)?.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {new Date(article.lastModified).toLocaleDateString()}
                                        </span>
                                        <Icons.ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                            {recent.length === 0 && (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                        <Icons.Clock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Нет недавних изменений</p>
                                    <p className="text-xs text-slate-400 mt-1">Создайте новую статью или отредактируйте существующую.</p>
                                </div>
                            )}
                        </div>
                     </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
