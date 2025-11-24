
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ArticleViewer from './components/ArticleViewer';
import CreateModal from './components/CreateModal';
import CategoryView from './components/CategoryView';
import { Breadcrumb, Article } from './types';
import { getArticleById, getCategories, saveArticle, getArticles, createNewArticle, searchArticles, deleteArticle, findSubcategoryForArticle } from './services/storageService';
import { Icons } from './components/Icon';
import { marked } from 'marked';

const App: React.FC = () => {
  // --- ROUTING LOGIC (Hash Router for GitHub Pages compatibility) ---
  
  const getRouteFromHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) return { page: 'dashboard', id: undefined };
    
    const parts = hash.split('/');
    const page = parts[0] || 'dashboard';
    // Join rest of parts for ID to support potential complex IDs, though usually simple
    // Decode URI component to handle search queries with spaces/special chars
    const rawId = parts.slice(1).join('/');
    const id = rawId ? decodeURIComponent(rawId) : undefined;
    
    return { page, id };
  };

  const [route, setRoute] = useState(getRouteFromHash());
  const { page: currentPage, id: currentId } = route;

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavigate = (page: string, id?: string) => {
    const newHash = id ? `/${page}/${encodeURIComponent(id)}` : `/${page}`;
    window.location.hash = newHash;
    // Scroll handled by browser usually on hash change, but we enforce top
    window.scrollTo(0,0);
  };

  // --- STATE ---

  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [dataVersion, setDataVersion] = useState(0); // Trigger re-renders on data change

  // Category view state
  const [categoryArticles, setCategoryArticles] = useState<Article[]>([]);
  const [currentCategoryName, setCurrentCategoryName] = useState('');
  
  // Search view state
  const [searchResults, setSearchResults] = useState<Article[]>([]);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');

  // --- ACTIONS ---

  const handleSearch = (query: string) => {
      // Navigate to search route, the Effect will handle performing the search
      handleNavigate('search', query);
  };

  const openCreateModal = (catId?: string) => {
      // If we are on a category page and no ID is provided, use current category (strip subcat id if present)
      if (!catId && currentPage === 'category' && currentId) {
          setTargetCategoryId(currentId.split(':')[0]);
      } else {
          setTargetCategoryId(catId || getCategories()[0].id);
      }
      setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (title: string) => {
      const newArt = createNewArticle(title, targetCategoryId);
      setDataVersion(v => v + 1);
      handleNavigate('article', newArt.id);
  };

  const handleArticleUpdate = (updated: Article) => {
      saveArticle(updated);
      setDataVersion(v => v + 1);
  };

  const handleArticleDelete = (id: string) => {
      // Confirmation is handled inside ArticleViewer
      deleteArticle(id);
      setDataVersion(v => v + 1);
      // Clear ID before navigating to avoid race conditions in rendering
      handleNavigate('dashboard');
  };

  // --- EFFECTS ---

  // 1. Perform Search
  useEffect(() => {
    if (currentPage === 'search' && currentId) {
        setSearchResults(searchArticles(currentId));
    } else {
        setSearchResults([]);
    }
  }, [currentPage, currentId, dataVersion]);

  // 2. Load Category Data
  useEffect(() => {
    if (currentPage === 'category' && currentId) {
        const [catId] = currentId.split(':');
        const all = getArticles();
        setCategoryArticles(all.filter(a => a.categoryId === catId));
        const cats = getCategories();
        setCurrentCategoryName(cats.find(c => c.id === catId)?.name || 'Категория');
    }
  }, [currentPage, currentId, dataVersion]);

  // 3. Update Breadcrumbs
  useEffect(() => {
    const crumbs: Breadcrumb[] = [
      { label: 'Главная', path: 'dashboard' }
    ];

    if (currentPage === 'category' && currentId) {
      const [catId, subId] = currentId.split(':');
      const cats = getCategories();
      const cat = cats.find(c => c.id === catId);
      if (cat) {
        // If we have a subId, the parent category crumb should link to the root category
        crumbs.push({ label: cat.name, path: subId ? `category:${cat.id}` : undefined });
        
        if (subId) {
            const sub = cat.subcategories?.find(s => s.id === subId);
            if (sub) {
                 // The subcategory crumb points to itself
                 crumbs.push({ label: sub.name, path: `category:${cat.id}:${sub.id}` });
            }
        }
      }
    }
    
    if (currentPage === 'search' && currentId) {
        crumbs.push({ label: `Поиск: ${currentId}` });
    }

    if (currentPage === 'article' && currentId) {
      const article = getArticleById(currentId);
      if (article) {
        const cats = getCategories();
        const cat = cats.find(c => c.id === article.categoryId);
        if (cat) {
          crumbs.push({ label: cat.name, path: `category:${cat.id}` });
          
          // Try to find subcategory based on tags
          const sub = findSubcategoryForArticle(article, cat);
          if (sub) {
              crumbs.push({ label: sub.name, path: `category:${cat.id}:${sub.id}` });
          }
        }
        crumbs.push({ label: article.title });
      }
    }

    setBreadcrumbs(crumbs);
  }, [currentPage, currentId, dataVersion]);


  // --- RENDER ---

  return (
    <>
    <Layout 
      breadcrumbs={breadcrumbs} 
      onNavigate={handleNavigate} 
      currentPath={currentId ? `${currentPage}/${currentId.split(':')[0]}` : currentPage}
      onSearch={handleSearch}
    >
      {currentPage === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} onCreate={openCreateModal} />
      )}

      {currentPage === 'article' && currentId && (
        (() => {
            const article = getArticleById(currentId);
            if (!article) return <div className="text-center py-20 text-slate-400">Статья не найдена (ID: {currentId})</div>;
            return <ArticleViewer article={article} onUpdate={handleArticleUpdate} onDelete={() => handleArticleDelete(article.id)} onSearch={handleSearch} />;
        })()
      )}

      {currentPage === 'search' && (
          <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Результаты поиска</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-8">По запросу: <span className="font-semibold text-slate-800 dark:text-slate-200">"{currentId}"</span> найдено {searchResults.length} статей.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {searchResults.map(article => {
                     const rawDesc = article.blocks.find(b => b.type === 'paragraph')?.content as string || 'Нет описания...';
                     const htmlDesc = marked.parseInline(rawDesc);
                     return (
                         <div 
                            key={article.id}
                            onClick={() => handleNavigate('article', article.id)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer group"
                         >
                            <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-slate-100 mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{article.title}</h3>
                             <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
                                 {getCategories().find(c => c.id === article.categoryId)?.name}
                             </p>
                            <div 
                                className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: htmlDesc as string }}
                            />
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                 <div className="flex gap-2">
                                     {article.tags.slice(0, 2).map(t => (
                                         <button 
                                            key={t}
                                            onClick={(e) => { e.stopPropagation(); handleSearch(t); }}
                                            className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 hover:text-emerald-700 transition-colors"
                                        >
                                            {t}
                                        </button>
                                     ))}
                                 </div>
                                 <span className="text-xs text-slate-400">
                                     {new Date(article.lastModified).toLocaleDateString()}
                                 </span>
                            </div>
                         </div>
                     );
                 })}
                 {searchResults.length === 0 && (
                     <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <Icons.Search className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Ничего не найдено.</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">Попробуйте изменить запрос или поискать по тегам.</p>
                     </div>
                 )}
              </div>
          </div>
      )}

      {currentPage === 'category' && currentId && (
          <CategoryView 
            categoryId={currentId.split(':')[0]}
            initialSubCategoryId={currentId.split(':')[1]}
            categoryName={currentCategoryName}
            articles={categoryArticles}
            onNavigate={handleNavigate}
            onCreate={() => openCreateModal(currentId.split(':')[0])}
            categories={getCategories()}
            onSearch={handleSearch}
          />
      )}
    </Layout>
    
    <CreateModal 
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onSubmit={handleCreateSubmit}
      categoryName={getCategories().find(c => c.id === targetCategoryId)?.name}
    />
    </>
  );
};

export default App;
