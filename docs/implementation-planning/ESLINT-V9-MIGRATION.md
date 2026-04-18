# ESLint v9 Migration Implementation Plan

## Problem Summary

The `pnpm lint` command fails across the monorepo with:
```
ESLint: 9.39.4
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
From ESLint v9.0.0, the default configuration file is now eslint.config.js
```

**Root Cause**: The codebase uses `.eslintrc.json` (old ESLint v8 format), but ESLint v9 requires `eslint.config.js` (flat config format).

**Scope**: Affects all 4 packages in the monorepo:
- Root package (used as baseline)
- Frontend (Next.js + React)
- Backend GraphQL (Apollo Server)
- Backend Express (Express.js)

**Impact**: Linting command is broken; code quality gate cannot run.

---

## Current State Analysis

### ESLint Versions
- All packages use **ESLint ^9.1.1**
- All packages use **@typescript-eslint/eslint-plugin ^8.1.0**
- All packages use **@typescript-eslint/parser ^8.1.0**

### ESLint Config Files
| Location | File | Status |
|----------|------|--------|
| Root | `.eslintrc.json` | ✅ Exists |
| Frontend | `frontend/.eslintrc.json` | ✅ Exists |
| Backend GraphQL | N/A | ❌ Inherits from root |
| Backend Express | N/A | ❌ Inherits from root |

### Current Linting Scripts
```json
// Root: pnpm -r run lint (runs lint for all packages)
// Frontend: eslint . --ext .ts,.tsx
// Backend GraphQL: eslint src --ext .ts
// Backend Express: eslint src --ext .ts
```

### ESLint Rule Sets in Use

**Root `.eslintrc.json`** includes:
- `eslint:recommended` (ESLint base rules)
- `plugin:@typescript-eslint/recommended` (TypeScript recommended rules)
- `plugin:@typescript-eslint/recommended-requiring-type-checking` (Type checking rules)
- Custom rules: explicit function return types, no-any, no-unused-vars, no-floating-promises, no-console
- Ignore patterns: dist, build, .next, node_modules, coverage

**Frontend `.eslintrc.json`** extends root and adds:
- `plugin:react/recommended` (React rules)
- `plugin:react-hooks/recommended` (React Hooks rules)
- `next/core-web-vitals` (Next.js best practices)
- Custom rules: react/react-in-jsx-scope (disabled for React 19), react/prop-types (disabled), react-hooks rules
- React version override: 19

**Backend Packages** use root config (no overrides).

---

## Migration Strategy

### Overview
The migration follows ESLint's official conversion from `.eslintrc.json` to `eslint.config.js` (flat config format).

**Key Changes**:
1. Replace `extends` array with explicit `configs` imports
2. Replace plugins object with plugin imports
3. Simplify language/environment settings (no separate `env` object)
4. Use new flat config API: `languageOptions`, `rules`, `ignores`, etc.

### Architecture Decision

#### Option A: One Root Config (Shared Inheritance)
**Pros**: Single source of truth, minimal duplication
**Cons**: Less flexibility per package

#### Option B: Per-Package Configs (Recommended ✅)
**Pros**: Each package has independent linting rules; easier to maintain
**Cons**: More config files to maintain

**Decision**: Use **Option B** with optional root config as reference.
- Root: baseline config for shared rules
- Frontend: extends/overrides with React + Next.js specific rules
- Backend GraphQL: extends/overrides with GraphQL-specific rules (if needed)
- Backend Express: extends/overrides with Express-specific rules (if needed)

---

## Implementation Plan

### Phase 1: Investigation (Parallel Tasks)
These tasks can run in parallel—no dependencies.

#### 1.1: `investigate-eslint-v9-state`
**Goal**: Document current state and blockers

**Steps**:
1. Verify ESLint version across packages: `pnpm list eslint`
2. Check if any `eslint.config.js` files already exist
3. Run `pnpm lint` to capture full error output
4. Verify all required plugins are installed: eslint-plugin-react, eslint-config-next, etc.
5. Document findings

**Deliverable**: Investigation notes with version matrix and missing packages list

#### 1.2: `analyze-root-eslintrc`
**Goal**: Extract all ESLint rules from root config for migration

