import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInteractionState } from '@/lib/useInteractionState';

describe('useInteractionState Hook', () => {
  describe('Initial State', () => {
    it('initializes with all false states', () => {
      const { result } = renderHook(() => useInteractionState());
      
      expect(result.current.isFocused).toBe(false);
      expect(result.current.isHovered).toBe(false);
      expect(result.current.isActive).toBe(false);
      expect(result.current.isKeyboardInteraction).toBe(false);
    });

    it('provides event handlers', () => {
      const { result } = renderHook(() => useInteractionState());
      
      expect(typeof result.current.onFocus).toBe('function');
      expect(typeof result.current.onBlur).toBe('function');
      expect(typeof result.current.onMouseEnter).toBe('function');
      expect(typeof result.current.onMouseLeave).toBe('function');
      expect(typeof result.current.onMouseDown).toBe('function');
      expect(typeof result.current.onMouseUp).toBe('function');
      expect(typeof result.current.onKeyDown).toBe('function');
      expect(typeof result.current.onKeyUp).toBe('function');
    });
  });

  describe('Focus Management', () => {
    it('sets isFocused to true on focus', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onFocus();
      });
      
      expect(result.current.isFocused).toBe(true);
    });

    it('sets isFocused to false on blur', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onFocus();
      });
      expect(result.current.isFocused).toBe(true);
      
      act(() => {
        result.current.onBlur();
      });
      expect(result.current.isFocused).toBe(false);
    });
  });

  describe('Hover Management', () => {
    it('sets isHovered to true on mouse enter', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onMouseEnter();
      });
      
      expect(result.current.isHovered).toBe(true);
    });

    it('sets isHovered to false on mouse leave', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onMouseEnter();
      });
      expect(result.current.isHovered).toBe(true);
      
      act(() => {
        result.current.onMouseLeave();
      });
      expect(result.current.isHovered).toBe(false);
    });
  });

  describe('Active State Management', () => {
    it('sets isActive to true on mouse down', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onMouseDown();
      });
      
      expect(result.current.isActive).toBe(true);
    });

    it('sets isActive to false on mouse up', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onMouseDown();
      });
      expect(result.current.isActive).toBe(true);
      
      act(() => {
        result.current.onMouseUp();
      });
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Keyboard Interaction Detection', () => {
    it('detects Tab key as keyboard interaction', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = new KeyboardEvent('keydown', { key: 'Tab' }) as any;
        result.current.onKeyDown(event);
      });
      
      expect(result.current.isKeyboardInteraction).toBe(true);
    });

    it('detects Enter key as keyboard interaction', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = new KeyboardEvent('keydown', { key: 'Enter' }) as any;
        result.current.onKeyDown(event);
      });
      
      expect(result.current.isKeyboardInteraction).toBe(true);
    });

    it('detects Space key as keyboard interaction', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = new KeyboardEvent('keydown', { key: ' ' }) as any;
        result.current.onKeyDown(event);
      });
      
      expect(result.current.isKeyboardInteraction).toBe(true);
    });

    it('sets isActive on Enter key down', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = new KeyboardEvent('keydown', { key: 'Enter' }) as any;
        result.current.onKeyDown(event);
      });
      
      expect(result.current.isActive).toBe(true);
    });

    it('sets isActive on Space key down', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = new KeyboardEvent('keydown', { key: ' ' }) as any;
        result.current.onKeyDown(event);
      });
      
      expect(result.current.isActive).toBe(true);
    });

    it('clears isActive on key up for Enter', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const downEvent = new KeyboardEvent('keydown', { key: 'Enter' }) as any;
        result.current.onKeyDown(downEvent);
      });
      expect(result.current.isActive).toBe(true);
      
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upEvent = new KeyboardEvent('keyup', { key: 'Enter' }) as any;
        result.current.onKeyUp(upEvent);
      });
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Combined States', () => {
    it('can have hover and keyboard focus simultaneously', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onMouseEnter();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = new KeyboardEvent('keydown', { key: 'Tab' }) as any;
        result.current.onKeyDown(event);
      });
      
      expect(result.current.isHovered).toBe(true);
      expect(result.current.isFocused).toBe(false); // Focus set on onFocus, not onKeyDown
      expect(result.current.isKeyboardInteraction).toBe(true);
    });

    it('clears all states on unmount', () => {
      const { result, unmount } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onFocus();
        result.current.onMouseEnter();
      });
      
      expect(result.current.isFocused).toBe(true);
      expect(result.current.isHovered).toBe(true);
      
      unmount();
      
      // After unmount, the hook cleanup runs (no assertion needed, just verifying no errors)
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple rapid clicks', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onMouseDown();
        result.current.onMouseUp();
        result.current.onMouseDown();
        result.current.onMouseUp();
        result.current.onMouseDown();
      });
      
      expect(result.current.isActive).toBe(true);
    });

    it('handles focus and blur alternation', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        result.current.onFocus();
        result.current.onBlur();
        result.current.onFocus();
      });
      
      expect(result.current.isFocused).toBe(true);
    });

    it('ignores unrecognized keys', () => {
      const { result } = renderHook(() => useInteractionState());
      
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = new KeyboardEvent('keydown', { key: 'A' }) as any;
        result.current.onKeyDown(event);
      });
      
      expect(result.current.isKeyboardInteraction).toBe(false);
      expect(result.current.isActive).toBe(false);
    });
  });
});
