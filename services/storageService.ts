
import { Article, Category, WikiBlock, SubCategory } from '../types';
import { INITIAL_ARTICLES, INITIAL_CATEGORIES } from '../data/initial_data';

// STABLE KEYS: These will not change in future updates, ensuring data persists.
const STABLE_KEY_ARTICLES = 'bookwiki_data_articles_stable_v2';
const STABLE_KEY_CATEGORIES = 'bookwiki_data_categories_stable_v2';

// Utility for safe UUID generation
export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getCategories = (): Category[] => {
  const stored = localStorage.getItem(STABLE_KEY_CATEGORIES);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  localStorage.setItem(STABLE_KEY_CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  return INITIAL_CATEGORIES;
};

export const getArticles = (): Article[] => {
  const stored = localStorage.getItem(STABLE_KEY_ARTICLES);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  localStorage.setItem(STABLE_KEY_ARTICLES, JSON.stringify(INITIAL_ARTICLES));
  return INITIAL_ARTICLES;
};

export const getArticleById = (id: string): Article | undefined => {
  const articles = getArticles();
  return articles.find(a => a.id === id);
};

export const saveArticle = (article: Article): void => {
  const articles = getArticles();
  const index = articles.findIndex(a => a.id === article.id);
  
  if (index >= 0) {
    articles[index] = { ...article, lastModified: Date.now() };
  } else {
    articles.push({ ...article, lastModified: Date.now() });
  }
  
  localStorage.setItem(STABLE_KEY_ARTICLES, JSON.stringify(articles));
};

export const deleteArticle = (id: string): void => {
    const articles = getArticles().filter(a => a.id !== id);
    localStorage.setItem(STABLE_KEY_ARTICLES, JSON.stringify(articles));
}

export const createNewArticle = (title: string, categoryId: string): Article => {
    const newArticle: Article = {
        id: generateId(),
        title,
        categoryId,
        lastModified: Date.now(),
        tags: [],
        blocks: [
            { id: generateId(), type: 'heading', content: 'Введение' },
            { id: generateId(), type: 'paragraph', content: 'Текст...' }
        ]
    };
    saveArticle(newArticle);
    return newArticle;
}

export const searchArticles = (query: string): Article[] => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    const articles = getArticles();
    return articles.filter(article => {
        if (article.title.toLowerCase().includes(lowerQuery)) return true;
        if (article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
        return article.blocks.some(block => {
            if (typeof block.content === 'string') {
                return block.content.toLowerCase().includes(lowerQuery);
            }
            if (typeof block.content === 'object') {
                return Object.values(block.content).some(val => val.toLowerCase().includes(lowerQuery));
            }
            return false;
        });
    });
};

export const getRecentArticles = (limit: number = 5): Article[] => {
  const articles = getArticles();
  return articles.sort((a, b) => b.lastModified - a.lastModified).slice(0, limit);
};

export const findSubcategoryForArticle = (article: Article, category: Category): SubCategory | undefined => {
    if (!category.subcategories) return undefined;
    return category.subcategories.find(sub => 
        sub.filterTags.some(tag => article.tags.includes(tag))
    );
};

// --- DATA MANAGEMENT ---

export const exportData = () => {
    const data = {
        articles: getArticles(),
        categories: getCategories(),
        exportDate: new Date().toISOString(),
        appVersion: 'stable_v2'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `wiki_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importData = async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const json = JSON.parse(text);
                
                let success = false;

                // Case 1: Full Backup Format
                if (json.articles && Array.isArray(json.articles)) {
                    localStorage.setItem(STABLE_KEY_ARTICLES, JSON.stringify(json.articles));
                    success = true;
                }
                
                if (json.categories && Array.isArray(json.categories)) {
                    localStorage.setItem(STABLE_KEY_CATEGORIES, JSON.stringify(json.categories));
                    success = true;
                }

                // Case 2: Simple Array Format (Legacy)
                if (Array.isArray(json)) {
                    // Check if it looks like articles
                    if (json.length > 0 && json[0].id && json[0].title) {
                         localStorage.setItem(STABLE_KEY_ARTICLES, JSON.stringify(json));
                         success = true;
                    }
                }

                if (success) {
                    resolve(true);
                } else {
                    reject(new Error("Invalid data format"));
                }
            } catch (err) {
                console.error("Failed to parse backup file", err);
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};

export const resetToDefaults = () => {
    localStorage.removeItem(STABLE_KEY_ARTICLES);
    localStorage.removeItem(STABLE_KEY_CATEGORIES);
    // Force reload to apply initial data
    window.location.reload();
};
