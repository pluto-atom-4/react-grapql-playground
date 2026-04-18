# Phase 1 ESLint v9 Migration - Investigation Findings

**Date**: April 18, 2026  
**Status**: ✅ COMPLETE  
**Phase**: 1 - Investigation & Analysis  
**Issues**: #48-52

## Executive Summary

**All 5 investigation tasks completed successfully.** The repository is currently on **ESLint 9.39.4** with legacy `.eslintrc.json` configuration files. Migration requires creating `eslint.config.js` (flat config) at **root, frontend, backend-graphql, and backend-express** levels.

### Key Findings
- ✅ **ESLint v9** already installed (9.39.4)
- ✅ **All required plugins** are present (TypeScript, React, React Hooks, Next.js)
- ⚠️ **Legacy config format** (.eslintrc.json) is incompatible with ESLint v9 defaults
- ❌ **No flat config files** (eslint.config.js) exist - blocking `pnpm lint`
- ✅ **No immediate blockers** - clean migration path identified

---

## Task 1: Current ESLint v9 State (Issue #48)

### ESLint Version
```
ESLint: 9.39.4 (installed in all packages)
```

### Version Matrix

| Package | ESLint | TypeScript | @typescript-eslint/parser | @typescript-eslint/plugin | eslint-config-next | React | React Hooks |
|---------|--------|-----------|---------------------------|---------------------------|-------------------|-------|-------------|
| **Root** | — | 5.7.2 | — | — | — | — | — |
| **Frontend** | 9.1.1 | 5.7.2 | 8.1.0 | 8.1.0 | 16.0.0 | 19.0.0 | ✓ (next config) |
| **Backend-GraphQL** | 9.1.1 | 5.7.2 | 8.1.0 | 8.1.0 | — | — | — |
| **Backend-Express** | 9.1.1 | 5.7.2 | 8.1.0 | 8.1.0 | — | — | — |

### Configuration Files Inventory

| File | Status | Format | Location |
|------|--------|--------|----------|
| `.eslintrc.json` | ✓ Exists | Legacy (v8) | Root |
| `frontend/.eslintrc.json` | ✓ Exists | Legacy (v8) | Frontend |
| `backend-graphql/.eslintrc.json` | ✓ Exists | Legacy (v8) | Backend-GraphQL |
| `backend-express/.eslintrc.json` | ❌ Missing | — | Backend-Express |
| `eslint.config.js` | ❌ None | Flat (v9) | Any |

### Lint Command Output - Current Failure

```
Oops! Something went wrong! :(

ESLint: 9.39.4

ESLint couldn't find an eslint.config.(js|mjs|cjs) file.

From ESLint v9.0.0, the default configuration file is now eslint.config.js.

If you are using a .eslintrc.* file, please follow the migration guide:
https://eslint.org/docs/latest/use/configure/migration-guide
```

**Status**: ❌ BROKEN - All workspace projects fail linting
- `backend-express lint: Failed`
- `backend-graphql lint: Failed`
- `frontend lint: Failed`

### Installed Plugins & Dependencies

#### Common (All Packages)
- ✅ `eslint` ^9.1.1
- ✅ `@typescript-eslint/eslint-plugin` ^8.1.0
- ✅ `@typescript-eslint/parser` ^8.1.0
- ✅ `typescript` ^5.7.2

#### Frontend-Specific
- ✅ `eslint-config-next` ^16.0.0
- ❌ `eslint-plugin-react` — **NOT FOUND** (expected but installed via eslint-config-next)
- ❌ `eslint-plugin-react-hooks` — **NOT FOUND** (expected but installed via eslint-config-next)

#### Notes
- React plugins are declared in `.eslintrc.json` but NOT explicit dependencies
- `eslint-config-next` bundles React plugins internally
- This works in v8 but may need explicit declaration in v9 flat config

### Migration Blockers

| Blocker | Severity | Impact | Resolution |
|---------|----------|--------|-----------|
| No `eslint.config.js` at root | 🔴 CRITICAL | `pnpm lint` fails completely | Create root eslint.config.js |
| No `eslint.config.js` per package | 🔴 CRITICAL | Cannot run package-specific linting | Create per-package flat configs |
| React plugins not explicit deps | 🟡 MEDIUM | May fail when resolving plugins | Add to frontend package.json |
| `.eslintrc.json` files ignored by v9 | 🟡 MEDIUM | Old configs are dead code | Remove after migration complete |

