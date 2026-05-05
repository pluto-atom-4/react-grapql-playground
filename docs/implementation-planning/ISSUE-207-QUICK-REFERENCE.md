# Issue #207 Quick Reference

## What You're Building
A form component that integrates FileUploader with GraphQL to submit test runs for manufacturing compliance.

## Quick Facts
- **Effort:** 6–8 hours
- **Component:** `frontend/components/SubmitTestRunForm.tsx`
- **Tests:** 67+ test cases (85%+ coverage)
- **Dependencies:** Issue #33 (FileUploader) MUST be merged first
- **Parallelizable:** Issue #208, #209 can start after #207

## Component Props
```typescript
interface SubmitTestRunFormProps {
  buildId: string;                       // Build this test is for
  onSuccess: (testRun: TestRun) => void; // Called on mutation success
  onCancel: () => void;                  // Called when user cancels
}
```

## Key Features
1. **FileUploader Integration** - Drag-drop file upload
2. **Status Dropdown** - PASSED | FAILED | PENDING
3. **Result Textarea** - Optional summary (max 500 chars)
4. **Form Validation** - Status required, file optional
5. **GraphQL Mutation** - Calls useSubmitTestRun with form data
6. **Error Handling** - Shows specific error messages
7. **Optimistic Updates** - Apollo updates cache immediately
8. **Accessibility** - ARIA labels, keyboard navigation

## Task Summary

| Phase | Tasks | Time |
|-------|-------|------|
| 1: Foundation | Project setup, skeleton, UI | 1.5h |
| 2: FileUploader | Import, callbacks, error handling | 1.5h |
| 3: Form Fields | Status, textarea, validation | 1.5h |
| 4: GraphQL | Mutation, submission, error handling | 1.5h |
| 5: Polish | Loading, toast, cancel, styling | 1h |
| 6: Testing | Unit, integration, accessibility tests | 1h |

## Success Criteria
✅ FileUploader renders and integrates  
✅ Status dropdown required, file optional  
✅ Form submission calls GraphQL mutation  
✅ Success callbacks fire and toast shows  
✅ Error messages display for failures  
✅ 85%+ test coverage (no ESLint errors)  
✅ Accessible (ARIA labels, keyboard nav)  

## Interview Talking Points
- Demonstrates Apollo Client patterns (optimistic updates, error handling)
- Shows controlled form patterns in React 19
- Bridges two features: file uploads → GraphQL mutations
- Good error handling and recovery UX
- Test strategy separates unit tests from integration
- Component composition and single responsibility

## Next Steps After PR Merge
- Issue #208 (TestRunDetailsPanel) - 5–6 hours, parallelizable
- Issue #209 (useTestRuns polling) - 4–5 hours, parallelizable with #208
- Integration testing in BuildDetailModal

---

**Ready to implement!** Follow ISSUE-207-DETAILED-PLAN.md for step-by-step guidance.
