
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icons } from './Icon';
import { generateWikiContent } from '../services/geminiService';
import { marked } from 'marked';

interface MarkdownEditorProps {
  initialContent: string;
  initialTitle: string;
  initialTags: string[];
  onSave: (title: string, content: string, tags: string[]) => void;
  onCancel: () => void;
  articleContext?: string;
  onDelete?: () => void;
}

type EditorMode = 'write' | 'split' | 'preview';

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  initialContent, 
  initialTitle, 
  initialTags,
  onSave, 
  onCancel, 
  articleContext,
  onDelete
}) => {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [mode, setMode] = useState<EditorMode>('split');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // History for Undo/Redo
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Parse markdown with custom infobox handling using lexer/parser approach
  const htmlContent = useMemo(() => {
      // 1. Lex the content into tokens
      const tokens = marked.lexer(content);

      // 2. Recursively traverse tokens to find and transform infobox code blocks
      const processToken = (token: any) => {
          if (token.type === 'code' && (token.lang || '').toLowerCase().trim() === 'infobox') {
              const raw = token.text || '';
              // Parse key-value pairs
              const rows = raw.split('\n')
                  .filter((line: string) => line.trim())
                  .map((line: string) => {
                      const splitIndex = line.indexOf(':');
                      if (splitIndex === -1) return '';
                      const key = line.substring(0, splitIndex).trim();
                      const val = line.substring(splitIndex + 1).trim();
                      
                      return `
                        <tr class="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td class="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 w-1/3 align-top bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase tracking-wide border-r border-slate-100 dark:border-slate-700 select-none">${key}</td>
                          <td class="py-2.5 px-4 text-slate-800 dark:text-slate-200 align-top font-medium text-base leading-relaxed">${val}</td>
                        </tr>
                      `;
                  }).join('');

              // Transform into an HTML token
              token.type = 'html';
              token.text = `
                <div class="not-prose my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
                  <div class="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span class="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-widest flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                          Досье
                      </span>
                  </div>
                  <table class="w-full border-collapse bg-white dark:bg-slate-900 text-left">
                      <tbody>
                          ${rows}
                      </tbody>
                  </table>
                </div>
              `;
              // Remove code properties so they don't interfere
              delete token.lang;
          }

          // Process children if they exist (e.g., in blockquotes)
          if (token.tokens && Array.isArray(token.tokens)) {
              token.tokens.forEach(processToken);
          }
      };

      tokens.forEach(processToken);

      // 3. Parse the modified tokens back to HTML
      return marked.parser(tokens);
  }, [content]);

  useEffect(() => {
     if (textareaRef.current && mode !== 'preview') {
         textareaRef.current.focus();
     }
  }, [mode]);

  // Sync scroll in split mode (Simple implementation)
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (mode === 'split' && previewRef.current) {
          const textarea = e.currentTarget;
          const percentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
          const preview = previewRef.current;
          preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
      }
  };

  const updateContent = (newContent: string) => {
      setContent(newContent);
      
      // Add to history with debounce-like behavior (simplified)
      const lastState = history[historyIndex];
      if (newContent !== lastState) {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(newContent);
          // Limit history size
          if (newHistory.length > 50) newHistory.shift();
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
      }
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          setContent(history[historyIndex - 1]);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          setHistoryIndex(historyIndex + 1);
          setContent(history[historyIndex + 1]);
      }
  };

  const handleAiAssist = async () => {
    setIsAiLoading(true);
    const prompt = `Expand or improve this article content. Maintain existing markdown structure (infoboxes, headings). 
    Context Title: ${title}.
    Current Content End: "${content.slice(-500)}"`;
    
    const result = await generateWikiContent(prompt, content, 'Wiki Article Editing');
    updateContent(result);
    setIsAiLoading(false);
  };

  const handleAddTag = () => {
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
          setTags([...tags, tagInput.trim()]);
          setTagInput('');
      }
  };

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));

  const confirmDelete = () => {
      if (onDelete) {
          onDelete();
      }
  };

  // Markdown Insertion Logic
  const insertMarkdown = (prefix: string, suffix: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);
      const before = text.substring(0, start);
      const after = text.substring(end);

      const newText = `${before}${prefix}${selectedText}${suffix}${after}`;
      updateContent(newText);

      setTimeout(() => {
          textarea.focus();
          const newCursorPos = start + prefix.length + selectedText.length;
          textarea.setSelectionRange(start + prefix.length, newCursorPos);
      }, 0);
  };

  const insertTemplate = (type: 'infobox') => {
      if (type === 'infobox') {
          const template = `\n\`\`\`infobox\nКлюч: Значение\nКлюч2: Значение2\n\`\`\`\n`;
          insertMarkdown(template);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
          switch(e.key.toLowerCase()) {
              case 'b': e.preventDefault(); insertMarkdown('**', '**'); break;
              case 'i': e.preventDefault(); insertMarkdown('*', '*'); break;
              case 's': e.preventDefault(); onSave(title, content, tags); break;
              case 'z': 
                  e.preventDefault(); 
                  if (e.shiftKey) handleRedo();
                  else handleUndo(); 
                  break;
          }
      }
  };

  return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[190] animate-fade-in" onClick={onCancel}></div>

        <div className={`flex flex-col bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in fixed z-[200] transition-all duration-300 ${isFullscreen ? 'inset-0 rounded-none' : 'top-32 bottom-8 left-4 right-4 md:left-20 md:right-20 lg:left-[15%] lg:right-[15%] xl:left-[20%] xl:right-[20%] rounded-xl'}`}>
          
          {/* Top Bar: Title & Actions */}
          <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0">
              <div className="flex-1 flex items-center gap-6 min-w-0">
                  <div className="flex-1 min-w-0">
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-2xl md:text-3xl font-bold font-serif bg-transparent border-none focus:ring-0 placeholder-slate-300 dark:placeholder-slate-600 text-slate-800 dark:text-slate-100 p-0"
                        placeholder="Название статьи..."
                    />
                    <div className="flex flex-wrap items-center gap-2.5 mt-2">
                        {tags.map(tag => (
                            <span key={tag} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs uppercase font-bold flex items-center gap-1.5">
                                {tag}
                                <button onClick={() => removeTag(tag)}><Icons.X className="w-3.5 h-3.5 hover:text-red-500" /></button>
                            </span>
                        ))}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5">
                            <span className="text-slate-400 text-sm">#</span>
                            <input 
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                className="w-24 text-sm outline-none bg-transparent placeholder-slate-300 text-slate-800 dark:text-slate-200"
                                placeholder="Тег..."
                            />
                            <button onClick={handleAddTag} className="text-emerald-500 hover:text-emerald-700"><Icons.Plus className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                  </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 z-[200]">
                   {onDelete && (
                       isDeleting ? (
                           <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 px-4 py-2 rounded-lg mr-2 animate-fade-in shadow-inner">
                               <span className="text-sm text-red-700 dark:text-red-400 font-bold uppercase tracking-wide">Удалить?</span>
                               <div className="flex items-center gap-2 border-l border-red-200 dark:border-red-800 pl-3">
                                   <button
                                       type="button"
                                       onMouseDown={(e) => { e.preventDefault(); confirmDelete(); }}
                                       className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm font-bold transition-colors"
                                   >
                                       Да
                                   </button>
                                   <button
                                       type="button"
                                       onMouseDown={(e) => { e.preventDefault(); setIsDeleting(false); }}
                                       className="text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 px-3 py-1 rounded text-sm font-medium transition-colors"
                                   >
                                       Нет
                                   </button>
                               </div>
                           </div>
                       ) : (
                           <button 
                             type="button"
                             onMouseDown={(e) => { e.preventDefault(); setIsDeleting(true); }}
                             className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 p-2.5 rounded transition-colors mr-2 cursor-pointer relative group"
                             title="Удалить статью"
                           >
                               <Icons.Delete className="w-6 h-6 group-hover:scale-110 transition-transform" />
                           </button>
                       )
                   )}
                   <button onClick={onCancel} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium px-4 py-2 text-base">Отмена</button>
                   <button 
                     onClick={() => onSave(title, content, tags)}
                     className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2.5 shadow-sm text-base"
                   >
                       <Icons.Save className="w-5 h-5" />
                       Сохранить
                   </button>
              </div>
          </div>

          {/* Editor Toolbar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between gap-3 overflow-x-auto shrink-0 custom-scrollbar">
              <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <ToolbarButton icon={<Icons.Undo className="w-5 h-5" />} onClick={handleUndo} title="Отменить (Ctrl+Z)" disabled={historyIndex <= 0} />
                    <ToolbarButton icon={<Icons.Redo className="w-5 h-5" />} onClick={handleRedo} title="Повторить (Ctrl+Shift+Z)" disabled={historyIndex >= history.length - 1} />
                  </div>
                  
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                  <ToolbarButton icon={<Icons.Heading1 className="w-5 h-5" />} onClick={() => insertMarkdown('# ')} title="Заголовок 1" />
                  <ToolbarButton icon={<Icons.Heading2 className="w-5 h-5" />} onClick={() => insertMarkdown('## ')} title="Заголовок 2" />
                  <ToolbarButton icon={<Icons.Heading3 className="w-5 h-5" />} onClick={() => insertMarkdown('### ')} title="Заголовок 3" />
                  
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                  <ToolbarButton icon={<Icons.Bold className="w-5 h-5" />} onClick={() => insertMarkdown('**', '**')} title="Жирный (Ctrl+B)" />
                  <ToolbarButton icon={<Icons.Italic className="w-5 h-5" />} onClick={() => insertMarkdown('*', '*')} title="Курсив (Ctrl+I)" />
                  <ToolbarButton icon={<Icons.Strikethrough className="w-5 h-5" />} onClick={() => insertMarkdown('~~', '~~')} title="Зачеркнутый" />
                  
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                  <ToolbarButton icon={<Icons.List className="w-5 h-5" />} onClick={() => insertMarkdown('- ')} title="Маркированный список" />
                  <ToolbarButton icon={<Icons.ListOrdered className="w-5 h-5" />} onClick={() => insertMarkdown('1. ')} title="Нумерованный список" />
                  <ToolbarButton icon={<Icons.CheckSquare className="w-5 h-5" />} onClick={() => insertMarkdown('- [ ] ')} title="Чеклист" />
                  
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                  <ToolbarButton icon={<Icons.Quote className="w-5 h-5" />} onClick={() => insertMarkdown('> ')} title="Цитата" />
                  <ToolbarButton icon={<Icons.Code className="w-5 h-5" />} onClick={() => insertMarkdown('`', '`')} title="Код" />
                  <ToolbarButton icon={<Icons.Minus className="w-5 h-5" />} onClick={() => insertMarkdown('\n---\n')} title="Разделитель" />
                  
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  
                  <ToolbarButton icon={<Icons.Link className="w-5 h-5" />} onClick={() => insertMarkdown('[', '](url)')} title="Ссылка" />
                  <ToolbarButton icon={<Icons.Image className="w-5 h-5" />} onClick={() => insertMarkdown('![Alt]', '(url)')} title="Изображение" />
                  
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  
                  <button 
                    onClick={() => insertTemplate('infobox')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                      <Icons.Layout className="w-4 h-4" /> Инфобокс
                  </button>
              </div>

              <div className="flex gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
                    <ModeButton active={mode === 'write'} onClick={() => setMode('write')} icon={<Icons.Edit className="w-4 h-4" />} label="Код" />
                    <ModeButton active={mode === 'split'} onClick={() => setMode('split')} icon={<Icons.Columns className="w-4 h-4" />} label="Сплит" />
                    <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')} icon={<Icons.Eye className="w-4 h-4" />} label="Чтение" />
                </div>
                <button 
                    onClick={() => setIsFullscreen(!isFullscreen)} 
                    className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    title="На весь экран"
                >
                    {isFullscreen ? <Icons.Minimize className="w-5 h-5" /> : <Icons.Maximize className="w-5 h-5" />}
                </button>
              </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 overflow-hidden relative flex">
              
              {/* Write Pane */}
              {(mode === 'write' || mode === 'split') && (
                  <div className={`h-full ${mode === 'split' ? 'w-1/2 border-r border-slate-200 dark:border-slate-800' : 'w-full'} flex flex-col`}>
                      <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => updateContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                        className="w-full h-full p-8 text-base md:text-lg font-mono text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none resize-none leading-relaxed"
                        placeholder="Начните писать..."
                        spellCheck={false}
                      />
                  </div>
              )}

              {/* Preview Pane */}
              {(mode === 'preview' || mode === 'split') && (
                  <div 
                    ref={previewRef}
                    className={`h-full ${mode === 'split' ? 'w-1/2 bg-slate-50 dark:bg-slate-950' : 'w-full bg-white dark:bg-slate-900'} overflow-y-auto p-10`}
                  >
                      <div className="prose prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 dark:prose-blockquote:bg-emerald-900/20 prose-blockquote:py-2 prose-blockquote:px-5 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:rounded prose-code:px-1.5">
                          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                      </div>
                  </div>
              )}
              
              {/* AI Floating Button */}
              <button 
                onClick={handleAiAssist}
                disabled={isAiLoading}
                className="absolute bottom-8 right-8 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 hover:scale-105 transition-all z-10 disabled:opacity-50 disabled:scale-100"
                title="AI Ассистент"
              >
                  {isAiLoading ? <Icons.Clock className="w-7 h-7 animate-spin" /> : <Icons.Sparkles className="w-7 h-7" />}
              </button>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 text-sm text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Markdown • {content.split(' ').length} слов • {content.length} символов</span>
              <span>{mode === 'write' ? 'Режим редактирования' : mode === 'preview' ? 'Режим чтения' : 'Режим сплит'}</span>
          </div>
      </div>
      </>
  );
};

const ToolbarButton = ({ icon, onClick, title, disabled }: any) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        title={title} 
        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
    >
        {icon}
    </button>
);

const ModeButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick} 
        className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${active ? 'bg-white dark:bg-slate-800 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
    >
        {icon}
        <span className="hidden lg:inline">{label}</span>
    </button>
);

export default MarkdownEditor;
