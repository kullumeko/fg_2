
import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { Icons } from './Icon';
import MarkdownEditor from './BlockEditor'; 
import { marked } from 'marked';
import { articleToMarkdown, markdownToBlocks } from '../services/markdownSerializer';

interface ArticleViewerProps {
  article: Article;
  onUpdate: (updatedArticle: Article) => void;
  onDelete: () => void;
  onSearch: (query: string) => void;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ article, onUpdate, onDelete, onSearch }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [headings, setHeadings] = useState<{id: string, text: string}[]>([]);

  useEffect(() => {
      const h = article.blocks
        .filter(b => b.type === 'heading')
        .map(b => ({ id: b.id, text: b.content as string }));
      setHeadings(h);
  }, [article.blocks]);

  const handleSave = (newTitle: string, newContentMarkdown: string, newTags: string[]) => {
      const newBlocks = markdownToBlocks(newContentMarkdown);
      onUpdate({
          ...article,
          title: newTitle,
          tags: newTags,
          blocks: newBlocks,
          lastModified: Date.now()
      });
      setIsEditing(false);
  };

  const scrollToBlock = (id: string) => {
      const el = document.getElementById(`block-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isEditing) {
      const initialMarkdown = articleToMarkdown(article.blocks);
      return (
          <MarkdownEditor 
            initialTitle={article.title}
            initialContent={initialMarkdown}
            initialTags={article.tags}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            articleContext={article.title}
            onDelete={onDelete}
          />
      );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Read Mode Header */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b pb-8 border-slate-200 dark:border-slate-800 gap-6">
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-4 mb-3">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
                {article.categoryId}
            </span>
            <span className="text-slate-400 text-sm flex items-center gap-1.5">
                <Icons.Clock className="w-4 h-4" />
                {new Date(article.lastModified).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white leading-tight">{article.title}</h1>
          
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {article.tags.map(tag => (
                <button 
                    key={tag} 
                    onClick={() => onSearch(tag)}
                    className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                    {tag}
                </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 shrink-0 self-end md:self-start">
           <button 
             onClick={() => setIsEditing(true)} 
             className="flex items-center gap-2.5 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 px-6 py-3 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-400 transition-all shadow-md text-base font-bold"
           >
             <Icons.Edit className="w-5 h-5" />
             Редактировать
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Main Content Column */}
         <div className="lg:col-span-8 space-y-8">
            {article.blocks.filter(b => b.type !== 'infobox').map((block) => (
                <div id={`block-${block.id}`} key={block.id}>
                    <BlockRenderer block={block} />
                </div>
            ))}
            
            {article.blocks.filter(b => b.type !== 'infobox').length === 0 && (
                <div className="text-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-slate-400 mb-6 font-serif italic text-lg">Статья пока пуста.</p>
                    <button onClick={() => setIsEditing(true)} className="text-emerald-600 font-medium hover:underline flex items-center justify-center gap-2.5 w-full text-base">
                        <Icons.Edit className="w-5 h-5" />
                        Начать писать
                    </button>
                </div>
            )}
         </div>

         {/* Sidebar / Infobox Column */}
         <div className="lg:col-span-4 space-y-10">
            {/* Table of Contents */}
            {headings.length > 0 && (
                <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Icons.List className="w-4 h-4" /> Содержание
                    </h4>
                    <ul className="space-y-1.5">
                        {headings.map(h => (
                            <li key={h.id}>
                                <button 
                                    onClick={() => scrollToBlock(h.id)}
                                    className="text-base text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-2 rounded-md w-full text-left truncate transition-colors"
                                >
                                    {h.text}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="space-y-8">
                {article.blocks.filter(b => b.type === 'infobox').map(block => (
                   <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const BlockRenderer: React.FC<{ block: any }> = ({ block }) => {
    if (block.type === 'heading') {
        return (
            <div className="group/heading relative mt-10 mb-6">
                <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 pb-2.5 border-b-2 border-emerald-100/50 dark:border-emerald-900/50 inline-block pr-10 relative z-0">
                    {block.content}
                    <div className="absolute bottom-0 left-0 w-1/3 h-1 bg-emerald-400 dark:bg-emerald-600"></div>
                </h2>
            </div>
        );
    }
    if (block.type === 'paragraph') {
        const html = marked.parse(block.content, { async: false }) as string;
        return (
            <div 
                className="text-slate-700 dark:text-slate-300 leading-8 font-serif text-xl prose prose-lg prose-slate dark:prose-invert max-w-none prose-p:my-4 prose-strong:text-slate-900 dark:prose-strong:text-white prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-blockquote:border-l-4 prose-blockquote:border-emerald-300 dark:prose-blockquote:border-emerald-700 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-900 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-ul:list-disc prose-ul:pl-6"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }
    if (block.type === 'infobox') {
            return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-widest flex items-center gap-2">
                        <Icons.BookOpen className="w-4 h-4 text-emerald-500" />
                        Досье
                    </span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    </div>
                </div>
                <table className="w-full text-base">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Object.entries(block.content as Record<string, string>).map(([k, v]) => (
                            <tr key={k} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 px-5 font-semibold text-slate-500 dark:text-slate-400 w-1/3 align-top bg-slate-50/30 dark:bg-slate-800/30">{k}</td>
                                <td className="py-3 px-5 text-slate-800 dark:text-slate-200 align-top font-medium">{v}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    return null;
};

export default ArticleViewer;
