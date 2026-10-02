/**
 * Immutable update with a mutable-looking callback: copies `value`, lets
 * `recipe` change the copy, and returns it. Returns are small, so a deep
 * copy per edit is cheap.
 */
export function produce<T>(value: T, recipe: (draft: T) => void): T {
  const draft = structuredClone(value);
  recipe(draft);
  return draft;
}

/** Removes item `index` from a list, returning a new list. */
export const removeAt = <T,>(list: T[], index: number): T[] => list.filter((_, i) => i !== index);
