
import { Article } from '../types';
import { INITIAL_CATEGORIES } from './categories';
import { SEED_CHARACTERS } from './seed/characters';
import { SEED_MAGIC } from './seed/magic';
import { SEED_WORLD } from './seed/world_lore';
import { SEED_PLOT } from './seed/plot';

// Aggregating all seed data into one export for the Storage Service
export { INITIAL_CATEGORIES };

export const INITIAL_ARTICLES: Article[] = [
    ...SEED_CHARACTERS,
    ...SEED_MAGIC,
    ...SEED_WORLD,
    ...SEED_PLOT
];
