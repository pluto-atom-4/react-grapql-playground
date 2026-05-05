# Issue #209 Quick Reference

## What You're Building
A React hook for fetching test runs with smart polling that auto-stops when tests complete.

## Quick Facts
- **Effort:** 4–5 hours
- **Hook:** `frontend/lib/hooks/useTestRuns.ts`
- **Tests:** 45+ test cases (85%+ coverage)
- **Dependencies:** Issue #207 (SubmitTestRunForm) ✅ merged
- **Parallelizable:** Can run with Issue #208

## Hook Signature
```typescript
export function useTestRuns(buildId: string, options?: {
  autoStart?: boolean;
  pollInterval?: number;
}) {
  return {
    testRuns: TestRun[];
    loading: boolean;
    error: Error | null;
    startPolling: (interval?: number) => void;
    stopPolling: () => void;
    refetch: () => Promise<any>;
    isPolling: boolean;
    pollInterval: number;
  };
}
```

## Key Features
1. **Initial Fetch** - GraphQL query with buildId
2. **Manual Polling** - startPolling() begins 2s interval polling
3. **Smart Stop** - Auto-stops when all tests terminal (PASSED/FAILED)
4. **Manual Stop** - stopPolling() cancels polling immediately
5. **Memory Safety** - Cleanup on unmount, no zombie intervals
6. **Error Recovery** - Continues polling even if request fails
7. **Cache Integration** - Apollo cache auto-updates, shared across components

## Task Summary

| Phase | Tasks | Time |
|-------|-------|------|
| 1: Foundation | Query, types, hook skeleton | 1h |
| 2: Polling Logic | State mgmt, startPolling, stopPolling, smart stop | 1.5h |
| 3: Advanced | Cleanup, error recovery, status indicator | 1h |
| 4: Testing | 45+ tests, integration, documentation | 1.5h |

## Success Criteria
✅ Hook accepts buildId parameter  
✅ Fetches test runs via GraphQL  
✅ startPolling() polls every 2 seconds  
✅ stopPolling() stops immediately  
✅ Auto-stops when all tests terminal  
✅ Cleanup on unmount (no memory leaks)  
✅ Error recovery doesn't crash  
✅ Multiple components can share hook  
✅ Apollo cache integration working  
✅ 85%+ test coverage  
✅ ESLint 0 errors  
✅ Handles rapid start/stop calls  

## Polling Strategy
- **Interval:** 2 seconds (configurable)
- **Auto-Stop:** When all tests PASSED or FAILED
- **Memory Safety:** Intervals cleared on unmount
- **Network Efficiency:** No polling after tests complete
- **Error Handling:** Continues polling on network errors

## Interview Talking Points
- React hook patterns for real-time data
- Smart polling saves bandwidth (auto-stop)
- Apollo Client integration and cache sharing
- Error handling for async operations
- Memory leak prevention in hooks
- Completes manufacturing workflow end-to-end

## Next Steps After PR Merge
- Issue #208 (TestRunDetailsPanel) ready to parallelize
- Full integration testing in BuildDetailModal
- Complete FileUploader epic (#33, #207, #208, #209)

---

**Ready to implement!** Follow ISSUE-209-DETAILED-PLAN.md for step-by-step guidance.
