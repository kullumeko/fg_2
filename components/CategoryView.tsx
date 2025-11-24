
import React, { useState, useMemo } from 'react';
import { Article, Category, SubCategory } from '../types';
import { Icons } from './Icon';
import { getCategoryTheme } from '../utils/themeUtils';
import { marked } from 'marked';

interface CategoryViewProps {
  categoryId: string;
  initialSubCategoryId?: string;
  categoryName: string;
  articles: Article[];
  onNavigate: (page: string, id: string) => void;
  onCreate: () => void;
  categories: Category[];
  onSearch: (query: string) => void;
}

type ViewMode = 'grid-lg' | 'grid-sm' | 'list-lg' | 'list-sm';
type SortMethod = 'date' | 'alpha';
type SortOrder = 'asc' | 'desc';

const CategoryView: React.FC<CategoryViewProps> = ({ 
  categoryId, 
  initialSubCategoryId,
  categoryName, 
  articles, 
  onNavigate, 
  onCreate,
  categories,
  onSearch
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid-lg');
  const [sortMethod, setSortMethod] = useState<SortMethod>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Use props as source of truth for navigation state
  const activeSubCatId = initialSubCategoryId || null;

  const currentCategory = categories.find(c => c.id === categoryId);
  const subcategories = currentCategory?.subcategories || [];
  
  // Resolve active subcategory object
  const activeSubCategory = subcategories.find(s => s.id === activeSubCatId);

  const theme = getCategoryTheme(categoryId);
  const IconComp = currentCategory ? ((Icons as any)[currentCategory.icon] || Icons.BookOpen) : Icons.BookOpen;

  const filteredArticles = useMemo(() => {
    if (!activeSubCatId) return articles;
    const activeSub = subcategories.find(s => s.id === activeSubCatId);
    if (!activeSub) return articles;
    return articles.filter(article => 
        activeSub.filterTags.some(tag => article.tags.includes(tag))
    );
  }, [articles, activeSubCatId, subcategories]);

  const sortedArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => {
      let comparison = 0;
      if (sortMethod === 'date') {
        comparison = a.lastModified - b.lastModified;
      } else {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredArticles, sortMethod, sortOrder]);

  const toggleSort = (method: SortMethod) => {
    if (sortMethod === method) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortMethod(method);
      setSortOrder('asc');
    }
  };

  const getSubcategoryCount = (sub: SubCategory) => {
      return articles.filter(article => 
        sub.filterTags.some(tag => article.tags.includes(tag))
      ).length;
  };

  // Helper for navigation on tab click
  const handleTabClick = (subId: string | null) => {
      if (subId) {
          onNavigate('category', `${categoryId}:${subId}`);
      } else {
          onNavigate('category', categoryId);
      }
  };

  return (
    <div className="animate-fade-in pb-24">
       {/* Category Header */}
       <div className={`relative rounded-2xl overflow-hidden shadow-lg mb-10 ${theme.bg}`}>
            <IconComp className={`absolute -right-12 -bottom-12 w-80 h-80 opacity-10 rotate-12 ${theme.text}`} />
            <div className="relative z-10 px-10 py-10 md:py-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                <div>
                    <span className={`font-bold uppercase tracking-widest text-xs mb-3 block opacity-70 ${theme.text}`}>
                        {activeSubCategory ? `${categoryName} / ${activeSubCategory.name}` : 'Картотека'}
                    </span>
                    <h1 className={`text-5xl font-serif font-bold ${theme.text} mb-3`}>
                        {activeSubCategory ? activeSubCategory.name : categoryName}
                    </h1>
                    <p className={`text-base opacity-80 max-w-2xl ${theme.text}`}>
                        {activeSubCategory ? `Материалы раздела "${activeSubCategory.name}"` : currentCategory?.description}
                    </p>
                </div>
                <button 
                  onClick={onCreate} 
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-8 py-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all flex items-center gap-2 shadow-lg font-bold text-base shrink-0"
                >
                    <Icons.Plus className="w-5 h-5" />
                    Новая запись
                </button>
            </div>
       </div>

       {/* Toolbar */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          
          {/* Subcategories Tabs */}
          <div className="flex-1 overflow-x-auto custom-scrollbar w-full md:w-auto">
             <div className="flex items-center gap-3">
                 <button 
                   onClick={() => handleTabClick(null)}
                   className={`
                      px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap transition-all
                      ${activeSubCatId === null 
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm' 
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                   `}
                 >
                     Все
                     <span className={`ml-2 text-xs opacity-70`}>{articles.length}</span>
                 </button>
                 
                 {subcategories.map(sub => {
                     const count = getSubcategoryCount(sub);
                     const isActive = activeSubCatId === sub.id;
                     return (
                         <button 
                           key={sub.id}
                           onClick={() => handleTabClick(sub.id)}
                           className={`
                              px-4 py-2 rounded-lg text-base font-medium whitespace-nowrap transition-all flex items-center gap-2
                              ${isActive 
                                  ? `${theme.accent} text-slate-900 dark:text-white shadow-sm` 
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                           `}
                         >
                             {sub.name}
                             {count > 0 && <span className="opacity-70 bg-black/10 dark:bg-white/10 px-1.5 rounded-full text-[10px]">{count}</span>}
                         </button>
                     );
                 })}
             </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
              {/* Sort Controls */}
              <div className="flex bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-1.5">
                 <button 
                   onClick={() => toggleSort('alpha')}
                   className={`p-2 rounded-md transition-colors ${sortMethod === 'alpha' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                   title="По алфавиту"
                 >
                   {sortOrder === 'asc' && sortMethod === 'alpha' ? <Icons.SortAsc className="w-5 h-5" /> : <Icons.SortDesc className="w-5 h-5" />}
                 </button>
                 <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1 my-1"></div>
                 <button 
                   onClick={() => toggleSort('date')}
                   className={`p-2 rounded-md transition-colors ${sortMethod === 'date' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                   title="По дате"
                 >
                   <Icons.Calendar className="w-5 h-5" />
                 </button>
              </div>

              {/* View Mode Controls */}
              <div className="flex bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-1.5">
                 <button onClick={() => setViewMode('grid-lg')} className={`p-2 rounded-md ${viewMode === 'grid-lg' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}><Icons.Layout className="w-5 h-5" /></button>
                 <button onClick={() => setViewMode('grid-sm')} className={`p-2 rounded-md ${viewMode === 'grid-sm' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}><Icons.Grid className="w-5 h-5" /></button>
                 <button onClick={() => setViewMode('list-lg')} className={`p-2 rounded-md ${viewMode === 'list-lg' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}><Icons.List className="w-5 h-5" /></button>
                 <button onClick={() => setViewMode('list-sm')} className={`p-2 rounded-md ${viewMode === 'list-sm' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}><Icons.Compact className="w-5 h-5" /></button>
              </div>
          </div>
       </div>

       {/* Content Grid/List */}
       <div className={`
         ${viewMode === 'grid-lg' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : ''}
         ${viewMode === 'grid-sm' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : ''}
         ${viewMode === 'list-lg' ? 'space-y-6' : ''}
         ${viewMode === 'list-sm' ? 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800' : ''}
       `}>
           {sortedArticles.map(article => (
               <ArticleCard 
                 key={article.id} 
                 article={article} 
                 mode={viewMode} 
                 onClick={() => onNavigate('article', article.id)}
                 theme={theme}
                 onSearch={onSearch}
               />
           ))}
           {sortedArticles.length === 0 && (
               <div className="col-span-full text-center py-24 bg-slate-50/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                   <Icons.FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                   <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 text-lg">Здесь пока пусто.</p>
                   <p className="text-sm text-slate-400 dark:text-slate-600">Нажмите "Новая запись" чтобы добавить материал.</p>
               </div>
           )}
       </div>
    </div>
  );
};

interface ArticleCardProps {
    article: Article;
    mode: ViewMode;
    onClick: () => void;
    theme: any;
    onSearch: (q: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, mode, onClick, theme, onSearch }) => {
    const rawDescription = article.blocks.find(b => b.type === 'paragraph')?.content as string || 'Нет описания...';
    // Clean markdown for preview (parse inline to allow bold/italic but no blocks)
    const htmlDescription = marked.parseInline(rawDescription);

    const handleTagClick = (e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        onSearch(tag);
    };

    // Large Grid (Default)
    if (mode === 'grid-lg') {
        return (
             <div 
                onClick={onClick}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
             >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${theme.bg} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <h3 className="font-serif font-bold text-2xl text-slate-800 dark:text-slate-100 mb-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{article.title}</h3>
                <div 
                    className="text-base text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 flex-grow leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlDescription as string }}
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                     <div className="flex gap-2 flex-wrap">
                         {article.tags.slice(0, 2).map(t => (
                             <button 
                                key={t} 
                                onClick={(e) => handleTagClick(e, t)}
                                className="text-xs uppercase font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded text-slate-500 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                             >
                                {t}
                             </button>
                         ))}
                     </div>
                     <span className="text-sm text-slate-400 whitespace-nowrap ml-2">
                         {new Date(article.lastModified).toLocaleDateString()}
                     </span>
                </div>
             </div>
        );
    }

    // Small Grid
    if (mode === 'grid-sm') {
        return (
            <div 
               onClick={onClick}
               className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group"
            >
               <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 line-clamp-2 leading-tight text-base">{article.title}</h3>
               <div className="flex flex-wrap gap-1.5 mt-2">
                   {article.tags.slice(0, 3).map(t => (
                       <button 
                            key={t}
                            onClick={(e) => handleTagClick(e, t)}
                            className="text-[10px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 transition-colors"
                        >
                           {t}
                       </button>
                   ))}
               </div>
            </div>
       );
    }

    // Large List
    if (mode === 'list-lg') {
        return (
            <div 
               onClick={onClick}
               className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group flex items-start gap-6"
            >
               <div className={`rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0 shadow-sm ${theme.bg}`}>
                   <Icons.FileText className={`w-7 h-7 ${theme.text}`} />
               </div>
               <div className="flex-grow">
                   <div className="flex justify-between items-start">
                       <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{article.title}</h3>
                       <span className="text-xs text-slate-400 ml-4 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded">{new Date(article.lastModified).toLocaleDateString()}</span>
                   </div>
                   <div 
                        className="text-base text-slate-500 dark:text-slate-400 line-clamp-1 mt-1.5 mb-3 prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: htmlDescription as string }}
                   />
                   <div className="flex gap-2">
                       {article.tags.map(t => (
                           <button 
                                key={t} 
                                onClick={(e) => handleTagClick(e, t)}
                                className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 hover:text-emerald-700 transition-colors"
                            >
                               {t}
                           </button>
                       ))}
                   </div>
               </div>
            </div>
       );
    }

    // Compact List
    if (mode === 'list-sm') {
        return (
            <div 
               onClick={onClick}
               className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group flex items-center justify-between transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
               <div className="flex items-center gap-4 overflow-hidden">
                   <Icons.FileText className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 flex-shrink-0" />
                   <h3 className="font-medium text-lg text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">{article.title}</h3>
                   {article.tags.length > 0 && (
                       <button 
                           onClick={(e) => handleTagClick(e, article.tags[0])}
                           className="text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 transition-colors"
                        >
                           {article.tags[0]}
                       </button>
                   )}
               </div>
               <span className="text-sm text-slate-400 dark:text-slate-500 flex-shrink-0 ml-6">{new Date(article.lastModified).toLocaleDateString()}</span>
            </div>
       );
    }

    return null;
}

export default CategoryView;
