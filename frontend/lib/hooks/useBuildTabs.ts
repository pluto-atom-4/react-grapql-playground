/**
 * useBuildTabs Hook
 * Manages tab state and lazy loading for the build detail modal
 */

import { useState, useCallback } from 'react';

export type BuildTabId = 'overview' | 'parts' | 'tests' | 'history';

/**
 * Return type for useBuildTabs hook
 */
export interface UseBuildTabsReturn {
  /** Currently active tab ID */
  activeTab: BuildTabId;
  /** Set active tab */
  setActiveTab: (tabId: BuildTabId) => void;
  /** Set of loaded tab IDs (for lazy loading) */
  loadedTabs: Set<BuildTabId>;
  /** Loading state per tab */
  isLoading: Record<BuildTabId, boolean>;
  /** Set loading state for a tab */
  setTabLoading: (tabId: BuildTabId, loading: boolean) => void;
}

/**
 * Manage tab state and lazy loading for build detail modal
 *
 * Features:
 * - Track active tab
 * - Track which tabs have been loaded
 * - Per-tab loading state (for data fetching)
 * - Optimize re-renders with useCallback
 *
 * @example
 * const { activeTab, setActiveTab, loadedTabs, isLoading, setTabLoading } = useBuildTabs('overview');
 */
export function useBuildTabs(initialTab: BuildTabId = 'overview'): UseBuildTabsReturn {
  const [activeTab, setActiveTab] = useState<BuildTabId>(initialTab);
  const [loadedTabs, setLoadedTabs] = useState<Set<BuildTabId>>(new Set([initialTab]));
  const [isLoading, setIsLoading] = useState<Record<BuildTabId, boolean>>({
    overview: false,
    parts: false,
    tests: false,
    history: false,
  });

  const handleSetActiveTab = useCallback((tabId: BuildTabId) => {
    setActiveTab(tabId);
    // Mark tab as loaded
    setLoadedTabs((prev) => {
      if (!prev.has(tabId)) {
        const next = new Set(prev);
        next.add(tabId);
        return next;
      }
      return prev;
    });
  }, []);

  const handleSetTabLoading = useCallback((tabId: BuildTabId, loading: boolean) => {
    setIsLoading((prev) => ({
      ...prev,
      [tabId]: loading,
    }));
  }, []);

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
    loadedTabs,
    isLoading,
    setTabLoading: handleSetTabLoading,
  };
}
