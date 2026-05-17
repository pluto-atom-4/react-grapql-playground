# Documentation Cleanup Assessment & Removal Criteria

**Total files across target directories:** 302 files  
**Date of assessment:** May 17, 2026  
**Scope:** 11 documentation directories  

---

## Summary by Directory

| Directory | File Count | Status | Cleanup Strategy |
|-----------|-----------|--------|-----------------|
| `docs/implementation-planning/` | 187 | MIXED | Archive old phases (1-4), keep active (5+) |
| `docs/dev-note/` | 56 | MIXED | Keep recent issues (#256+), archive pre-#200 |
| `docs/design-review/` | 17 | ACTIVE | Keep Issue #299 assessment, archive Issue #27 |
| `docs/pm-review/` | 9 | MIXED | Keep current, archive old analyses |
| `docs/session-report/` | 6 | ACTIVE | Keep recent sessions, archive pre-May |
| `docs/tester-review/` | 6 | ACTIVE | Keep current, archive historical |
| `docs/frontend-integration-issues/` | 5 | ACTIVE | Keep Issue #40 work, may consolidate |
| `docs/reviewer-outcome/` | 4 | MIXED | Archive Phase 1-3, keep Phase 4+ |
| `docs/pr-review/` | 5 | ARCHIVED | Consider full removal or archival |
| `docs/product-analysis/` | 6 | ARCHIVED | Archive or consolidate to pm-review |
| `docs/review-pr/` | 1 | SINGLE | Assess purpose, likely removable |

---

## Removal Criteria Framework

### ✅ KEEP (Active & Relevant)

**Criteria:**
- Files from last 60 days (actively referenced)
- Parent issue tracking documents (Issue #299, #300, #301, #302)
- Current implementation plans (Phase 5+)
- Key architectural decisions (CLAUDE.md, DESIGN.md, event bus docs)
- Test/QA reports for current sprints
- README files in each directory (context/navigation)

**Examples to keep:**
- `design-review/ISSUE_299_PM_ASSESSMENT.md` (current work)
- `implementation-planning/PHASE-5-*.md` (active phase)
- `implementation-planning/ORCHESTRATION-*.md` (current patterns)
- Recent session reports (last 30 days)
- Active PR review documents

### 🗑️ REMOVE (Obsolete & Low Value)

**Criteria:**
- Implementation plans >90 days old (pre-Phase 5)
- Completed issue analysis for closed issues (#27, #120, #121, etc.)
- Duplicate documents with same purpose
- Day-by-day progress logs (ISSUE-6-DAY1, DAY2, etc.)
- Superseded by newer versions (keep latest, remove v1/v2)
- Single-use session artifacts with no ongoing value
- Documents referencing completed, merged PRs

**Examples to remove:**
- `dev-note/ISSUE-6-DAY*.md` (6 files) — replaced by final closure
- `implementation-planning/ISSUE-27-*.md` (6 files) — Issue #27 closed
- `implementation-planning/ISSUE-120-*.md` (5+ files) — completed
- `implementation-planning/PHASE-1-*.md` (3+ files) — completed Phase 1
- `implementation-planning/PHASE-2-*.md` (12+ files) — completed Phase 2
- `implementation-planning/PHASE-3-*.md` (3+ files) — completed Phase 3
- `implementation-planning/PHASE-4-*.md` (10+ files) — completed Phase 4
- Duplicate cache type files: `CACHE_TYPE_IMPLEMENTATION.md` vs `CACHE_TYPES_IMPLEMENTATION.md`

### 📦 ARCHIVE (Valuable but Historical)

**Criteria:**
- Historical reference value but no active use
- Key decisions/learnings from completed phases
- Performance baselines, benchmarks from past work
- Lessons learned documents

**Action:** Move to `docs/archive/` subdirectory for historical reference

**Examples to archive:**
- `implementation-planning/PHASE-1-LESSONS-LEARNED.md`
- `implementation-planning/CONFLICT-RESOLUTION-STRATEGY.md`
- `implementation-planning/ORCHESTRATION-COORDINATION-REPORT-256-295.md`
- Performance benchmarks: `dev-note/PERFORMANCE*.md`
- Issue #40 related docs (completed issue)

### 🔄 CONSOLIDATE (Redundant Variants)

**Criteria:**
- Multiple versions of same document (-v1, -v2, UPDATED, REVISED, etc.)
- Same purpose, different naming conventions
- Split files that should be merged

**Examples:**
- `CACHE_TYPE_IMPLEMENTATION.md` + `CACHE_TYPES_IMPLEMENTATION.md` → Keep one
- Multiple ORCHESTRATOR analyses → One consolidated view
- Multiple PHASE-*-SUMMARY files → Consolidate to INDEX
- Issue-specific *-PLAN and *-QUICK-REFERENCE pairs

---

## Detailed Cleanup Plan by Directory

### 1. `docs/implementation-planning/` (187 files) — LARGEST

**Estimate: Remove ~120 files, Keep ~50, Archive ~17**

#### REMOVE (Completed phases 1-4):
```
PHASE-1-*.md          (3 files)
PHASE-2-BLOCK-*.md    (6 files)
PHASE-2-*.md          (12 files)
PHASE-3-*.md          (3 files)
PHASE-4-*.md          (10 files)
ISSUE-27-*.md         (6 files)
ISSUE-120-*.md        (5+ files)
ISSUE-121-*.md        (5+ files)
ISSUE-152-*.md        (2 files)
ISSUE-153-*.md        (3 files)
ISSUE-207-*.md        (2 files)
ISSUE-208-*.md        (2 files)
ISSUE-209-*.md        (2 files)
ISSUE-212-*.md        (6 files)
ISSUE-213-*.md        (7 files)
ISSUE-214-*.md        (1 file)
ISSUE-215-*.md        (2 files)
ISSUE-216-*.md        (8 files)
```

#### KEEP (Active/Current):
```
PHASE-5-*.md          (5 files) — Active phase
ORCHESTRATION-*.md    (8 files) — Current pattern
ISSUE-256-*.md        (2 files) — Recent issue
ISSUE-295-*.md        (4 files) — Recent issue
ISSUE-30-*.md         (4 files) — Reference material
PHASE-STATUS-CHECK.md (1 file)  — Status tracking
01_START_HERE.md      (1 file)  — Navigation
README.md             (1 file)  — Context
```

#### ARCHIVE (Historical value):
```
CONFLICT-RESOLUTION-STRATEGY.md
ORCHESTRATION-COORDINATION-REPORT-256-295.md
ISSUE-30-ORCHESTRATION-PLAN.md
ISSUE-40-*.md         (3 files)
ISSUE-32-TIMEOUT-RETRY.md
```

---

### 2. `docs/dev-note/` (56 files) — SECOND LARGEST

**Estimate: Remove ~35 files, Keep ~15, Archive ~6**

#### REMOVE:
```
ISSUE-6-DAY*.md       (4 files) — Replaced by ISSUE-6-FINAL-CLOSURE.md
CACHE_TYPE_IMPLEMENTATION.md — Keep only CACHE_TYPES_IMPLEMENTATION.md
Duplicate SSE files
```

#### KEEP:
```
ISSUE-6-FINAL-CLOSURE.md
ISSUE-7-*.md          (5 files) — Architecture documentation
ISSUE-256-*.md        (3 files) — Recent work
ISSUE-295-*.md        (2 files) — Recent work
README.md
```

#### ARCHIVE:
```
PHASE6-TESTING-REPORT.md
PERFORMANCE*.md       (2 files)
ISSUE-28-*.md         (2 files)
ISSUE-29-*.md         (2 files)
ISSUE-30-*.md         (2 files)
ISSUE-31-*.md         (2 files)
```

---

### 3. `docs/design-review/` (17 files)

**Estimate: Remove ~8 files, Keep ~6, Archive ~3**

#### REMOVE:
```
ISSUE_27_*.md         (4 files) — Issue #27 closed
FRESH_PER_REQUEST_PATTERN.md
APOLLO_CLIENT_ANALYSIS.md
UX-DESIGN-REVIEW-AND-IMPROVEMENT-PLAN.md (superseded)
```

#### KEEP:
```
ISSUE_299_PM_ASSESSMENT.md — Current work
DESIGN_REVIEW_INDEX.md
DESIGN_UPDATE_VERIFICATION.txt
PRODUCT-REVIEW-TABS.md
README.md
DELIVERABLES.md
```

#### ARCHIVE:
```
DESIGN_REVIEW_SUMMARY.md
DESIGN-UPDATE-VERIFICATION.txt (historical decision log)
```

---

### 4. `docs/pm-review/` (9 files)

**Estimate: Remove ~3 files, Keep ~4, Archive ~2**

#### REMOVE:
```
OLD_JWT_AUTH_*.md (if any exist)
Duplicate decision cards
```

#### KEEP:
```
00_START_HERE.md
DECISION_CARD.md (current)
PM_SECURITY_ASSESSMENT.md
README.md
QUICK_REFERENCE.txt
```

#### ARCHIVE:
```
Old security assessments (pre-Phase 5)
Historical design enhancement reports
```

---

### 5. `docs/session-report/` (6 files)

**Estimate: Remove ~2 files, Keep ~3, Archive ~1**

**Action:** Keep only reports from last 60 days
- Delete older session reports
- Archive orchestrator analysis (historical)

---

### 6. `docs/tester-review/` (6 files)

**Estimate: Remove ~2 files, Keep ~3, Archive ~1**

**Action:** Keep current test reviews, archive historical ones

---

### 7. `docs/reviewer-outcome/` (4 files)

**Estimate: Remove ~2 files, Archive ~2**

**Action:** Merge with pr-review if similar purpose; archive Phase 1-3 reviews

---

### 8. `docs/pr-review/`, `docs/product-analysis/`, `docs/review-pr/` (12 files total)

**Estimate: Consider consolidation**

**Action Options:**
1. Consolidate all into single `docs/pr-review/` directory
2. Archive entire categories if historically focused
3. Merge into appropriate categories (pm-review, tester-review)

---

### 9. `docs/frontend-integration-issues/` (5 files)

**Action:** Assess if still relevant; may consolidate into design-review or dev-note

---

## Recommended Cleanup Sequence

### Phase 1: Quick Wins (30 min)
1. Remove day-by-day progress logs (ISSUE-6-DAY*.md)
2. Remove duplicate cache type files
3. Archive PHASE-1 through PHASE-4 planning documents

### Phase 2: Systematic Archive (1-2 hours)
1. Create `docs/archive/` directory
2. Move historical performance benchmarks
3. Move completed issue analysis (Issues #27, #120, #121, #152-#153)
4. Move old phase documentation (PHASE-1 through PHASE-4)

### Phase 3: Consolidation (1 hour)
1. Review and consolidate duplicate naming patterns
2. Merge similar directories if appropriate
3. Update directory READMEs with guidance

### Phase 4: Cleanup & Validation (30 min)
1. Remove orphaned files
2. Update cross-references if any
3. Create summary index

---

## Before/After Impact

### Before
- **302 total files** across 11 directories
- **Multiple duplicate variants** (CACHE_TYPE vs CACHE_TYPES, multiple PHASE analyses)
- **Low signal-to-noise ratio** (ancient progress logs mixed with current work)
- **Navigation overhead** (hard to find current vs historical documents)

### After (Estimated)
- **~150-170 active files** (43-44% reduction)
- **~80-100 archived files** (well-organized, reference-only)
- **Clear separation** (current work vs historical)
- **Faster navigation** (READMEs guide users to relevant docs)

---

## Execution Checklist

- [ ] Backup current docs/ directory (git commit or ZIP)
- [ ] Create `docs/archive/` directory
- [ ] Review and validate each file before removal
- [ ] Update cross-references in remaining docs
- [ ] Update each directory's README with cleanup changes
- [ ] Validate no broken links in CLAUDE.md or DESIGN.md
- [ ] Final git commit with cleanup summary

---

## Key Questions to Validate Before Cleanup

1. **PHASE-1 through PHASE-4 docs:** Are these only historical, or are they referenced by team members?
2. **Completed issue docs (Issues #27, #120, #121):** Should they stay for portfolio/learning value?
3. **Duplicate naming patterns:** Should we establish naming conventions going forward?
4. **Session reports:** How far back should we keep?
5. **Archived folder:** Public visibility or internal-only?