**Steps**:
1. Read root `.eslintrc.json`
2. Extract and document:
   - Parser: `@typescript-eslint/parser`
   - Extends: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:@typescript-eslint/recommended-requiring-type-checking`
   - Plugins: `@typescript-eslint`
   - All custom rules with severity levels
   - Ignore patterns
3. Check `tsconfig.json` for `project` reference
4. Create conversion checklist

**Deliverable**: Detailed rule mapping document for root config

#### 1.3: `analyze-frontend-eslintrc`
**Goal**: Extract React + Next.js specific rules

**Steps**:
1. Read `frontend/.eslintrc.json`
2. Identify differences from root config
3. Document React-specific rules:
   - React plugin rules
   - React Hooks plugin rules
   - Next.js core-web-vitals rules
4. Note version overrides (React 19)
5. Create conversion checklist for frontend

**Deliverable**: Detailed rule mapping document for frontend config

#### 1.4: `analyze-backend-graphql-eslint`
**Goal**: Document GraphQL backend linting needs

**Steps**:
1. Verify backend-graphql currently inherits from root (no .eslintrc file)
2. Check if any GraphQL-specific linting would be beneficial
3. Document resolver file patterns and any special linting needs
4. Note: likely identical to root config, unless GraphQL plugin needed

**Deliverable**: Analysis of GraphQL backend linting requirements

#### 1.5: `analyze-backend-express-eslint`
**Goal**: Document Express backend linting needs

**Steps**:
1. Verify backend-express currently inherits from root (no .eslintrc file)
2. Check if any Express-specific linting would be beneficial
3. Document route handler patterns and any special linting needs
4. Note: likely identical to root config

**Deliverable**: Analysis of Express backend linting requirements

---

### Phase 2: Configuration Creation (Sequential, after Phase 1)

#### 2.1: `create-root-eslint-config-js`
**Goal**: Create ESLint v9 flat config for root package

**Depends on**: `investigate-eslint-v9-state`, `analyze-root-eslintrc`

**File**: `/eslint.config.js`

**Template**:
```javascript
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist', 'build', '.next', 'node_modules', 'coverage'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        // Node.js + Browser globals
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules,
      // Custom rules from original config
      '@typescript-eslint/explicit-function-return-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
