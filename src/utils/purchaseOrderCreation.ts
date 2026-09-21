function duplicateStorageKey(userId: number | undefined, source: string | undefined, projectId: number) {
  if (!userId || !source) throw new Error('Espera a que termine de cargar tu sesión.');
  return `gava:duplicate-order:v1:${userId}:${source}:${projectId}`;
}

export function duplicateCreationKey(userId: number | undefined, source: string | undefined, projectId: number) {
  const storageKey = duplicateStorageKey(userId, source, projectId);
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const key = crypto.randomUUID();
  localStorage.setItem(storageKey, key);
  return key;
}

export function completeDuplicate(userId: number | undefined, source: string | undefined, projectId: number) {
  try { localStorage.removeItem(duplicateStorageKey(userId, source, projectId)); } catch { /* The order is already committed. */ }
}
