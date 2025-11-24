
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icon';
import { Breadcrumb, Category, Article } from '../types';
import { getCategories, searchArticles } from '../services/storageService';
import AiChatWindow from './AiChatWindow';
import { getCategoryTheme } from '../utils/themeUtils';

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbs: Breadcrumb[];
  onNavigate: (page: string, id?: string) => void;
  currentPath: string;
  onSearch?: (query: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, breadcrumbs, onNavigate, currentPath, onSearch }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [liveResults, setLiveResults] = useState<Article[]>([]);
  const [openCatDropdown, setOpenCatDropdown] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setCategories(getCategories());
    
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    // Click outside handler for search and dropdowns
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setLiveResults([]);
        }
        if (navRef.current && !navRef.current.contains(event.target as Node)) {
             // Let mouseleave handle closure
        }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      if (q.trim().length > 1) {
          setLiveResults(searchArticles(q).slice(0, 5));
      } else {
          setLiveResults([]);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
          onSearch(searchQuery);
          setLiveResults([]);
      }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      
      {/* FIXED TOP HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-sm border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-300">
          
          {/* Top Row: Logo, Nav, Search, Actions */}
          <header className="h-20 flex items-center justify-between px-4 md:px-6 lg:px-10 max-w-[1920px] mx-auto w-full gap-4">
            
            {/* Left: Logo */}
            <div className="flex items-center shrink-0">
                <button 
                  onClick={() => onNavigate('dashboard')} 
                  className="flex items-center gap-3 font-serif font-bold transition-all duration-200 hover:opacity-80"
                  title="На главную"
                >
                  <Icons.BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
                  <span className="text-xl md:text-2xl leading-tight hidden lg:block text-slate-900 dark:text-white">Wiki</span>
                </button>
            </div>

             {/* Center: Navigation Items */}
             <nav ref={navRef} className="flex items-center gap-1 md:gap-2 mx-auto h-full">
                {categories.map(cat => {
                    const IconComponent = (Icons as any)[cat.icon] || Icons.BookOpen;
                    const isActive = currentPath.startsWith(`category/${cat.id}`);
                    const isOpen = openCatDropdown === cat.id;

                    return (
                    <div 
                        key={cat.id} 
                        className="relative group h-full flex items-center"
                        onMouseEnter={() => setOpenCatDropdown(cat.id)}
                        onMouseLeave={() => setOpenCatDropdown(null)}
                    >
                        <button 
                            onClick={() => { onNavigate('category', cat.id); setOpenCatDropdown(null); }}
                            className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-sm md:text-base font-medium transition-all duration-200
                            ${isActive || isOpen
                                ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                            `}
                        >
                            <IconComponent className="w-5 h-5" />
                            <span className="hidden xl:inline">{cat.name}</span>
                        </button>
                        
                        {/* Dropdown */}
                        {isOpen && (
                            <div className="absolute top-full left-0 pt-2 w-56 animate-scale-in z-50">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden">
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                        <button 
                                            onClick={() => { onNavigate('category', cat.id); setOpenCatDropdown(null); }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm"
                                        >
                                            Все материалы
                                        </button>
                                    </div>
                                    <div className="p-2 flex flex-col gap-1">
                                        {cat.subcategories?.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => { onNavigate('category', `${cat.id}:${sub.id}`); setOpenCatDropdown(null); }}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
                                            >
                                                {sub.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    );
                })}
            </nav>

            {/* Right: Search, Theme, Profile */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                {/* Search */}
               <div ref={searchContainerRef} className="relative group hidden md:block z-50">
                  <input 
                    type="text" 
                    placeholder="Поиск..." 
                    value={searchQuery}
                    onChange={handleSearchInput}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery.length > 1 && setLiveResults(searchArticles(searchQuery).slice(0, 5))}
                    className="
                        bg-slate-100 dark:bg-slate-800 
                        border-none rounded-full py-2.5 px-5 pl-11 text-base 
                        focus:ring-2 focus:ring-emerald-500 
                        w-40 lg:w-64 
                        transition-all 
                        placeholder-slate-400 dark:placeholder-slate-500
                        text-slate-700 dark:text-slate-200
                    "
                  />
                  <Icons.Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  
                  {/* Live Results Dropdown */}
                  {liveResults.length > 0 && (
                      <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                              Быстрый поиск
                          </div>
                          {liveResults.map(res => (
                              <button
                                key={res.id}
                                onClick={() => { onNavigate('article', res.id); setLiveResults([]); setSearchQuery(''); }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                              >
                                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{res.title}</div>
                                  <div className="text-xs text-slate-400 truncate mt-0.5">
                                    {res.blocks.find(b => b.type === 'paragraph')?.content as string || '...'}
                                  </div>
                              </button>
                          ))}
                          <button 
                            onClick={() => { if(onSearch) onSearch(searchQuery); setLiveResults([]); }}
                            className="w-full text-center py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                          >
                              Показать все результаты
                          </button>
                      </div>
                  )}
               </div>

               <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

               {/* AI Toggle */}
               <button 
                 onClick={() => setIsAiOpen(!isAiOpen)}
                 className={`
                    flex items-center gap-2 px-3 py-2 rounded-full transition-all border
                    ${isAiOpen 
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                 `}
               >
                   <Icons.Sparkles className="w-5 h-5" />
                   <span className="hidden lg:inline font-bold text-sm">AI</span>
               </button>

               <button 
                onClick={toggleTheme}
                className="text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
               >
                   {theme === 'light' ? <Icons.Moon className="w-6 h-6" /> : <Icons.Sun className="w-6 h-6" />}
               </button>
               
               <button className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors">
                  A
               </button>
            </div>
          </header>

          {/* Bottom Row: Breadcrumbs */}
          <div className="h-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center">
             <div className="w-full max-w-7xl px-4 md:px-10">
                 <nav className="flex items-center text-xs uppercase tracking-wide font-bold text-slate-500 dark:text-slate-500 overflow-hidden whitespace-nowrap w-full">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <Icons.ChevronRight className="w-4 h-4 mx-3 text-slate-300 dark:text-slate-700 flex-shrink-0" />}
                      <button 
                        onClick={() => {
                            if (crumb.path) {
                                // Ensure we split correctly and rejoin the rest as ID
                                const parts = crumb.path.split(':');
                                const page = parts[0];
                                const id = parts.length > 1 ? parts.slice(1).join(':') : undefined;
                                onNavigate(page, id);
                            }
                        }}
                        className={`
                            transition-colors truncate max-w-[200px] md:max-w-[250px]
                            ${index === breadcrumbs.length - 1 
                                ? 'text-slate-800 dark:text-slate-200 pointer-events-none' 
                                : 'hover:text-emerald-600 dark:hover:text-emerald-400'}
                        `}
                        disabled={!crumb.path}
                      >
                        {crumb.label}
                      </button>
                    </React.Fragment>
                  ))}
                </nav>
             </div>
          </div>
      </div>

      {/* Spacer for fixed header (h-20 + h-12 = 8rem/128px) */}
      <div className="h-32 w-full"></div>

      {/* Page Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-10 relative z-0">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* AI CHAT WINDOW */}
      <AiChatWindow isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

      {/* Scroll to Top */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-10 right-10 bg-slate-900 dark:bg-emerald-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-[50] hover:bg-emerald-600 dark:hover:bg-emerald-500 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
      >
        <Icons.ArrowUp className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Layout;
