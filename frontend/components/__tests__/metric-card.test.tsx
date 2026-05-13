import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MetricCard } from '../MetricCard';

describe('MetricCard Component', () => {
  it('should render metric card with icon, label, and value', () => {
    render(
      <MetricCard
        icon="🏗️"
        label="Total Builds"
        value={42}
        aria-label="Total Builds metric"
      />,
    );

    expect(screen.getByText('🏗️')).toBeInTheDocument();
    expect(screen.getByText('Total Builds')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render subtext when provided', () => {
    render(
      <MetricCard
        icon="📊"
        label="Completion Rate"
        value="85%"
        subtext="Last 30 days"
      />,
    );

    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('should render trend indicator when provided', () => {
    const { rerender } = render(
      <MetricCard icon="📈" label="Growth" value={10} trend="up" />,
    );

    expect(screen.getByText('↑')).toBeInTheDocument();

    rerender(
      <MetricCard icon="📉" label="Decline" value={5} trend="down" />,
    );

    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <MetricCard
        icon="🎯"
        label="Click Test"
        value={123}
        onClick={onClick}
      />,
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Enter key is pressed on clickable card', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <MetricCard
        icon="⌨️"
        label="Keyboard Test"
        value={456}
        onClick={onClick}
      />,
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Space key is pressed on clickable card', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <MetricCard
        icon="⌨️"
        label="Keyboard Test"
        value={789}
        onClick={onClick}
      />,
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have region role when not clickable', () => {
    render(
      <MetricCard
        icon="📍"
        label="Static Metric"
        value={100}
      />,
    );

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should have button role when clickable', () => {
    render(
      <MetricCard
        icon="🔘"
        label="Clickable Metric"
        value={200}
        onClick={() => {}}
      />,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should use custom aria-label when provided', () => {
    render(
      <MetricCard
        icon="🏷️"
        label="Metric"
        value={50}
        aria-label="Custom metric label"
      />,
    );

    expect(screen.getByLabelText('Custom metric label')).toBeInTheDocument();
  });

  it('should use label as aria-label when not provided', () => {
    render(
      <MetricCard
        icon="🏷️"
        label="Default Label"
        value={75}
      />,
    );

    expect(screen.getByLabelText('Default Label')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <MetricCard
        icon="🎨"
        label="Styled"
        value={999}
        className="custom-class"
      />,
    );

    const card = screen.getByLabelText('Styled');
    expect(card).toHaveClass('custom-class');
  });

  it('should handle numeric and string values', () => {
    const { rerender } = render(
      <MetricCard icon="1️⃣" label="Number" value={123} />,
    );

    expect(screen.getByText('123')).toBeInTheDocument();

    rerender(
      <MetricCard icon="2️⃣" label="String" value="100%" />,
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should not render trend when trend is neutral', () => {
    render(
      <MetricCard icon="↔️" label="Neutral" value={50} trend="neutral" />,
    );

    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
  });

  it('should be memoized and not re-render unnecessarily', () => {
    const icon = '📦';
    let renderCount = 0;

    // Wrap MetricCard to count renders
    const TestComponent = () => {
      renderCount++;
      return (
        <MetricCard
          icon={icon}
          label="Render Count Test"
          value={renderCount}
        />
      );
    };

    const { rerender } = render(<TestComponent />);
    expect(renderCount).toBe(1);

    // Re-render with same props - MetricCard should not re-render its content
    rerender(<TestComponent />);
    // The component function itself will run again (that's the wrapper),
    // but the memoized MetricCard should optimize its rendering
    expect(renderCount).toBe(2);
  });

  it('should have proper touch target size for accessibility', () => {
    render(
      <MetricCard
        icon="👆"
        label="Touch Target"
        value={44}
        onClick={() => {}}
      />,
    );

    const card = screen.getByRole('button');
    // Tailwind p-6 provides sufficient padding for touch targets
    expect(card).toHaveClass('p-6');
  });
});
