/**
 * Formats a question's difficulty rating into a numerical score (e.g. 800, 840, 1300).
 * If a custom rating already exists on the object, it is returned.
 * Otherwise, maps:
 * - Easy -> 800 + offset (800 - 960)
 * - Medium -> 1200 + offset (1200 - 1360)
 * - Hard -> 1600 + offset (1600 - 1760)
 */
export const formatRating = (q) => {
  if (!q) return '800';
  if (q.rating && !isNaN(q.rating)) return String(q.rating);
  
  if (q.difficulty) {
    const diff = q.difficulty.toLowerCase();
    // Offset based on day to make rating vary slightly (e.g. 800, 840, 880)
    const dayOffset = ((q.day || 0) * 40) % 200; // 0, 40, 80, 120, 160
    if (diff === 'easy') return String(800 + dayOffset);
    if (diff === 'medium') return String(1200 + dayOffset);
    if (diff === 'hard') return String(1600 + dayOffset);
  }
  return '800';
};
