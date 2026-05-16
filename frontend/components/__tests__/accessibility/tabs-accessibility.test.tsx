/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, no-undef */
'use client';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Tabs, type Tab } from '../../Tabs';

expect.extend(toHaveNoViolations);

describe('Tabs Accessibility', () => {
  const mockTabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      badge: 1,
      content: <div data-testid="overview-content">Overview content</div>,
    },
    {
      id: 'details',
      label: 'Details',
      badge: 5,
      content: <div data-testid="details-content">Details content</div>,
    },
    {
      id: 'history',
      label: 'History',
      content: <div data-testid="history-content">History content</div>,
    },
  ];

  describe('ARIA Attributes', () => {
    it('should have role="tablist" on tab container', () => {
      render(<Tabs tabs={mockTabs} />);
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });

    it('should have aria-label on tablist', () => {
      render(<Tabs tabs={mockTabs} />);
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label');
      expect(tablist).toHaveAttribute('aria-label', 'Tab navigation');
    });

    it('should have role="tab" on each tab button', () => {
      render(<Tabs tabs={mockTabs} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('should have aria-selected on tab buttons', () => {
      render(<Tabs tabs={mockTabs} />);
      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('should set aria-selected="true" on active tab', () => {
      render(<Tabs tabs={mockTabs} defaultTab="details" />);
      const tabs = screen.getAllByRole('tab');
      
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('should have aria-controls pointing to tab panels', () => {
      render(<Tabs tabs={mockTabs} />);
      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('aria-controls', `tabpanel-${mockTabs[index].id}`);
      });
    });

    it('should have role="tabpanel" on tab panels', () => {
      render(<Tabs tabs={mockTabs} />);
      const panels = screen.getAllByRole('tabpanel');
      expect(panels.length).toBeGreaterThan(0);
    });

    it('should have aria-labelledby on tab panels pointing to tab button', () => {
      render(<Tabs tabs={mockTabs} />);
      const panels = screen.getAllByRole('tabpanel');
      
      panels.forEach((panel, index) => {
        expect(panel).toHaveAttribute('aria-labelledby', `tab-${mockTabs[index].id}`);
      });
    });

    it('should have unique IDs for tabs and panels', () => {
      render(<Tabs tabs={mockTabs} />);
      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('id', `tab-${mockTabs[index].id}`);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to next tab with Right Arrow key', async () => {
      const user = userEvent.setup();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const handleTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultTab="overview" onTabChange={handleTabChange} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      
      await user.keyboard('{ArrowRight}');
      expect(handleTabChange).toHaveBeenCalledWith('details');
    });

    it('should navigate to previous tab with Left Arrow key', async () => {
      const user = userEvent.setup();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const handleTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultTab="details" onTabChange={handleTabChange} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[1].focus();
      
      await user.keyboard('{ArrowLeft}');
      expect(handleTabChange).toHaveBeenCalledWith('overview');
    });

    it('should navigate to first tab with Home key', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultTab="history" onTabChange={handleTabChange} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[2].focus();
      
      await user.keyboard('{Home}');
      expect(handleTabChange).toHaveBeenCalledWith('overview');
    });

    it('should navigate to last tab with End key', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultTab="overview" onTabChange={handleTabChange} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      
      await user.keyboard('{End}');
      expect(handleTabChange).toHaveBeenCalledWith('history');
    });

    it('should skip disabled tabs during arrow key navigation', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();
      const disabledTabs: Tab[] = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
        { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
      ];
      
      render(<Tabs tabs={disabledTabs} defaultTab="tab1" onTabChange={handleTabChange} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      
      await user.keyboard('{ArrowRight}');
      // Should skip disabled tab and go to tab3
      expect(handleTabChange).toHaveBeenCalledWith('tab3');
    });

    it('should trigger tab change on Enter key', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultTab="overview" onTabChange={handleTabChange} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[1].focus();
      
      await user.keyboard('{Enter}');
      expect(handleTabChange).toHaveBeenCalledWith('details');
    });

    it('should trigger tab change on Space key', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultTab="overview" onTabChange={handleTabChange} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[1].focus();
      
      await user.keyboard(' ');
      expect(handleTabChange).toHaveBeenCalledWith('details');
    });
  });

  describe('Focus Management', () => {
    it('should allow tab buttons to receive focus', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);
      
      const tabs = screen.getAllByRole('tab');
      await user.tab();
      
      expect(tabs[0]).toHaveFocus();
    });

    it('should have focus ring visible on tab buttons', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        // Check if focus ring classes are present in the className
        expect(tab.className).toContain('focus:ring-2');
        expect(tab.className).toContain('focus:ring-blue-500');
      });
    });

    it('should maintain focus ring styling after tab change', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} defaultTab="overview" />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      
      await user.keyboard('{ArrowRight}');
      
      // All tabs should have focus ring styling available
      tabs.forEach((tab) => {
        expect(tab.className).toContain('focus:ring-2');
      });
    });
  });

  describe('Tab Panel Visibility', () => {
    it('should hide inactive tab panels', () => {
      render(<Tabs tabs={mockTabs} defaultTab="overview" lazy={false} />);
      
      const panels = screen.getAllByRole('tabpanel');
      
      // Find panels by their associated tab
      const overviewPanel = panels.find(p => p.getAttribute('aria-labelledby') === 'tab-overview');
      const detailsPanel = panels.find(p => p.getAttribute('aria-labelledby') === 'tab-details');
      
      if (overviewPanel && detailsPanel) {
        expect(overviewPanel).not.toHaveAttribute('hidden');
        expect(detailsPanel).toHaveAttribute('hidden');
      }
    });

    it('should show active tab panel', () => {
      render(<Tabs tabs={mockTabs} defaultTab="details" lazy={false} />);
      
      const detailsPanel = screen.getByTestId('details-content');
      expect(detailsPanel.closest('[role="tabpanel"]')).not.toHaveAttribute('hidden');
    });

    it('should update panel visibility on tab change', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} defaultTab="overview" lazy={false} />);
      
      const detailsTab = screen.getByRole('tab', { name: /Details/ });
      await user.click(detailsTab);
      
      const detailsPanel = screen.getByTestId('details-content');
      expect(detailsPanel.closest('[role="tabpanel"]')).not.toHaveAttribute('hidden');
    });
  });

  describe('Badge Accessibility', () => {
    it('should have aria-label on badge elements', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const badges = screen.getAllByLabelText(/items/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should announce badge count in aria-label', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const badge = screen.getByLabelText('Overview: 1 items');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Axe Accessibility Scan', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Tabs tabs={mockTabs} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with disabled tabs', async () => {
      const disabledTabs: Tab[] = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
      ];
      
      const { container } = render(<Tabs tabs={disabledTabs} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with pills variant', async () => {
      const { container } = render(<Tabs tabs={mockTabs} variant="pills" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Disabled Tab Handling', () => {
    it('should have disabled attribute on disabled tabs', () => {
      const disabledTabs: Tab[] = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
      ];
      
      render(<Tabs tabs={disabledTabs} />);
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).not.toBeDisabled();
      expect(tabs[1]).toBeDisabled();
    });

    it('should have reduced opacity on disabled tabs', () => {
      const disabledTabs: Tab[] = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
      ];
      
      render(<Tabs tabs={disabledTabs} />);
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1].className).toContain('disabled:opacity-50');
    });

    it('should not navigate to disabled tabs', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();
      const disabledTabs: Tab[] = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
        { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
      ];
      
      render(<Tabs tabs={disabledTabs} defaultTab="tab1" onTabChange={handleTabChange} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      
      await user.keyboard('{ArrowRight}');
      // Should skip disabled tab
      expect(handleTabChange).toHaveBeenCalledWith('tab3');
    });
  });

  describe('Lazy Loading Accessibility', () => {
    it('should load tab content when activated with lazy loading', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} lazy={true} defaultTab="overview" />);
      
      const detailsTab = screen.getByRole('tab', { name: /Details/ });
      await user.click(detailsTab);
      
      expect(screen.getByTestId('details-content')).toBeInTheDocument();
    });

    it('should keep loaded tabs in DOM with lazy loading', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} lazy={true} defaultTab="overview" />);
      
      const overviewContent = screen.getByTestId('overview-content');
      expect(overviewContent.closest('[role="tabpanel"]')).not.toHaveAttribute('hidden');
      
      const detailsTab = screen.getByRole('tab', { name: /Details/ });
      await user.click(detailsTab);
      
      // Overview content should still be in DOM (just hidden)
      expect(screen.getByTestId('overview-content')).toBeInTheDocument();
    });
  });
});
