# Documentation Cleanup - Execution Plan

## Overview
- **Total files to assess:** 302
- **Estimated files to remove:** 70-80 (23%)
- **Estimated files to archive:** 40-50 (13%)
- **Files to keep (active):** 120-150 (40-50%)
- **New directory structure:** Add `docs/archive/`

---

## Phase 1: Validation & Backup

### Step 1: Backup (5 min)
```bash
# Option A: Git commit (recommended)
git add docs/
git commit -m "backup: docs state before cleanup"

# Option B: ZIP backup
tar -czf docs-backup-$(date +%Y%m%d).tar.gz docs/
```

### Step 2: Validate No Active References (10 min)
```bash
# Check git history for document usage
git log --all --grep="PHASE-1\|PHASE-2\|PHASE-3\|PHASE-4" --oneline | wc -l

# Search for references in code
grep -r "PHASE-1\|PHASE-2\|PHASE-3\|PHASE-4" --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" frontend/ backend-* || echo "No code references"

# Search in main docs
grep -r "PHASE-1\|PHASE-2\|PHASE-3\|PHASE-4" docs/ | grep -v "PHASE-5" | wc -l
```

**Expected result:** <5 references outside of archived phase docs themselves

---

## Phase 2: Create Archive Structure (5 min)

```bash
# Create archive directory
mkdir -p docs/archive/{phases,completed-issues,performance-baselines,session-reports}

# Create README for archive
cat > docs/archive/README.md << 'EOF'
# Documentation Archive

This directory contains historical documentation from completed phases and issues.

**Preserved for:**
- Learning/reference
- Project history
- Performance baselines
- Completed phase insights

**Archive contents:**
- `phases/` — Completed Phase 1-4 documentation
- `completed-issues/` — Documentation for closed issues (#27, #120, #121, etc.)
- `performance-baselines/` — Historical performance data
- `session-reports/` — Session reports >60 days old

**To reference archived docs:** Use git history or search this directory.
EOF
```

---

## Phase 3: Move Files to Archive (30 min)

### Step 3.1: Archive Completed Phases (10 min)
```bash
# Move PHASE-1 through PHASE-4 documentation
for phase in 1 2 3 4; do
  mkdir -p docs/archive/phases/phase-$phase
  mv docs/implementation-planning/PHASE-${phase}-* docs/archive/phases/phase-$phase/ 2>/dev/null || true
  mv docs/implementation-planning/PHASE${phase}-* docs/archive/phases/phase-$phase/ 2>/dev/null || true
  mv docs/dev-note/PHASE${phase}-* docs/archive/phases/phase-$phase/ 2>/dev/null || true
done
```

### Step 3.2: Archive Completed Issues (10 min)
```bash
# Archive Issues #27, #120, #121 (add others as needed)
for issue in 27 120 121 152 153 207 208 209 212 213 214 215 216; do
  mkdir -p docs/archive/completed-issues/issue-$issue
  
  # Move from all source directories
  find docs/ -maxdepth 2 -type f -name "*${issue}*" -exec mv {} \
    docs/archive/completed-issues/issue-$issue/ \; 2>/dev/null || true
done
```

### Step 3.3: Archive Performance Baselines (5 min)
```bash
# Move performance-related documents
mv docs/dev-note/PERFORMANCE*.md docs/archive/performance-baselines/ 2>/dev/null || true
mv docs/implementation-planning/PERFORMANCE*.md docs/archive/performance-baselines/ 2>/dev/null || true
```

### Step 3.4: Validate Archive (5 min)
```bash
# Count archived files
find docs/archive -type f | wc -l

# Verify README exists
ls docs/archive/README.md
```

---

## Phase 4: Delete Duplicate & Redundant Files (10 min)

### Step 4.1: Remove Day-by-Day Progress Logs
```bash
# ISSUE-6 day-by-day logs (replaced by final closure)
rm -f docs/dev-note/ISSUE-6-DAY*.md

# Check what remains
ls docs/dev-note/ISSUE-6-* 2>/dev/null && echo "Remaining ISSUE-6 docs OK" || echo "All ISSUE-6 DAY logs removed"
```

### Step 4.2: Remove Duplicate Cache Files
```bash
# Keep CACHE_TYPES_IMPLEMENTATION.md, remove singular
rm -f docs/dev-note/CACHE_TYPE_IMPLEMENTATION.md
ls docs/dev-note/CACHE_TYPE*.md
```

### Step 4.3: Clean Up Redundant Files (5 min)
```bash
# Remove *-v1, *-REVISED, *-UPDATED patterns if they have newer versions
for dir in docs/design-review docs/pm-review docs/pr-review; do
  # Check for duplicates (manual review recommended)
  ls $dir/*-REVISED* $dir/*-UPDATED* 2>/dev/null || echo "$dir: No redundant versioning found"
done
```

---

## Phase 5: Validate & Update References (15 min)

### Step 5.1: Check for Broken Links (10 min)
```bash
# Search for references to deleted files
echo "Checking for references to archived PHASE-1 docs..."
grep -r "PHASE-1" docs/ --include="*.md" | grep -v "archive/" | wc -l

echo "Checking for references to archived Issues..."
grep -r "ISSUE-27\|ISSUE-120\|ISSUE-121" docs/ --include="*.md" | grep -v "archive/" | wc -l

# Should return 0 or <3 (only index references)
```

