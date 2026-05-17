# Documentation Cleanup Criteria - Quick Reference

## Decision Matrix

**Use this matrix to categorize any file in docs/**

```
┌─────────────────────────────────────────────────────────────┐
│                REMOVAL CRITERIA CHECKLIST                   │
├─────────────────────────────────────────────────────────────┤
│ KEEP if ANY of these are TRUE:                              │
│ □ File is <60 days old AND actively referenced              │
│ □ Essential architecture/design (CLAUDE.md pattern)         │
│ □ Current phase work (Phase 5+, active issues)              │
│ □ Directory README or index file                            │
│ □ Critical decision log (conflict resolution, architecture) │
│ □ Test/QA reports for ongoing features                      │
│                                                              │
│ REMOVE if ALL of these are TRUE:                            │
│ □ File is >90 days old                                      │
│ □ Issue/phase associated is CLOSED/MERGED                   │
│ □ Document is superseded by newer version                   │
│ □ No active references from other repo docs                 │
│ □ Not in project's core architecture path                   │
│ □ Day-by-day progress log (DAY1, DAY2 pattern)             │
│                                                              │
│ ARCHIVE if ANY of these are TRUE:                           │
│ □ File has historical/learning value                        │
│ □ Completed phase documentation                             │
│ □ Performance baselines from past work                       │
│ □ Lessons learned from completed issues                     │
│ □ Reference material for future phases                      │
└─────────────────────────────────────────────────────────────┘
```

---

## File Patterns to Target

### 🗑️ HIGH CONFIDENCE REMOVAL (Safe to Delete)

| Pattern | Example | Count | Reason |
|---------|---------|-------|--------|
| Day-by-day logs | `ISSUE-6-DAY1.md`, `DAY2.md` | ~10 files | Replaced by final closure reports |
| Duplicate variants | `CACHE_TYPE_IMPLEMENTATION.md` vs `CACHE_TYPES_IMPLEMENTATION.md` | ~5 pairs | Keep latest, remove older |
| Completed phases | `PHASE-1-*.md`, `PHASE-2-*.md`, `PHASE-3-*.md`, `PHASE-4-*.md` | ~30 files | Phases 1-4 merged to main |
| Closed issues (old) | `ISSUE-27-*.md`, `ISSUE-120-*.md`, `ISSUE-121-*.md` | ~20 files | Issues closed >90 days ago |
| Superseded docs | `*-v1.md`, `*-REVISED.md`, `*-UPDATED.md` | ~8 files | Newer version exists |

**Total safe to remove: ~70-80 files**

---

### 🟨 MEDIUM CONFIDENCE REMOVAL (Review First)

| Pattern | Example | Action |
|---------|---------|--------|
| Old implementation plans | Issues #152-#216 | Review: still referenced? |
| Session reports | >60 days old | Move to archive, don't delete |
| Performance reports | Old baselines | Archive for historical reference |
| Analysis documents | Old orchestrator reports | Archive or consolidate |
| Historical PRs | PR #44, PR #139 pre-review | Archive if complete |

**Total to review/archive: ~40-50 files**

---

### 🟢 KEEP (No Removal)

| Category | Examples | Reason |
|----------|----------|--------|
| Current phase | `PHASE-5-*.md` | Active development |
| Active issues | Issues #256, #295, #299+ | In progress or recent |
| Architecture | `CLAUDE.md`, `DESIGN.md` | Core project docs |
| Pattern reference | `ORCHESTRATION-*.md` | Used for current work |
| Directory README | All `README.md` files | Navigation & context |
| Key decisions | `CONFLICT-RESOLUTION-STRATEGY.md` | Learning resource |
| Issue #7 docs | Event bus architecture | Active system |
| Issue #6 docs | Frontend SSE integration | Active system |

**Total to keep: ~80-100 files**

---

## Implementation Rules

### Rule 1: No Orphaned Files
**Before removing a file, check if it's referenced:**
```bash
grep -r "FILENAME" docs/ *.md CLAUDE.md
```
If found, update references or archive instead of deleting.

### Rule 2: Keep Directory READMEs
**Never delete a README.md** — it provides navigation and context

### Rule 3: Git History is Your Archive
- Deleted files are **recoverable** from git history
- Deleted files don't reduce build time or deployment size (they're not in built artifact)
- Therefore: **Safe to delete old files** if not actively used

### Rule 4: Archive Current Phase +1
- Keep active phase
- Archive previous completed phase
- Delete phase >2 versions old

### Rule 4: Batch by Issue/Phase
- Remove all docs for a single completed issue at once
- Reduces orphaned references
- Easier to validate

---

## By-Directory Quick Recommendations

```
📁 implementation-planning/
   ├─ 🗑️  Remove: PHASE-1, PHASE-2, PHASE-3, PHASE-4 (30 files)
   ├─ 📦 Archive: Conflict resolution, old orchestration (8 files)
   └─ ✅ Keep: PHASE-5, current orchestration, recent issues (50 files)

📁 dev-note/
   ├─ 🗑️  Remove: ISSUE-6-DAY*.md, old caches (10 files)
   ├─ 📦 Archive: Performance benchmarks, closed issues (8 files)
   └─ ✅ Keep: ISSUE-7, ISSUE-256+, README (15 files)

📁 design-review/
   ├─ 🗑️  Remove: ISSUE_27_* (4 files)
   ├─ 📦 Archive: Old design reviews (3 files)
   └─ ✅ Keep: ISSUE_299, design index, README (10 files)

📁 implementation-planning/
   ├─ ✅ Keep: ISSUE_299_PM_ASSESSMENT.md (active)
   └─ (consolidate into pm-review or design-review)

📁 pr-review/, product-analysis/, review-pr/
   ├─ 🗑️  Remove or consolidate (12 files)
   └─ 📦 Archive: Historical reviews

📁 session-report/, tester-review/, reviewer-outcome/
   ├─ 📦 Archive: >60 days old (5 files)
   └─ ✅ Keep: Recent (10 files)
```

---

## Testing Cleanup (Validation)

After removing files, run:

```bash
# Check for broken links
grep -r "REMOVED_FILE_NAME" docs/ *.md CLAUDE.md README.md

# Verify directory structure still makes sense
tree docs/ -L 2

# Ensure READMEs exist
find docs/ -mindepth 2 -maxdepth 2 -type d ! -name archive -exec test ! -f {}/README.md \; -print

# Confirm git state
git status
```

---

## Archive Structure (Proposed)

```
📁 docs/archive/
├── phases/
│   ├── phase-1-lessons-learned.md
│   ├── phase-2-coordination.md
│   ├── phase-3-4-review.md
│   └── conflict-resolution-strategy.md
├── completed-issues/
│   ├── issue-27/
│   ├── issue-120/
│   └── issue-121/
├── performance-baselines/
│   ├── 2026-01-performance-benchmark.md
│   └── 2026-02-cache-analysis.md
├── session-reports/
│   └── (old session reports >60 days)
└── README.md (links to what's archived and why)
```

---

## Success Criteria

✅ Cleanup is successful when:
- [ ] Files per directory reduced by 40-50%
- [ ] No broken links in remaining docs
- [ ] All recent work (Phase 5+, Issues #256+) easily findable
- [ ] Historical content still accessible in archive/
- [ ] Each directory has clear README explaining what stays
- [ ] Total cleanup time <4 hours
- [ ] No git errors or merge conflicts

