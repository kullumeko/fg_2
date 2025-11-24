
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { getArticles } from './storageService';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_DIRECTIVE = `
# ГЛОБАЛЬНАЯ ДИРЕКТИВА: РОЛЬ И РЕЖИМ РАБОТЫ

Ты — **Профессиональный Соавтор и Литературный Редактор**, специализирующийся на жанре «Бояръ-аниме» (Russian Progression Fantasy).

### 1. ПОЗИЦИОНИРОВАНИЕ
- **Партнерство:** Ты интеллектуальный спарринг-партнер.
- **Приоритет Логики:** Внутримировая логика важнее сюжета.
- **Thinking Mode:** Анализируй контекст перед ответом.

### 2. ЖАНРОВЫЕ ПРОТОКОЛЫ
- **Герой:** Компетентный, циничный, расчетливый.
- **Мир:** Социальный дарвинизм, магия + технологии.
- **POV:** 1-е лицо.

### 3. СТИЛИСТИКА
- Холодный, аналитический тон.
- "Показывай, а не рассказывай".
`;

// Helper: Compile Wiki Context
const getFullWikiContext = (): string => {
    const articles = getArticles();
    if (articles.length === 0) return "";

    let context = "\n=== ТЕКУЩАЯ БАЗА ЗНАНИЙ (WIKI) ===\n";
    articles.forEach(article => {
        const content = article.blocks.map(b => {
            if (b.type === 'infobox') return `[ДОСЬЕ: ${JSON.stringify(b.content)}]`;
            return b.content;
        }).join('\n');

        context += `\n-- СТАТЬЯ: ${article.title} (ID: ${article.categoryId}) --\nТЕГИ: ${article.tags.join(', ')}\n${content}\n`;
    });
    context += "\n=== КОНЕЦ БАЗЫ ЗНАНИЙ ===\n";
    return context;
};

// --- CHAT INTERFACE ---

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    attachments?: {
        name: string;
        mimeType: string;
        data: string; // base64
    }[];
}

export const createChatSession = (): Chat => {
    const wikiContext = getFullWikiContext();
    const systemInstruction = `${SYSTEM_DIRECTIVE}\n\n${wikiContext}`;

    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
        }
    });
};

export const sendChatMessageStream = async (
    session: Chat, 
    message: string,
    files?: { mimeType: string; data: string }[]
): Promise<any> => {
    
    const parts: any[] = [];

    // Add Text
    if (message) {
        parts.push({ text: message });
    }

    // Add Files
    if (files && files.length > 0) {
        files.forEach(f => {
            parts.push({
                inlineData: {
                    mimeType: f.mimeType,
                    data: f.data
                }
            });
        });
    }

    // Use sendMessageStream with standard message structure
    // The SDK expects `message` parameter which can be a string or parts
    return await session.sendMessageStream({ 
        message: parts 
    });
};

// Legacy one-off generation (keeping for backward compatibility if needed)
export const generateWikiContent = async (
  prompt: string, 
  currentContent?: string,
  context?: string
): Promise<string> => {
  try {
    const wikiKnowledge = getFullWikiContext();
    let fullPrompt = `${SYSTEM_DIRECTIVE}\nKONTEXT:\n${wikiKnowledge}\nTASK: ${prompt}`;
    if(currentContent) fullPrompt += `\nCONTENT: ${currentContent}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content.";
  }
};

// Helper: File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            let encoded = reader.result as string;
            // Remove data:image/xxx;base64, prefix
            encoded = encoded.replace(/^data:(.*,)?/, '');
            if ((encoded.length % 4) > 0) {
                encoded += '='.repeat(4 - (encoded.length % 4));
            }
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
    });
};
