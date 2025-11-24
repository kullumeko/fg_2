
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icon';
import { createChatSession, sendChatMessageStream, fileToBase64, ChatMessage } from '../services/geminiService';
import { marked } from 'marked';
import { Chat } from '@google/genai';

interface AiChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

const AiChatWindow: React.FC<AiChatWindowProps> = ({ isOpen, onClose }) => {
    const [session, setSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Session
    useEffect(() => {
        if (isOpen && !session) {
            const newSession = createChatSession();
            setSession(newSession);
            setMessages([{
                role: 'model',
                text: 'Приветствую, Автор. Я готов к работе над сюжетом. База знаний загружена. Жду указаний.'
            }]);
        }
    }, [isOpen, session]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if ((!input.trim() && files.length === 0) || !session || isLoading) return;

        const userMsg: ChatMessage = {
            role: 'user',
            text: input,
            attachments: [] // We'll store metadata for UI only, data goes to API
        };

        // Prepare attachments for API
        const apiAttachments: { mimeType: string, data: string }[] = [];
        
        for (const file of files) {
            try {
                const base64 = await fileToBase64(file);
                
                // Fallback for missing MIME types (common in Windows for some extensions)
                // Gemini API rejects empty MIME types or 'application/octet-stream' for text files often
                let mimeType = file.type;
                if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    switch (ext) {
                        case 'jpg':
                        case 'jpeg': mimeType = 'image/jpeg'; break;
                        case 'png': mimeType = 'image/png'; break;
                        case 'webp': mimeType = 'image/webp'; break;
                        case 'pdf': mimeType = 'application/pdf'; break;
                        case 'js':
                        case 'jsx':
                        case 'ts':
                        case 'tsx':
                        case 'json':
                        case 'md':
                        case 'txt':
                        case 'html':
                        case 'css':
                        case 'py':
                        case 'c':
                        case 'cpp':
                        case 'h':
                        case 'java':
                        case 'rb':
                        case 'go':
                        case 'rs':
                             mimeType = 'text/plain'; 
                             break;
                        default:
                             mimeType = 'text/plain'; // Safer default than application/octet-stream for LLMs which process text
                    }
                }

                apiAttachments.push({ mimeType: mimeType, data: base64 });
                userMsg.attachments?.push({
                    name: file.name,
                    mimeType: mimeType,
                    data: base64
                });
            } catch (e) {
                console.error("File error", e);
            }
        }

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setFiles([]);
        setIsLoading(true);

        try {
            // Create placeholder for bot message
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            const streamResult = await sendChatMessageStream(session, userMsg.text, apiAttachments);
            
            let fullText = '';
            for await (const chunk of streamResult) {
                const chunkText = chunk.text || '';
                fullText += chunkText;
                
                // Update last message
                setMessages(prev => {
                    const newHistory = [...prev];
                    const lastMsg = newHistory[newHistory.length - 1];
                    lastMsg.text = fullText;
                    return newHistory;
                });
            }
        } catch (e: any) {
            console.error(e);
            let errorText = '**Ошибка:** Не удалось получить ответ от модели.';
            if (e.message && e.message.includes('Unsupported MIME type')) {
                 errorText += ' (Неподдерживаемый формат файла: Пожалуйста, проверьте расширение)';
            }
            setMessages(prev => {
                const newHistory = [...prev];
                // Remove the empty placeholder if it exists and is empty, or update it
                const lastMsg = newHistory[newHistory.length - 1];
                if (lastMsg.role === 'model') {
                    lastMsg.text = errorText;
                } else {
                    newHistory.push({ role: 'model', text: errorText });
                }
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay for mobile mainly */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200] md:hidden" onClick={onClose}></div>

            <div className="fixed z-[201] bottom-0 right-0 w-full md:w-[600px] md:bottom-6 md:right-6 bg-white dark:bg-slate-900 shadow-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[85vh] md:h-[700px] animate-slide-up overflow-hidden">
                
                {/* Header */}
                <div className="h-14 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-1.5 rounded-lg">
                            <Icons.Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">AI Соавтор</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Gemini 3.0 Pro</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => setSession(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Очистить контекст">
                             <Icons.Delete className="w-4 h-4" />
                         </button>
                         <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-lg text-slate-500">
                             <Icons.X className="w-4 h-4" />
                         </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-100 dark:bg-[#0B0F19] custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-emerald-600'}`}>
                                {msg.role === 'user' ? <Icons.Users className="w-4 h-4" /> : <Icons.Sparkles className="w-4 h-4 text-white" />}
                            </div>
                            
                            <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {/* Attachments Display */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-1">
                                        {msg.attachments.map((att, i) => (
                                            <div key={i} className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1 border border-slate-300 dark:border-slate-700">
                                                <Icons.Image className="w-3 h-3" />
                                                <span className="truncate max-w-[150px]">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className={`
                                    rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm
                                    ${msg.role === 'user' 
                                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-sm' 
                                        : 'bg-transparent text-slate-800 dark:text-slate-300 w-full pl-0'}
                                `}>
                                    {msg.role === 'model' ? (
                                        <div 
                                            className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-700 dark:prose-headings:text-slate-200 prose-code:bg-slate-200 dark:prose-code:bg-slate-900 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 dark:prose-pre:bg-black prose-pre:border dark:prose-pre:border-slate-800"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(msg.text, { async: false }) as string }} 
                                        />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 animate-pulse">
                                <Icons.Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex gap-1 items-center h-8">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    
                    {/* File Previews */}
                    {files.length > 0 && (
                         <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                             {files.map((f, i) => (
                                 <div key={i} className="relative group bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-6 shrink-0">
                                     <div className="text-xs font-medium truncate max-w-[120px]">{f.name}</div>
                                     <div className="text-[10px] text-slate-500 uppercase">{f.type.split('/')[1] || 'FILE'}</div>
                                     <button 
                                        onClick={() => removeFile(i)}
                                        className="absolute top-1 right-1 text-slate-400 hover:text-red-500"
                                     >
                                         <Icons.X className="w-3 h-3" />
                                     </button>
                                 </div>
                             ))}
                         </div>
                    )}

                    <div className="relative bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all flex flex-col">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Запрос к соавтору..."
                            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[50px] p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 custom-scrollbar"
                            rows={1}
                        />
                        <div className="flex justify-between items-center p-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex gap-1">
                                <input 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    title="Прикрепить файл"
                                >
                                    <Icons.Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <button 
                                onClick={handleSend}
                                disabled={(!input.trim() && files.length === 0) || isLoading}
                                className={`
                                    p-2 rounded-lg transition-all flex items-center justify-center
                                    ${(!input.trim() && files.length === 0) || isLoading 
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'}
                                `}
                            >
                                {isLoading ? <Icons.Clock className="w-5 h-5 animate-spin" /> : <Icons.ChevronRight className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 text-center">
                        <p className="text-[10px] text-slate-400 dark:text-slate-600">
                            ИИ может допускать ошибки. Проверяйте информацию.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AiChatWindow;
