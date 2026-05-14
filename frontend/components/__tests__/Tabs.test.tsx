import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Tab } from '../Tabs';
import { Tabs } from '../Tabs';

describe('Tabs Component', () => {
  const mockTabs: Tab[] = [
    { id: 'overview', label: 'Overview', content: <div>Overview content</div> },
    { id: 'parts', label: 'Parts', badge: 5, content: <div>Parts content</div> },
    { id: 'tests', label: 'Tests', badge: 12, content: <div>Tests content</div> },
    { id: 'history', label: 'History', content: <div>History content</div> },
  ];

  it('should render all tabs', () => {
    render(<Tabs tabs={mockTabs} />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Parts')).toBeInTheDocument();
    expect(screen.getByText('Tests')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('should have tablist role', () => {
    const { container } = render(<Tabs tabs={mockTabs} />);

    expect(container.querySelector('[role="tablist"]')).toBeInTheDocument();
  });

  it('should render first tab as active by default', () => {
    render(<Tabs tabs={mockTabs} />);

    const firstTabButton = screen.getByRole('tab', { name: /Overview/ });
    expect(firstTabButton).toHaveAttribute('aria-selected', 'true');
  });

  it('should render default tab as active', () => {
    render(<Tabs tabs={mockTabs} defaultTab="tests" />);

    const testsTab = screen.getByRole('tab', { name: /Tests/ });
    expect(testsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should switch tabs on click', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={mockTabs} />);

    const partsTab = screen.getByRole('tab', { name: /Parts/ });
    await user.click(partsTab);

    expect(partsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Parts content')).toBeVisible();
  });

  it('should navigate tabs with arrow keys', () => {
    render(<Tabs tabs={mockTabs} />);

    const overviewTab = screen.getByRole('tab', { name: /Overview/ });
    overviewTab.focus();

    // Arrow Right should select Parts
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Parts/ })).toHaveAttribute('aria-selected', 'true');

    // Arrow Right again should select Tests
    const partsTab = screen.getByRole('tab', { name: /Parts/ });
    partsTab.focus();
    fireEvent.keyDown(partsTab, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Tests/ })).toHaveAttribute('aria-selected', 'true');

    // Arrow Left should go back to Parts
    const testsTab = screen.getByRole('tab', { name: /Tests/ });
    testsTab.focus();
    fireEvent.keyDown(testsTab, { key: 'ArrowLeft', code: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /Parts/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('should support Home/End keys', () => {
    render(<Tabs tabs={mockTabs} />);

    const overviewTab = screen.getByRole('tab', { name: /Overview/ });
    overviewTab.focus();

    // Home key should stay on first tab
    fireEvent.keyDown(overviewTab, { key: 'Home', code: 'Home' });
    expect(screen.getByRole('tab', { name: /Overview/ })).toHaveAttribute('aria-selected', 'true');

    // End key should select last tab
    fireEvent.keyDown(overviewTab, { key: 'End', code: 'End' });
    expect(screen.getByRole('tab', { name: /History/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('should display badges on tabs', () => {
    render(<Tabs tabs={mockTabs} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should call onTabChange callback', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} onTabChange={onTabChange} />);

    const partsTab = screen.getByRole('tab', { name: /Parts/ });
    await user.click(partsTab);

    expect(onTabChange).toHaveBeenCalledWith('parts');
  });

  it('should lazy load tab content by default', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={mockTabs} lazy={true} />);

    // Overview content should be visible (first tab)
    expect(screen.getByText('Overview content')).toBeInTheDocument();

    // Parts content should not be in DOM yet
    expect(screen.queryByText('Parts content')).not.toBeInTheDocument();

    // Click Parts tab
    const partsTab = screen.getByRole('tab', { name: /Parts/ });
    await user.click(partsTab);

    // Parts content should now be visible
    expect(screen.getByText('Parts content')).toBeInTheDocument();
  });

  it('should render all tabs when lazy=false', () => {
    render(<Tabs tabs={mockTabs} lazy={false} />);

    // All tab content should be in DOM (but hidden)
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    expect(screen.getByText('Parts content')).toBeInTheDocument();
    expect(screen.getByText('Tests content')).toBeInTheDocument();
    expect(screen.getByText('History content')).toBeInTheDocument();
  });

  it('should disable tabs when disabled=true', async () => {
    const user = userEvent.setup();
    const disabledTabs: Tab[] = [
      { id: 'overview', label: 'Overview', content: <div>Overview</div> },
      { id: 'parts', label: 'Parts', content: <div>Parts</div>, disabled: true },
    ];

    render(<Tabs tabs={disabledTabs} />);

    const partsTab = screen.getByRole('tab', { name: /Parts/ });
    expect(partsTab).toBeDisabled();

    // Clicking disabled tab should not change active tab
    await user.click(partsTab);
    expect(screen.getByRole('tab', { name: /Overview/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('should have proper ARIA attributes', () => {
    const { container } = render(<Tabs tabs={mockTabs} />);

    const tabButtons = container.querySelectorAll('[role="tab"]');
    expect(tabButtons.length).toBe(mockTabs.length);

    tabButtons.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-selected');
      expect(tab).toHaveAttribute('aria-controls');
    });

    const tabPanels = container.querySelectorAll('[role="tabpanel"]');
    expect(tabPanels.length).toBe(mockTabs.length);

    tabPanels.forEach((panel) => {
      expect(panel).toHaveAttribute('aria-labelledby');
    });
  });

  it('should support pills variant', () => {
    const { container } = render(<Tabs tabs={mockTabs} variant="pills" />);

    const tabList = container.querySelector('[role="tablist"]');
    expect(tabList).toHaveClass('gap-2');
  });

  it('should apply custom className', () => {
    const { container } = render(<Tabs tabs={mockTabs} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should support badge variants', () => {
    const tabsWithVariants: Tab[] = [
      { id: 'tab1', label: 'Default', badge: 5, content: <div>Content</div> },
      { id: 'tab2', label: 'Warning', badge: 3, badgeVariant: 'warning', content: <div>Content</div> },
      { id: 'tab3', label: 'Danger', badge: 1, badgeVariant: 'danger', content: <div>Content</div> },
    ];

    render(<Tabs tabs={tabsWithVariants} />);

    expect(screen.getByText('5')).toHaveClass('bg-blue-100');
    expect(screen.getByText('3')).toHaveClass('bg-yellow-100');
    expect(screen.getByText('1')).toHaveClass('bg-red-100');
  });

  it('should have focus management on tab buttons', () => {
    const { container } = render(<Tabs tabs={mockTabs} />);

    const tabButtons = container.querySelectorAll('[role="tab"]');
    tabButtons.forEach((button) => {
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
    });
  });

  it('should skip disabled tabs when navigating with keyboard', async () => {
    const user = userEvent.setup();
    const tabsWithDisabled: Tab[] = [
      { id: 'tab1', label: 'First', content: <div>Content 1</div> },
      { id: 'tab2', label: 'Disabled', content: <div>Content 2</div>, disabled: true },
      { id: 'tab3', label: 'Third', content: <div>Content 3</div> },
    ];

    render(<Tabs tabs={tabsWithDisabled} />);

    const firstTab = screen.getByRole('tab', { name: /First/ });
    firstTab.focus();

    // Arrow Right should skip disabled tab and select Third
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Third/ })).toHaveAttribute('aria-selected', 'true');
  });
});