### Step 5.2: Update Directory READMEs (5 min)
```bash
# Create/update README for each cleaned directory
for dir in implementation-planning dev-note design-review pm-review; do
  test -f docs/$dir/README.md || cat > docs/$dir/README.md << 'EOF'
# Documentation Index

See also: [Main Cleanup Assessment](../DOCUMENTATION_CLEANUP_ASSESSMENT.md)

**Recent work:** This directory contains active, recent documentation.

**Historical:** See [Archive](../archive/) for completed phases and closed issues.
EOF
done
```

---

## Phase 6: Cleanup & Final Validation (10 min)

### Step 6.1: Remove Empty Directories (2 min)
```bash
# Some directories may be empty after archive moves
find docs/ -type d -empty -not -path "*/\.git/*" -exec rmdir {} \; 2>/dev/null

# Verify structure
tree docs/ -L 1 -d
```

### Step 6.2: Final Validation (5 min)
```bash
# Count files before/after
echo "Files remaining in docs/:"
find docs/ -type f -name "*.md" -o -name "*.txt" | wc -l

# List orphaned or suspicious files (manual review)
find docs/ -type f -name "*temp*" -o -name "*backup*" -o -name "*old*" -o -name "*delete*"
```

### Step 6.3: Lint Check (3 min)
```bash
# If project has markdown linter
pnpm lint docs/ 2>/dev/null || echo "No markdown linter configured"

# Check for broken markdown links (manual)
grep -r "\[.*\](.*)" docs/ --include="*.md" | head -10
```

---

## Phase 7: Git Commit (5 min)

```bash
# Stage changes
git add docs/
git status

# Review what's being committed
git diff --cached --stat

# Commit with description
git commit -m "docs: cleanup - archive phases 1-4 and completed issues

- Archive PHASE-1 through PHASE-4 planning docs (40 files)
- Archive completed issues #27, #120, #121, #152-216 (50+ files)
- Remove day-by-day progress logs (10 files)
- Remove duplicate cache files
- Create docs/archive/ with clear organization
- Update directory READMEs with cleanup guidance

Total: ~100 files archived/removed
Remaining active docs: ~120 files (improved signal-to-noise)

See DOCUMENTATION_CLEANUP_ASSESSMENT.md for criteria and rationale."

# Verify commit
git log --oneline -1
```

---

## Rollback Plan (If Needed)

### Quick Rollback
```bash
# Undo everything and restore from backup commit
git reset --hard HEAD~1
```

### Selective Rollback
```bash
# Restore specific file from archive
git checkout HEAD~1 -- docs/implementation-planning/PHASE-1-FINDINGS.md
```

---

## Checklist

- [ ] **Phase 1:** Backup created
- [ ] **Phase 1:** No active code references found
- [ ] **Phase 2:** Archive directories created
- [ ] **Phase 3:** Files moved to archive (40-50)
- [ ] **Phase 4:** Duplicates removed (10-20)
- [ ] **Phase 5:** No broken links detected
- [ ] **Phase 5:** Directory READMEs updated
- [ ] **Phase 6:** Empty dirs cleaned
- [ ] **Phase 6:** File count validated
- [ ] **Phase 7:** Git commit successful
- [ ] **Final:** Can still access archived docs via git

---

## Expected Results

### Before Cleanup
```
docs/
├── implementation-planning/   (187 files)
├── dev-note/                 (56 files)
├── design-review/            (17 files)
├── (other dirs)              (42 files)
└── Total: 302 files
```

### After Cleanup
```
docs/
├── implementation-planning/   (50 files - active phases 5+)
├── dev-note/                 (15 files - active issues)
├── design-review/            (10 files - active work)
├── pm-review/                (4 files)
├── session-report/           (3 files - recent)
├── tester-review/            (3 files - recent)
├── (other dirs)              (20 files)
├── archive/                  (100 files - historical)
├── DOCUMENTATION_CLEANUP_ASSESSMENT.md
├── CLEANUP_CRITERIA_REFERENCE.md
├── CLEANUP_EXECUTION_PLAN.md  (this file)
└── Total: ~200 files (34% reduction, 100 archived)
```

### Signal-to-Noise Improvement
- **Before:** 30% active content, 70% noise/historical
- **After:** 60% active content, 40% archived (organized)
- **Navigation time:** ~50% reduction (easier to find current work)

---

## Time Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 1: Backup & Validation | 15 min | Quick checks |
| Phase 2: Create Archive | 5 min | mkdir + README |
| Phase 3: Move to Archive | 30 min | Batch moves |
| Phase 4: Delete Duplicates | 10 min | Targeted removes |
| Phase 5: Validate | 15 min | Link checking |
| Phase 6: Final Cleanup | 10 min | Empty dirs, validation |
| Phase 7: Git Commit | 5 min | Commit + verification |
| **Total** | **90 min** | 1.5 hours |

---

## Next Steps

After cleanup:

1. **Distribute cleanup documents** — Share CLEANUP_CRITERIA_REFERENCE.md with team
2. **Update team practices** — Establish naming conventions to prevent recurrence
3. **Schedule quarterly review** — Review docs/ every 3 months
4. **Archive old sessions** — Automate archival of session reports >90 days

