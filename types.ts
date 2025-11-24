export type BlockType = 'heading' | 'paragraph' | 'infobox' | 'list';

export interface WikiBlock {
  id: string;
  type: BlockType;
  content: string | Record<string, string>; // Simple string for text, object for key-value (infobox)
  lastUpdated?: number;
}

export interface Article {
  id: string;
  title: string;
  categoryId: string;
  blocks: WikiBlock[];
  lastModified: number;
  tags: string[];
}

export interface SubCategory {
  id: string;
  name: string;
  filterTags: string[]; // Articles containing ANY of these tags belong to this subcategory
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  description?: string;
  subcategories?: SubCategory[];
}

export interface Breadcrumb {
  label: string;
  path?: string; // Internal ID to navigate to
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
}