```

**Steps**:
1. Create `/eslint.config.js` with flat config format
2. Import ESLint JS config and TypeScript plugin
3. Configure parser options to match root `.eslintrc.json`
4. Migrate all custom rules to flat format
5. Test parsing with a sample file
6. Validate configuration loads without errors

**Deliverable**: Root `eslint.config.js` file

#### 2.2: `create-frontend-eslint-config-js`
**Goal**: Create ESLint v9 flat config for React + Next.js frontend

**Depends on**: `analyze-frontend-eslintrc`, `create-root-eslint-config-js`

**File**: `/frontend/eslint.config.js`

**Template**:
```javascript
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    ignores: ['dist', 'build', '.next', 'node_modules', 'coverage'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
      globals: {
        // Browser + React globals
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: { version: '19' },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      // Custom rules from original config
      'react/react-in-jsx-scope': 'off', // React 19
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-function-return-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

**Steps**:
1. Create `/frontend/eslint.config.js` with flat config format
2. Import React, React Hooks, and Next.js plugins
3. Include TypeScript + ESLint base configs
4. Migrate all React-specific rules
5. Override React version to 19
6. Test with React components and hooks
7. Validate configuration loads without errors

**Deliverable**: Frontend `eslint.config.js` file

#### 2.3: `create-backend-graphql-eslint-config-js`
**Goal**: Create ESLint v9 flat config for GraphQL backend

**Depends on**: `analyze-backend-graphql-eslint`, `create-root-eslint-config-js`

**File**: `/backend-graphql/eslint.config.js`

**Steps**:
1. Create `/backend-graphql/eslint.config.js` with flat config format
2. Use similar structure to root config (no React/Next.js needed)
3. Include TypeScript plugin and recommended rules
4. Configure parser for TS files in `/src` directory
5. Test with resolver files
6. Validate configuration loads without errors

**Deliverable**: Backend GraphQL `eslint.config.js` file

#### 2.4: `create-backend-express-eslint-config-js`
**Goal**: Create ESLint v9 flat config for Express backend

**Depends on**: `analyze-backend-express-eslint`, `create-root-eslint-config-js`

**File**: `/backend-express/eslint.config.js`

**Steps**:
1. Create `/backend-express/eslint.config.js` with flat config format
2. Use similar structure to root config (no React/Next.js needed)
3. Include TypeScript plugin and recommended rules
4. Configure parser for TS files in `/src` directory
5. Test with route handler files
6. Validate configuration loads without errors

**Deliverable**: Backend Express `eslint.config.js` file

---

### Phase 3: Dependency Management (Parallel)

#### 3.1: `install-missing-eslint-packages`
**Goal**: Ensure all ESLint v9 dependencies are properly installed

**Steps**:
1. Verify `eslint` v9.x is installed: `pnpm list eslint`
2. Verify TypeScript plugin: `pnpm list @typescript-eslint/eslint-plugin`
3. Check React plugin in frontend: `pnpm list eslint-plugin-react`
4. Check React Hooks plugin in frontend: `pnpm list eslint-plugin-react-hooks`
5. Check Next.js plugin in frontend: `pnpm list @next/eslint-plugin-next`
6. Install any missing packages: `pnpm add -D <package-name>`
7. Run `pnpm install` to update lock file

**Deliverable**: All required ESLint packages installed and locked

---

### Phase 4: Testing (Sequential, depends on Phase 2 & 3)

#### 4.1: `test-root-lint`
**Goal**: Verify root package linting passes

**Depends on**: `create-root-eslint-config-js`, `install-missing-eslint-packages`

**Steps**:
1. Navigate to repo root
2. Run: `pnpm lint`
3. Check for errors or warnings
4. If errors occur:
   - Review error messages
   - Adjust `eslint.config.js` as needed
   - Re-test
5. Document any rule adjustments made

**Success Criteria**:
- ✅ Command completes without errors
- ✅ No "couldn't find eslint.config.js" errors
- ✅ Any warnings are documented and acceptable

#### 4.2: `test-frontend-lint`
**Goal**: Verify frontend package linting passes

**Depends on**: `create-frontend-eslint-config-js`, `install-missing-eslint-packages`

**Steps**:
1. Navigate to `frontend/` directory
2. Run: `pnpm lint`
3. Check for errors or warnings related to:
   - React components
   - React Hooks usage
   - Next.js best practices
4. If errors occur:
   - Review specific rule violations
   - Adjust `frontend/eslint.config.js` as needed
   - Re-test
5. Document any rule adjustments

**Success Criteria**:
- ✅ Command completes without errors
- ✅ React and React Hooks rules apply correctly
- ✅ Next.js core-web-vitals are checked

#### 4.3: `test-backend-graphql-lint`
**Goal**: Verify backend-graphql package linting passes

**Depends on**: `create-backend-graphql-eslint-config-js`, `install-missing-eslint-packages`

**Steps**:
1. Navigate to `backend-graphql/` directory
2. Run: `pnpm lint`
3. Check for TypeScript errors in resolver files
4. If errors occur:
   - Review errors
   - Adjust `backend-graphql/eslint.config.js` as needed
   - Re-test
5. Document any rule adjustments

**Success Criteria**:
- ✅ Command completes without errors
- ✅ Resolver files pass TypeScript linting
- ✅ Query/Mutation implementations comply with rules

#### 4.4: `test-backend-express-lint`
**Goal**: Verify backend-express package linting passes

**Depends on**: `create-backend-express-eslint-config-js`, `install-missing-eslint-packages`

**Steps**:
1. Navigate to `backend-express/` directory
2. Run: `pnpm lint`
3. Check for TypeScript errors in route handler files
4. If errors occur:
   - Review errors
   - Adjust `backend-express/eslint.config.js` as needed
   - Re-test
5. Document any rule adjustments

**Success Criteria**:
- ✅ Command completes without errors
- ✅ Route handler files pass TypeScript linting
- ✅ Middleware and utilities comply with rules

#### 4.5: `test-full-monorepo-lint`
**Goal**: Verify the full `pnpm lint` command works end-to-end

**Depends on**: All Phase 4 tests (4.1 through 4.4)

**Steps**:
1. Navigate to repo root
2. Run: `pnpm lint` (this runs lint for all packages via workspace)
3. Capture complete output
4. Verify all 4 packages report success
5. Check for any lingering errors or warnings
6. If any failures:
   - Review package-specific error
   - Fix the respective `eslint.config.js`
   - Re-run full test
7. Document final results

**Success Criteria**:
- ✅ `pnpm lint` completes without errors
- ✅ All 4 packages (root, frontend, backend-graphql, backend-express) pass
- ✅ No ESLint v9 compatibility warnings
- ✅ Can run `pnpm lint:fix` to auto-fix issues

---

### Phase 5: Documentation & Cleanup

#### 5.1: `document-migration-notes`
**Goal**: Record migration details and best practices

**Depends on**: `test-full-monorepo-lint`

**Steps**:
1. Open `CLAUDE.md` or `README.md`
2. Add section: "ESLint v9 Flat Config Migration"
3. Document:
   - What changed from v8 to v9
   - Why each package has its own `eslint.config.js`
   - How to add new linting rules in flat config format
   - Common issues and troubleshooting
4. Add example of extending shared config from root
5. Save and commit documentation

**Deliverable**: Updated development guide with ESLint v9 migration notes

#### 5.2: `remove-old-eslintrc-files`
**Goal**: Clean up deprecated ESLint v8 config files

**Depends on**: `document-migration-notes` (ensure we won't need to revert)

**Steps**:
1. Verify `eslint.config.js` files are in place and working
2. Verify `pnpm lint` still passes
3. Delete root `.eslintrc.json`
4. Delete `frontend/.eslintrc.json`
5. Verify linting still works (should use new `eslint.config.js` files)
6. If any issues, restore from git and debug
7. Commit the cleanup

**Success Criteria**:
- ✅ Old `.eslintrc.json` files removed
- ✅ `pnpm lint` still passes
- ✅ No references to old config format in codebase

---

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| ESLint v9 breaking changes | High | Follow official ESLint migration guide; test incrementally |
| Plugin incompatibility | Medium | Verify all plugins support v9; check GitHub issues |
| TypeScript parser issues | Medium | Use matching `@typescript-eslint/*` versions; test early |
| Prettier conflicts | Low | Run `pnpm format:check` after linting changes |
| Git history loss | Low | Don't delete old files until fully confident; use git history |
| Monorepo sync issues | Medium | Test each package independently before full monorepo test |

---

## Success Criteria

1. ✅ All 4 packages have `eslint.config.js` files
2. ✅ `pnpm lint` command runs without "couldn't find eslint.config.js" error
3. ✅ All packages pass linting (no errors or unexpected warnings)
4. ✅ ESLint rules are maintained (same strictness as before)
5. ✅ `pnpm lint:fix` works to auto-fix issues
6. ✅ Old `.eslintrc.json` files removed
7. ✅ Development documentation updated
8. ✅ All existing linting rules preserved (React, TypeScript, Next.js)

---

## Timeline Estimate

| Phase | Todos | Estimate |
|-------|-------|----------|
| Phase 1: Investigation | 5 todos | 30-45 min (parallel) |
| Phase 2: Configuration | 4 todos | 1-1.5 hours |
| Phase 3: Dependencies | 1 todo | 15-20 min |
| Phase 4: Testing | 5 todos | 30-45 min |
| Phase 5: Documentation | 2 todos | 20-30 min |
| **Total** | **17 todos** | **~3-3.5 hours** |

**Critical Path**: Investigation → Root Config → Frontend Config → Package Tests → Full Monorepo Test → Documentation → Cleanup

---

## Todo Checklist

### Phase 1: Investigation
- [ ] `investigate-eslint-v9-state` - Document current state
- [ ] `analyze-root-eslintrc` - Extract root rules
- [ ] `analyze-frontend-eslintrc` - Extract frontend rules
- [ ] `analyze-backend-graphql-eslint` - Document GraphQL backend needs
- [ ] `analyze-backend-express-eslint` - Document Express backend needs

### Phase 2: Configuration Creation
- [ ] `create-root-eslint-config-js` - Create root flat config
- [ ] `create-frontend-eslint-config-js` - Create frontend flat config
- [ ] `create-backend-graphql-eslint-config-js` - Create GraphQL backend config
- [ ] `create-backend-express-eslint-config-js` - Create Express backend config

### Phase 3: Dependencies
- [ ] `install-missing-eslint-packages` - Ensure all v9 deps installed

### Phase 4: Testing
- [ ] `test-root-lint` - Verify root linting
- [ ] `test-frontend-lint` - Verify frontend linting
- [ ] `test-backend-graphql-lint` - Verify GraphQL backend linting
- [ ] `test-backend-express-lint` - Verify Express backend linting
- [ ] `test-full-monorepo-lint` - Verify full `pnpm lint`

### Phase 5: Documentation & Cleanup
- [ ] `document-migration-notes` - Update development guide
- [ ] `remove-old-eslintrc-files` - Delete deprecated configs

---

## Rollback Plan

If migration fails or introduces unacceptable regressions:

1. **Restore old files**: `git restore .eslintrc.json frontend/.eslintrc.json`
2. **Remove new files**: `rm eslint.config.js frontend/eslint.config.js backend-graphql/eslint.config.js backend-express/eslint.config.js`
3. **Revert package.json**: `git restore package.json`
4. **Reinstall**: `pnpm install`
5. **Verify**: `pnpm lint` should use old `.eslintrc.json` files again

---

## Useful Resources

- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [ESLint Flat Config Format](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [@typescript-eslint v9 Compatibility](https://typescript-eslint.io/getting-started)
- [Next.js ESLint Plugin](https://nextjs.org/docs/app/building-your-application/configuring/eslint)

---

**Created**: 2026-04-16
**Status**: Ready for Implementation
**Owner**: Orchestrator Agent
