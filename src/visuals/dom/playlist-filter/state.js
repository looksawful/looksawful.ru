export function createPlaylistFilterState(initialState = {}) {
  return {
    selectedGenres: new Set(initialState.selectedGenres || []),
    excludedGenres: new Set(initialState.excludedGenres || []),
    tags: new Set(initialState.tags || []),
    bpm: initialState.bpm || { min: 0, max: 200 },
    rating: initialState.rating || 0,
    isOpen: Boolean(initialState.isOpen),
    isAdvanced: Boolean(initialState.isAdvanced),
  };
}