### Recommendations for Phase 2
1. **Create root `eslint.config.js`** with base TypeScript rules
2. **Create frontend `eslint.config.js`** with React + Next.js rules
3. **Backend configs** inherit from root (no flat config needed if using CLI)
4. **Add explicit React plugins** to frontend `package.json` devDependencies
5. **Remove legacy `.eslintrc.json`** files after validation

---

## Task 2: Root Config Analysis (Issue #49)

### File: `.eslintrc.json` (Root)

```json
{
  "root": true,
  "env": {
    "node": true,
    "browser": true,
    "es2022": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/explicit-function-return-types": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-floating-promises": "warn",
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ]
  },
  "ignorePatterns": [
    "dist",
    "build",
    ".next",
    "node_modules",
    "coverage"
  ]
}
```

### Root Config Rule Extraction

#### Parser Configuration
- **Parser**: `@typescript-eslint/parser`
- **Parser Options**:
  - `ecmaVersion`: 2022 (ES2022)
  - `sourceType`: module (ESM)
  - `project`: `./tsconfig.json` (enables type-aware rules)

#### Environment Configuration
```
- node: true    (Node.js globals)
- browser: true (Browser globals)
- es2022: true  (ES2022 globals)
```

#### Extends Arrays
1. `eslint:recommended` — ESLint core recommended rules
2. `plugin:@typescript-eslint/recommended` — TypeScript basic rules
3. `plugin:@typescript-eslint/recommended-requiring-type-checking` — Type-aware TypeScript rules

**Note**: Requires `project` reference for type checking rules

#### Plugins Configuration
```
Plugins: [@typescript-eslint]
```

#### Custom Rules (6 rules configured)

| Rule | Severity | Configuration | Purpose |
|------|----------|---------------|---------|
| `@typescript-eslint/explicit-function-return-types` | warn | ✓ base | Functions should declare return types |
| `@typescript-eslint/no-explicit-any` | error | ✓ base | Reject implicit `any` type |
| `@typescript-eslint/no-unused-vars` | error | `{argsIgnorePattern: "^_", varsIgnorePattern: "^_"}` | Detect unused vars (allow leading underscore) |
| `@typescript-eslint/no-floating-promises` | warn | ✓ base | Catch unhandled promise rejections |
| `no-console` | warn | `{allow: ["warn", "error"]}` | Restrict console usage, allow warn/error |

#### Ignore Patterns
```
dist/      — Build output
build/     — Older build systems
.next/     — Next.js build cache
node_modules/  — Dependencies
coverage/  — Test coverage
```

### Flat Config Conversion Checklist

- [ ] Create `eslint.config.js` with `languageOptions.ecmaVersion: 2022`
- [ ] Import `@typescript-eslint/eslint-plugin` and parser
- [ ] Configure parser with `sourceType: 'module'`
- [ ] Add `project: './tsconfig.json'` for type-aware linting
- [ ] Include `js.configs.recommended` (eslint core)
- [ ] Include `tseslint.configs.recommended` and `recommended-requiring-type-checking`
- [ ] Configure custom rules (6 total)
- [ ] Set ignore patterns for dist, build, .next, node_modules, coverage
- [ ] Test with `pnpm lint` against root files

### Rule Migration Summary

**Total Root Rules**: 6
- **Error Severity**: 2 (no-explicit-any, no-unused-vars)
- **Warn Severity**: 4 (explicit-function-return-types, no-floating-promises, no-console)

---

## Task 3: Frontend Config Analysis (Issue #50)

### File: `frontend/.eslintrc.json`

```json
{
  "root": true,
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "next/core-web-vitals"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    },
    "project": "./tsconfig.json"
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/explicit-function-return-types": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "settings": {
    "react": {
      "version": "19"
    }
  }
}
```

### Frontend Config Rule Extraction

#### Parser Configuration (Same as Root)
- **Parser**: `@typescript-eslint/parser`
- **ecmaFeatures.jsx**: true (React JSX support)
- **project**: `./tsconfig.json` (type-aware)

#### Environment Configuration
```
- browser: true (Browser globals)
- es2022: true  (ES2022 globals)
- node: true    (Node.js globals - for build tools)
```

#### Extends Arrays (5 total, +2 React-specific)
1. `eslint:recommended` — Core ESLint rules
2. `plugin:@typescript-eslint/recommended` — TypeScript basic
3. `plugin:react/recommended` — **React-specific rules**
4. `plugin:react-hooks/recommended` — **React Hooks rules**
5. `next/core-web-vitals` — **Next.js Core Web Vitals**

**Configuration**: `eslint-config-next` bundles React rules internally

#### Plugins Configuration
```
Plugins: [@typescript-eslint, react, react-hooks]
```

