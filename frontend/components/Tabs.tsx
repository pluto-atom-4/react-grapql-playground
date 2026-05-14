'use client';

import type { ReactElement, ReactNode } from 'react';
import React, { useState, useCallback } from 'react';

/**
 * Tab definition
 */
export interface Tab {
  /** Unique tab identifier */
  id: string;
  /** Tab label displayed to user */
  label: string;
  /** Optional icon/ReactNode for tab */
  icon?: ReactNode;
  /** Optional badge (count or string) displayed on tab */
  badge?: number | string;
  /** Tab content (ReactNode) */
  content: ReactNode;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Badge styling variant */
  badgeVariant?: 'default' | 'warning' | 'danger';
}

/**
 * Props for Tabs component
 */
export interface TabsProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Default active tab ID */
  defaultTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Whether to lazy load tab content (only render active tab) */
  lazy?: boolean;
  /** Visual style variant */
  variant?: 'default' | 'pills';
  /** Optional CSS class */
  className?: string;
}

/**
 * Get badge color class
 */
function getBadgeColorClass(variant: 'default' | 'warning' | 'danger' = 'default'): string {
  const colors: Record<string, string> = {
    default: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  };
  return colors[variant];
}

/**
 * Tabs Component
 *
 * Reusable tabbed interface for organizing content into multiple sections.
 * Supports keyboard navigation, lazy loading, and accessibility.
 *
 * Features:
 * - Tab switching via click and keyboard (arrow keys, tab)
 * - Lazy loading (optional, only render active tab)
 * - Badge support (counts, status indicators)
 * - Icon support
 * - Disabled tab support
 * - Responsive design (horizontal tabs, scrollable on mobile)
 * - Full keyboard navigation (Tab, Arrow keys)
 * - Accessibility (WCAG AA): role="tablist", role="tab", role="tabpanel"
 * - Focus management
 * - Smooth transitions
 *
 * @example
 * <Tabs
 *   tabs={[
 *     { id: 'overview', label: 'Overview', badge: 1, content: <OverviewTab /> },
 *     { id: 'parts', label: 'Parts', badge: 5, content: <PartsTab /> },
 *   ]}
 *   defaultTab="overview"
 *   onTabChange={(tabId) => console.log('Changed to:', tabId)}
 *   lazy={true}
 * />
 */
export function Tabs({
  tabs,
  defaultTab,
  onTabChange,
  lazy = true,
  variant = 'default',
  className = '',
}: TabsProps): ReactElement {
  const firstEnabledTab = tabs.find((tab) => !tab.disabled);
  const initialTab = defaultTab || firstEnabledTab?.id || tabs[0]?.id;

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set([initialTab]));

  const handleTabClick = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab?.disabled) return;

      setActiveTab(tabId);

      // Mark tab as loaded if lazy loading
      if (lazy && !loadedTabs.has(tabId)) {
        setLoadedTabs((prev) => new Set([...prev, tabId]));
      }

      onTabChange?.(tabId);
    },
    [tabs, lazy, loadedTabs, onTabChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Move to previous enabled tab
        for (let i = index - 1; i >= 0; i--) {
          if (!tabs[i]?.disabled) {
            newIndex = i;
            break;
          }
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        // Move to next enabled tab
        for (let i = index + 1; i < tabs.length; i++) {
          if (!tabs[i]?.disabled) {
            newIndex = i;
            break;
          }
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        // Move to first enabled tab
        for (let i = 0; i < tabs.length; i++) {
          if (!tabs[i]?.disabled) {
            newIndex = i;
            break;
          }
        }
      } else if (e.key === 'End') {
        e.preventDefault();
        // Move to last enabled tab
        for (let i = tabs.length - 1; i >= 0; i--) {
          if (!tabs[i]?.disabled) {
            newIndex = i;
            break;
          }
        }
      }

      if (newIndex !== index) {
        handleTabClick(tabs[newIndex].id);
      }
    },
    [tabs, handleTabClick],
  );

  const tabListClasses = {
    default: 'flex gap-0 border-b border-gray-200 dark:border-gray-700 overflow-x-auto',
    pills: 'flex gap-2 flex-wrap',
  };

  const tabButtonClasses = {
    default:
      'px-4 py-3 font-medium text-gray-700 dark:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed',
    pills:
      'px-4 py-2 font-medium text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed',
  };

  const tabButtonActiveClasses = {
    default: 'border-b-blue-500 dark:border-b-blue-400 text-blue-600 dark:text-blue-400',
    pills: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600',
  };

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        role="tablist"
        className={tabListClasses[variant]}
        aria-label="Tab navigation"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`${tabButtonClasses[variant]} ${
              activeTab === tab.id ? tabButtonActiveClasses[variant] : ''
            }`}
            type="button"
          >
            <span className="flex items-center gap-2">
              {tab.icon && (
                <span className="flex-shrink-0" aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColorClass(tab.badgeVariant)}`}
                  aria-label={`${tab.label}: ${tab.badge} items`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => {
        const shouldRender = lazy ? loadedTabs.has(tab.id) : true;
        const isActive = activeTab === tab.id;

        return (
          <div
            key={`panel-${tab.id}`}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={!isActive}
            className={`transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {shouldRender && (
              <div className="p-4">
                {tab.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
