import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';

export interface FilterState {
  page: number;
  pageSize: number;
  orderBy: string;
  orderColumn: string;
  search: string;
  date: Date | string;
  status?: string[];
  tipos?: string[];
}

export function usePersistentFilters(
  storageKey: string,
  defaultFilters: FilterState
) {
  const router = useRouter();
  const defaultFiltersRef = useRef(defaultFilters);
  defaultFiltersRef.current = defaultFilters; // Keep reference updated

  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize with defaultFilters
    return defaultFilters;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load filters from localStorage and URL params on mount
  useEffect(() => {
    if (isInitialized) return; // Only run once

    // First, try to load from URL params (for navigation from other pages)
    const urlParams = new URLSearchParams(window.location.search);
    let hasUrlParams = false;
    const urlFilters: Partial<FilterState> = {};

    // Parse URL parameters
    if (urlParams.has('date')) {
      urlFilters.date = urlParams.get('date') || defaultFiltersRef.current.date;
      hasUrlParams = true;
    }

    if (urlParams.has('search')) {
      urlFilters.search = urlParams.get('search') || '';
      hasUrlParams = true;
    }

    if (urlParams.has('page')) {
      urlFilters.page = parseInt(urlParams.get('page') || '1', 10);
      hasUrlParams = true;
    }

    const statusParams = urlParams.getAll('status');
    if (statusParams.length > 0) {
      urlFilters.status = statusParams;
      hasUrlParams = true;
    }

    const tiposParams = urlParams.getAll('tipos');
    if (tiposParams.length > 0) {
      urlFilters.tipos = tiposParams;
      hasUrlParams = true;
    }

    if (hasUrlParams) {
      // URL params take precedence
      const mergedFilters = { ...defaultFiltersRef.current, ...urlFilters };
      setFilters(mergedFilters);

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(mergedFilters));

      // Clean URL after applying parameters
      router.replace(router.pathname, undefined, { shallow: true });
    } else {
      // No URL params, try localStorage
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedFilters = JSON.parse(saved);
          // Merge with defaults to ensure all required fields exist
          const mergedFilters = { ...defaultFiltersRef.current, ...parsedFilters };
          setFilters(mergedFilters);
        }
      } catch (error) {
        console.warn('Failed to parse saved filters:', error);
        // Fall back to defaults
        setFilters(defaultFiltersRef.current);
      }
    }

    setIsInitialized(true);
  }, [storageKey, router, isInitialized]); // Removed defaultFilters from deps  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(filters));
  }, [filters, storageKey]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFiltersRef.current);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    filters,
    updateFilters,
    resetFilters,
    setFilters: updateFilters // Alias for backward compatibility
  };
}