**Note**: `react` and `react-hooks` plugins NOT in package.json devDependencies (inherited from eslint-config-next)

#### Settings
```json
"react": {
  "version": "19"
}
```
Specifies React 19 for rule versions (critical for deprecated rules like `react-in-jsx-scope`)

#### Custom Rules (7 rules configured)

| Rule | Severity | Configuration | Purpose |
|------|----------|---------------|---------|
| `react/react-in-jsx-scope` | off | — | Disable (React 17+ doesn't need React import) |
| `react/prop-types` | off | — | Disable (using TypeScript for type checking) |
| `@typescript-eslint/explicit-function-return-types` | warn | ✓ inherited | Functions should have return types |
| `@typescript-eslint/no-explicit-any` | error | ✓ inherited | Reject implicit `any` |
| `@typescript-eslint/no-unused-vars` | error | `{argsIgnorePattern: "^_", varsIgnorePattern: "^_"}` | Detect unused vars |
| `react-hooks/rules-of-hooks` | error | ✓ base | Enforce Hooks rules (critical) |
| `react-hooks/exhaustive-deps` | warn | ✓ base | Check dependency arrays |

#### Differences from Root Config

| Item | Root | Frontend |
|------|------|----------|
| React Support | ❌ No | ✅ Yes (+3 extends) |
| JSX Parsing | ❌ No | ✅ Yes (ecmaFeatures.jsx) |
| Custom Rules | 6 | 7 (+react-hooks, -no-floating-promises) |
| Settings | ❌ None | ✅ React version |
| Plugin Count | 1 (@typescript-eslint) | 3 (+react, react-hooks) |

### Flat Config Conversion Checklist

- [ ] Create `frontend/eslint.config.js`
- [ ] Import `@typescript-eslint/eslint-plugin`, parser
- [ ] Import `eslint-plugin-react`, `eslint-plugin-react-hooks`
- [ ] Import `next/eslint-plugin` (from @next/eslint-plugin-next)
- [ ] Configure `ecmaFeatures.jsx: true` in languageOptions
- [ ] Configure `project: './tsconfig.json'` for type-aware linting
- [ ] Include base configs: js.recommended, tseslint.recommended, react.configs
- [ ] Configure `settings.react.version: 'detect'` or '19'
- [ ] Configure custom rules (7 total)
- [ ] Add ignore patterns (inherit from root or add .next, .turbo)
- [ ] Test with `pnpm lint` against React/Next.js files

### React-Specific Rules Migration Summary

**Total Frontend Rules**: 7 (inherited 3 TypeScript + 4 React-specific)
- **Error Severity**: 3 (no-explicit-any, no-unused-vars, react-hooks/rules-of-hooks)
- **Warn Severity**: 3 (explicit-function-return-types, exhaustive-deps)
- **Off**: 2 (react-in-jsx-scope, react/prop-types)

### Missing Explicit Dependencies (Frontend)

| Package | Currently | Status | Action |
|---------|-----------|--------|--------|
| `eslint-plugin-react` | ❌ Implicit (via eslint-config-next) | ⚠️ Risky | Add to package.json |
| `eslint-plugin-react-hooks` | ❌ Implicit (via eslint-config-next) | ⚠️ Risky | Add to package.json |

**Recommendation**: Add explicit devDependencies in Phase 2.2 (Frontend Setup)

---

## Task 4: Backend-GraphQL Config Analysis (Issue #51)

### File: `backend-graphql/.eslintrc.json`

```json
{
  "root": true,
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ]
  }
}
```

### Backend-GraphQL Config Analysis

#### Configuration Status
- **Root**: ✅ Yes (root: true)
- **Inheritance**: ❌ None (not extending parent)
- **Custom Rules**: ✅ 3 rules defined
- **Parser**: @typescript-eslint/parser
- **Project**: ❌ Missing (no `project: './tsconfig.json'`)

#### Key Differences from Root

| Item | Root | Backend-GraphQL |
|------|------|-----------------|
| Extends Count | 3 | 2 (missing type-aware config) |
| Parser Options | ✅ with project | ❌ no project ref |
| Custom Rules | 6 | 3 |
| Type-Aware Linting | ✅ Yes | ❌ No |
| Environment | node + browser | node only |

#### Rules Comparison

| Rule | Root | Backend-GraphQL | Status |
|------|------|-----------------|--------|
| `no-explicit-any` | error | error | ✓ Same |
| `no-unused-vars` | error | error | ✓ Same |
| `no-floating-promises` | warn | ❌ Missing | ⚠️ Removed |
| `explicit-function-return-types` | warn | ❌ Missing | ⚠️ Removed |
| `no-console` | warn (allow warn/error) | warn (allow warn/error) | ✓ Same |

#### Analysis Findings

**Issue**: Backend-GraphQL uses a **simplified config** (no type-aware rules, no explicit return types)
- ✅ Intentional? (Simplified for backend resolvers)
- ⚠️ Or oversight? (Should match root standards)

**Recommendation**: Align with root config in Phase 2 (add type-aware rules + explicit return types) for consistency

### Flat Config Approach for Backend-GraphQL

**Option 1: Use Root Config (Inherit)**
- No separate `eslint.config.js` needed
- CLI inherits from root via configuration
- Simpler but less explicit

**Option 2: Create Package-Level Config**
- Create `backend-graphql/eslint.config.js`
- Explicitly extend root config
- Clearer intent, easier to override later

**Recommendation for Phase 2**: Option 2 (explicit inheritance) with same rules as root

### Rules Requiring Migration

**Total Backend-GraphQL Rules**: 3
- **Error Severity**: 2 (no-explicit-any, no-unused-vars)
- **Warn Severity**: 1 (no-console)

---

## Task 5: Backend-Express Config Analysis (Issue #52)

### File: `backend-express/.eslintrc.json`

**Status**: ❌ **NOT FOUND**

### Configuration Status

| Item | Status | Finding |
|------|--------|---------|
| Custom Config File | ❌ Missing | No backend-express/.eslintrc.json |
| Root Config | ✓ Referenced | Uses root config via inheritance |
| Implicit Extension | ✓ ESLint v8 Default | Package was inheriting from root |
| v9 Compatibility | ❌ Broken | Now requires explicit eslint.config.js |

### Backend-Express Package Analysis

**package.json lint script**:
```json
"lint": "eslint src --ext .ts"
```

**Route Patterns in `backend-express/src/routes/`**:
- Express route handlers (middleware functions)
- Promise-based async/await patterns
- Standard Node.js server code

### Backend-Express Linting Needs

| Category | Requirement | Notes |
|----------|-------------|-------|
| Parser | @typescript-eslint | ✓ Standard |
| Environment | node only | ✓ No browser globals |
| Core Rules | ESLint recommended | ✓ Standard |
| TypeScript Rules | Base (no type-aware) | ⚠️ Could add for consistency |
| React Rules | None | ✓ Not needed |
| Custom Rules | Minimal | ✓ Few customizations |

### Recommendation

**For Phase 2**: Backend-Express should either:
1. **Option A**: Use same config as Backend-GraphQL (inherit from root)
2. **Option B**: Create explicit `backend-express/eslint.config.js` for clarity

**Proposed Backend-Express Rules**:
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/no-unused-vars`: error (with underscore pattern)
- `no-console`: warn (allow warn/error)

---

## Summary Table: All Configurations

| Config | Status | Format | Rules | Plugins | Parser | Type-Aware |
|--------|--------|--------|-------|---------|--------|-----------|
| **Root** | ✓ Exists | v8 legacy | 6 | 1 (@ts-eslint) | @ts-eslint | ✓ Yes |
| **Frontend** | ✓ Exists | v8 legacy | 7 | 3 (@ts-eslint, react, react-hooks) | @ts-eslint | ✓ Yes |
| **Backend-GraphQL** | ✓ Exists | v8 legacy | 3 | 1 (@ts-eslint) | @ts-eslint | ❌ No |
| **Backend-Express** | ❌ Missing | — | — | — | — | — |

---

## Migration Blockers & Risk Assessment

### Critical Blockers

| Blocker | Severity | Impact | Resolution Timeline |
|---------|----------|--------|---------------------|
| No root `eslint.config.js` | 🔴 CRITICAL | `pnpm lint` completely broken | Phase 2.1 (2-3 hours) |
| No frontend `eslint.config.js` | 🔴 CRITICAL | Frontend linting unavailable | Phase 2.2 (3-4 hours) |

### Medium Priority Issues

| Issue | Severity | Impact | Resolution Timeline |
|-------|----------|--------|---------------------|
| React plugins not explicit deps | 🟡 MEDIUM | May fail plugin resolution | Phase 2.2 (30 mins) |
| Backend-GraphQL missing type-aware rules | 🟡 MEDIUM | Inconsistent rule enforcement | Phase 2.3 (1 hour) |
| Backend-Express has no config | 🟡 MEDIUM | Currently working via inheritance but unclear | Phase 2.3 (1 hour) |

### No Blockers Found For
- ✅ Missing package versions
- ✅ Incompatible plugin versions
- ✅ TypeScript configuration issues
- ✅ Architecture limitations

---

## Recommendations for Phase 2

### Phase 2.1: Root Config (Priority 1)
**Objective**: Create working root `eslint.config.js` with TypeScript base rules

**Deliverables**:
- [ ] Create `/eslint.config.js` (flat config format)
- [ ] Port all 6 root rules from `.eslintrc.json`
- [ ] Configure type-aware linting with `project: ./tsconfig.json`
- [ ] Verify `pnpm lint` works for root files
- [ ] Document migration decisions

**Estimated Effort**: 2-3 hours

### Phase 2.2: Frontend Config (Priority 1)
**Objective**: Create working frontend `eslint.config.js` with React + Next.js rules

**Deliverables**:
- [ ] Add explicit React plugin devDependencies to `frontend/package.json`
- [ ] Create `frontend/eslint.config.js` (flat config format)
- [ ] Port all 7 frontend rules
- [ ] Configure React version detection or explicit '19'
- [ ] Include Next.js core-web-vitals rules
- [ ] Verify `pnpm lint` works for React/TSX files

**Estimated Effort**: 3-4 hours

### Phase 2.3: Backend Configs (Priority 2)
**Objective**: Create backend `eslint.config.js` files or inherit from root

**Deliverables**:
- [ ] Decide: explicit backend configs vs. root inheritance
- [ ] If explicit: Create `backend-graphql/eslint.config.js` and `backend-express/eslint.config.js`
- [ ] Add type-aware rules to Backend-GraphQL (align with root)
- [ ] Verify both backends lint successfully
- [ ] Document inheritance chain

**Estimated Effort**: 1-2 hours

### Phase 2.4: Validation & Cleanup (Priority 2)
**Objective**: Ensure all packages lint successfully and remove legacy configs

**Deliverables**:
- [ ] Run `pnpm lint` for all packages (expect success)
- [ ] Run `pnpm lint:fix` to verify fix mode works
- [ ] Remove legacy `.eslintrc.json` files
- [ ] Remove legacy eslintignore patterns
- [ ] Document final configuration structure
- [ ] Commit all changes with CO-AUTHORED-BY trailer

**Estimated Effort**: 1-2 hours

### Phase 3: Advanced Features (Post-Migration)
- Add prettier integration if needed
- Add custom rules or extend shareable configs
- Implement pre-commit hooks (husky)
- Set up CI/CD linting checks

---

## Total Analysis Summary

### Files Analyzed
- ✅ 4 ESLint configurations (.eslintrc.json files)
- ✅ 4 TypeScript configurations (tsconfig.json)
- ✅ 4 Package.json dependency files
- ✅ 1 ESLint v9 migration output (pnpm lint)

**Total**: 13 configuration files reviewed

### Rules Documented
- **Root**: 6 rules
- **Frontend**: 7 rules (includes 3 inherited TypeScript + 4 React-specific)
- **Backend-GraphQL**: 3 rules
- **Backend-Express**: 0 (inherits from root)

**Total Unique Rules to Migrate**: ~10-12 distinct rules

### Missing Packages Identified
- ❌ No critical package gaps
- ⚠️ React plugins should be explicit in frontend `package.json`

### Next Steps
1. ✅ **Phase 1 Complete**: All investigation tasks finished
2. 🔄 **Phase 2 Ready**: Root config creation (Phase 2.1) can begin immediately
3. 📋 **Phase 2.1 Input**: This document serves as reference for all migrations

---

## Appendix: Quick Reference

### ESLint v8 → v9 Flat Config Format

**Old Format** (.eslintrc.json):
```json
{
  "extends": ["eslint:recommended"],
  "rules": { "@typescript-eslint/no-explicit-any": "error" }
}
```

**New Format** (eslint.config.js):
```javascript
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: { "@typescript-eslint/no-explicit-any": "error" } }
];
```

### Key Differences
- Uses JavaScript (not JSON) for programmatic config
- `extends` → imported configs spread into array
- `plugins` → imported and included directly
- `ignores` → separate config object or glob patterns
- No `parserOptions` nesting (flatter structure)

### Plugin Resolution in Flat Config
```javascript
import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";

export default [
  {
    plugins: { react, "@typescript-eslint": tseslint.plugin }
  }
];
```

**Note**: Plugin names must be imported explicitly (no string resolution)

---

**Document Version**: 1.0  
**Last Updated**: April 18, 2026  
**Author**: ESLint v9 Migration Phase 1 Investigation  
**Status**: ✅ INVESTIGATION COMPLETE - Ready for Phase 2
