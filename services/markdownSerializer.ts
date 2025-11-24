
import { WikiBlock } from '../types';
import { generateId } from './storageService';

const INFOBOX_START = '```infobox';
const INFOBOX_END = '```';

export const articleToMarkdown = (blocks: WikiBlock[]): string => {
  return blocks.map(block => {
    if (block.type === 'heading') {
      return `## ${block.content}`;
    }
    if (block.type === 'infobox') {
      const data = block.content as Record<string, string>;
      const lines = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
      return `${INFOBOX_START}\n${lines.join('\n')}\n${INFOBOX_END}`;
    }
    // Paragraphs, lists, etc.
    return block.content as string;
  }).join('\n\n');
};

export const markdownToBlocks = (markdown: string): WikiBlock[] => {
  const blocks: WikiBlock[] = [];
  const lines = markdown.split('\n');
  
  let currentBuffer: string[] = [];
  let isInsideInfobox = false;
  let infoboxBuffer: string[] = [];

  const flushBuffer = () => {
    if (currentBuffer.length > 0) {
      const text = currentBuffer.join('\n').trim();
      if (text) {
        // Detect if it's strictly a heading (single line starting with #)
        // We'll treat standard markdown headings as 'heading' blocks for the wiki structure
        if (text.startsWith('#') && !text.includes('\n')) {
             // Remove # chars
             const level = text.match(/^#+/)?.[0].length || 0;
             const content = text.replace(/^#+\s*/, '');
             blocks.push({ id: generateId(), type: 'heading', content });
        } else {
             blocks.push({ id: generateId(), type: 'paragraph', content: text });
        }
      }
      currentBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Infobox Start
    if (line.trim().startsWith(INFOBOX_START)) {
      flushBuffer();
      isInsideInfobox = true;
      continue;
    }

    // Detect Infobox End
    if (isInsideInfobox && line.trim() === INFOBOX_END) {
      isInsideInfobox = false;
      const data: Record<string, string> = {};
      infoboxBuffer.forEach(l => {
        const splitIndex = l.indexOf(':');
        if (splitIndex > -1) {
          const key = l.substring(0, splitIndex).trim();
          const val = l.substring(splitIndex + 1).trim();
          if (key) data[key] = val;
        }
      });
      blocks.push({ id: generateId(), type: 'infobox', content: data });
      infoboxBuffer = [];
      continue;
    }

    if (isInsideInfobox) {
      infoboxBuffer.push(line);
      continue;
    }

    // Detect explicit Heading line (to split paragraphs)
    if (line.trim().startsWith('#')) {
        flushBuffer();
        currentBuffer.push(line);
        flushBuffer(); // Immediately flush heading as its own block
        continue;
    }

    // Accumulate paragraph text
    // If double newline (empty line), flush previous paragraph
    if (line.trim() === '') {
        flushBuffer();
    } else {
        currentBuffer.push(line);
    }
  }

  flushBuffer();
  return blocks;
};
