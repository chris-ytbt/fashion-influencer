export type SavedPrompt = {
  id: string; // 'default' or uuid-like for user prompts
  title: string;
  content: string;
  updatedAt: number;
};

const PROMPTS_KEY = 'fi_saved_prompts_v1';
const CURRENT_PROMPT_ID_KEY = 'fi_current_prompt_id_v1';

// Default prompt from existing implementation
export const DEFAULT_PROMPT: SavedPrompt = {
  id: 'default',
  title: 'Default',
  content:
    'Make me look like a fashion influencer using the product image. ' +
    'If the product is apparel, remove the original clothes from the original picture, ' +
    'and let me wear the product and pose. If the product is something else, ' +
    'make me look like I use it and enjoy it. Make sure product is visible in ' +
    'the same frame as me together.',
  updatedAt: 0,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getSavedPrompts(): SavedPrompt[] {
  if (typeof window === 'undefined') return [DEFAULT_PROMPT];
  const list = safeParse<SavedPrompt[]>(localStorage.getItem(PROMPTS_KEY), []);
  // ensure default at top (non-deletable)
  const withoutDefault = list.filter(p => p.id !== 'default');
  return [DEFAULT_PROMPT, ...withoutDefault];
}

export function savePrompt(prompt: Omit<SavedPrompt, 'id' | 'updatedAt'> & { id?: string }): SavedPrompt {
  if (typeof window === 'undefined') throw new Error('Client only');
  const list = safeParse<SavedPrompt[]>(localStorage.getItem(PROMPTS_KEY), []);
  const now = Date.now();
  const id = prompt.id && prompt.id !== 'default' ? prompt.id : crypto.randomUUID();
  const newItem: SavedPrompt = { id, title: prompt.title, content: prompt.content, updatedAt: now };
  const idx = list.findIndex(p => p.id === id);
  if (idx >= 0) list[idx] = newItem; else list.push(newItem);
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(list));
  return newItem;
}

export function deletePrompt(id: string): void {
  if (typeof window === 'undefined') return;
  if (id === 'default') return; // non-deletable
  const list = safeParse<SavedPrompt[]>(localStorage.getItem(PROMPTS_KEY), []);
  const filtered = list.filter(p => p.id !== id);
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(filtered));
  // If deleted prompt was current, clear current selection
  const currentId = getCurrentPromptId();
  if (currentId === id) {
    setCurrentPromptId(null);
  }
}

export function getCurrentPromptId(): string | null {
  if (typeof window === 'undefined') return 'default';
  return safeParse<string | null>(localStorage.getItem(CURRENT_PROMPT_ID_KEY), 'default');
}

export function setCurrentPromptId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (!id) {
    localStorage.removeItem(CURRENT_PROMPT_ID_KEY);
    return;
  }
  localStorage.setItem(CURRENT_PROMPT_ID_KEY, JSON.stringify(id));
}

export function getPromptById(id: string | null | undefined): SavedPrompt {
  const list = getSavedPrompts();
  const found = list.find(p => p.id === (id || 'default'));
  return found || DEFAULT_PROMPT;
}
