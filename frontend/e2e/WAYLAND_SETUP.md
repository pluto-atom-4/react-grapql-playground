# Playwright E2E Tests on Wayland (KDE Plasma)

This guide covers running Playwright E2E tests on systems using Wayland display server (like KDE Plasma on Debian).

## Quick Start

### Requirement: Install Xvfb (once)

```bash
# Install X virtual framebuffer
sudo apt-get install xvfb xauth

# Verify installation
xvfb-run -version
```

### Run Tests

```bash
# Headless mode (recommended)
pnpm e2e:wayland

# With visual window (debugging)
pnpm e2e:wayland:headed

# Run specific test file
pnpm e2e:wayland my-test.spec.ts
```

## How It Works

**Xvfb** creates a virtual X11 display that Playwright can control reliably:

```
┌─────────────────────────────────────────┐
│  KDE Plasma (Wayland Display Server)    │
├─────────────────────────────────────────┤
│  Xvfb (:99) Virtual X11 Display         │
├─────────────────────────────────────────┤
│  Playwright → Chromium (via X11)        │
│  Tests run without display conflicts    │
└─────────────────────────────────────────┘
```

## Why Xvfb?

✅ **Reliable**: Chromium works best with X11 backend, even in headless mode  
✅ **Simple**: No complex configuration needed  
✅ **Portable**: Works on any Linux with Xvfb installed  
✅ **CI-Friendly**: Same approach works locally and in CI/CD  

## Alternative: Firefox Only

If you prefer not to use Xvfb:

```bash
# Firefox has better native Wayland support
pnpm e2e --project=firefox
```

## Troubleshooting

### "xvfb-run: command not found"

```bash
# Install Xvfb
sudo apt-get install xvfb xauth
```

### Tests pass locally but fail in CI

Add this to your CI workflow:

```yaml
- name: Install Xvfb
  run: sudo apt-get install -y xvfb

- name: Run E2E tests
  run: pnpm e2e:wayland
```

### Slow test execution

Xvfb is resource-intensive. Reduce parallel workers:

```bash
# Run with 1 worker (slower but more reliable)
xvfb-run -a pnpm e2e -- --workers=1

# Or adjust resolution (larger = slower)
xvfb-run -a --server-args="-screen 0 1280x720x24" pnpm e2e
```

## See Also

- Full guide: [`PLAYWRIGHT_WAYLAND_GUIDE.md`](../../.copilot/session-state/*/PLAYWRIGHT_WAYLAND_GUIDE.md) in session folder
- Playwright docs: https://playwright.dev/docs/test-configuration
