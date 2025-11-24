
import { Category } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { 
    id: 'characters', 
    name: 'Персонажи', 
    icon: 'Users', 
    description: 'Досье на ГГ, союзников и врагов',
    subcategories: [
      { id: 'protagonist', name: 'Протагонист', filterTags: ['ГГ', 'Огаро', 'Пересветов', 'Профиль'] },
      { id: 'allies', name: 'Союзники', filterTags: ['Союзники', 'Свита'] },
      { id: 'antagonists', name: 'Антагонисты', filterTags: ['Враги', 'Остяков', 'Уваров'] },
      { id: 'neutral', name: 'Нейтральные', filterTags: ['Власть', 'Академия', 'Корпус'] }
    ]
  },
  { 
    id: 'magic', 
    name: 'Магия', 
    icon: 'Sparkles', 
    description: 'Фантоматика и законы мира',
    subcategories: [
      { id: 'system', name: 'Фантоматика (ГГ)', filterTags: ['Система', 'Фантоматон', 'Огаро'] },
      { id: 'world_magic', name: 'Магия Мира', filterTags: ['Академическая', 'Рейтинг', 'Стихии'] },
      { id: 'mechanics', name: 'Механики', filterTags: ['Механика', 'Артефакторика'] }
    ] 
  },
  { 
    id: 'world', 
    name: 'Мир и Лор', 
    icon: 'Map', 
    description: 'География, история, политика',
    subcategories: [
      { id: 'geo', name: 'География', filterTags: ['Локации', 'Карта', 'Тобольск'] },
      { id: 'rifts', name: 'Провалы', filterTags: ['Провал', 'Монстры', 'Искажения'] },
      { id: 'history', name: 'История', filterTags: ['Лор', 'Тайны', 'Заговор'] },
      { id: 'transport', name: 'Транспорт', filterTags: ['Транспорт', 'Иртыш'] },
      { id: 'orgs', name: 'Организации', filterTags: ['Академия', 'Обучение'] }
    ]
  },
  { 
    id: 'factions', 
    name: 'Общество', 
    icon: 'Home', 
    description: 'Кланы, фракции, иерархия',
    subcategories: [
      { id: 'clans', name: 'Кланы', filterTags: ['Кланы', 'Рода', 'Политика', 'Иерархия'] },
      { id: 'economy', name: 'Экономика', filterTags: ['Купцы', 'Деньги', 'Синдикат'] },
      { id: 'state', name: 'Государство', filterTags: ['Власть', 'Чиновники', 'Корпус'] }
    ]
  },
  { 
    id: 'plot', 
    name: 'Сюжет', 
    icon: 'GitBranch', 
    description: 'Структура томов и статус',
    subcategories: [
      { id: 'vol1', name: 'Том 1', filterTags: ['Том 1', 'Арка', 'План'] },
      { id: 'global', name: 'Глобальный Сюжет', filterTags: ['Мета-сюжет', 'План'] },
      { id: 'status', name: 'Текущий Статус', filterTags: ['Статус', 'Инвентарь', 'Крючки'] }
    ]
  },
  { 
    id: 'notes', 
    name: 'Заметки', 
    icon: 'Edit', 
    description: 'Быстрые записи, идеи и черновики',
    subcategories: [
      { id: 'inbox', name: 'Входящие', filterTags: ['Инбокс'] },
      { id: 'drafts', name: 'Черновики', filterTags: ['Черновик'] },
      { id: 'ideas', name: 'Идеи', filterTags: ['Идея'] }
    ]
  },
];
