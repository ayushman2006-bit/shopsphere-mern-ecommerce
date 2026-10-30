const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');

export const resolveImage = (path, fallback = '/placeholder.svg') => {
  if (!path) return fallback;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  if (path.startsWith('/uploads/') || path.startsWith('/api/')) {
    return `${API_ORIGIN}${path}`;
  }
  return path;
};

export const handleImageError = (event) => {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = 'true';
  img.src = '/placeholder.svg';
};
