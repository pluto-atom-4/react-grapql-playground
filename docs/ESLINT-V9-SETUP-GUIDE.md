# ESLint v9 Setup Guide: Practical How-To

## Quick Start

### Running ESLint

```bash
# Lint all packages in the monorepo
pnpm lint

# Lint specific package
pnpm -F frontend lint
pnpm -F backend-graphql lint
pnpm -F backend-express lint

# Get detailed output with line numbers
eslint . --ext .ts,.tsx -f json > lint-report.json
```

### Expected Output (All Clean)

```
$ pnpm lint

> react-grapql-playground@0.1.0 lint
> pnpm -r run lint

Scope: 3 of 4 workspace projects
backend-express lint$ eslint src --ext .ts
backend-graphql lint$ eslint src --ext .ts
frontend lint$ eslint . --ext .ts,.tsx
backend-graphql lint: Done ✅
backend-express lint: Done ✅
frontend lint: Done ✅
```

If you see this output with no errors or warnings, ESLint is working correctly.

---

## Understanding ESLint v9 Configuration

### The Flat Config Format

ESLint v9 uses a flat config format defined in `eslint.config.js` at the repository root. This is fundamentally different from the legacy `.eslintrc.js` format.

**Key Differences**:

| Aspect | ESLint v8 | ESLint v9 |
|--------|-----------|-----------|
| Format | `module.exports = { ... }` | `export default [ ... ]` |
| Structure | Object with extends | Array of config objects |
| Plugins | String names | Direct imports |
| Rules | Merged via extends | Explicit spread operator |
| File Matching | Global extends | Explicit files array |

### Anatomy of eslint.config.js

The configuration has 3 main sections:

#### Section 1: Ignore Patterns

```javascript
{
  ignores: ['dist', 'build', '.next', 'node_modules', 'coverage'],
}
```

**Purpose**: Files/directories to skip during linting

**When to Update**: Add new build output directories here (e.g., `.tsbuildinfo`, `out/`)

---

#### Section 2: Language Options & Plugins

```javascript
{
  files: ['**/*.{ts,tsx,js,jsx}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      projectService: true,
      ecmaFeatures: { jsx: true },
    },
    globals: {
      // Node.js globals
      __dirname: 'readonly',
      process: 'readonly',
      // Browser globals
      window: 'readonly',
      document: 'readonly',
      // ... more globals
    },
  },
  plugins: {
    '@typescript-eslint': tsPlugin,
    // ... more plugins
  },
}
```

**Purpose**: Configures how ESLint parses and understands TypeScript/JSX

**Key Options**:
- `parser`: Uses TypeScript parser for `.ts` and `.tsx` files
- `projectService: true`: Enables full TypeScript project analysis (slower but more accurate)
- `globals`: Defines available global variables by environment
- `plugins`: Loads ESLint rule extensions

---

#### Section 3: Rules

```javascript
{
  rules: {
    ...js.configs.recommended.rules,
    ...tsPlugin.configs.recommended.rules,
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
```

**Purpose**: Defines which rules are enforced and at what level

**Rule Levels**:
- `off` (0): Rule is disabled
- `warn` (1): Warning (doesn't fail the build)
- `error` (2): Error (fails the build/PR check)

---

## How to Add New Rules

### Step 1: Identify the Rule

Find rules from these sources:
- **Core ESLint**: https://eslint.org/docs/rules/
- **TypeScript ESLint**: https://typescript-eslint.io/rules/
- **React ESLint**: https://github.com/jsx-eslint/eslint-plugin-react#list-of-supported-rules
- **React Hooks**: https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks

### Step 2: Test the Rule Locally

```javascript
// Update eslint.config.js
rules: {
  // ... existing rules
  'new-rule-name': 'warn', // Test at warn level first
}
```

Run ESLint to see what fails:
```bash
pnpm lint
```

### Step 3: Review Violations

Understand what the rule is catching:
```bash
# Get detailed output
eslint . --ext .ts,.tsx --format json > report.json

# Or use VS Code ESLint extension to see violations inline
```

### Step 4: Fix Violations or Adjust Rule

**Option A**: Fix all code violations
```bash
# Auto-fix if the rule supports it
eslint . --fix
```

**Option B**: Adjust the rule severity
```javascript
// Use warn instead of error to allow violations
'new-rule-name': 'warn',

// Or turn it off
'new-rule-name': 'off',
```

### Step 5: Document and Commit

Update `CONTRIBUTING.md` with the new rule:
```markdown
### ESLint Rules

- `new-rule-name`: Enforces [description]
  - Severity: warn/error
  - Why: [reasoning]
```

Commit with clear message:
```bash
git add eslint.config.js CONTRIBUTING.md
git commit -m "feat(eslint): add new-rule-name rule for [reason]"
```

---

## How to Update Configurations

### Updating ESLint Version

```bash
# Check current version
npm info eslint versions | tail -10

# Update to latest
pnpm update eslint@latest

# Update related packages
pnpm update @typescript-eslint/parser@latest @typescript-eslint/eslint-plugin@latest

# Verify no regressions
pnpm lint
pnpm test
```

### Adding a New Plugin

Example: Adding `eslint-plugin-prettier` for Prettier integration

```bash
# Step 1: Install the plugin
pnpm add -D eslint-plugin-prettier

# Step 2: Update eslint.config.js
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  // ... existing configs
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin, // Add new plugin
    },
    rules: {
      // ... existing rules
      'prettier/prettier': 'warn', // Add rule from new plugin
    },
  },
];

# Step 3: Test
pnpm lint

# Step 4: Commit
git add package.json pnpm-lock.yaml eslint.config.js
git commit -m "feat(eslint): add prettier plugin integration"
```

### Changing Rule Severity

Sometimes you want to make warnings into errors or vice versa:

```javascript
// Before: Warn developers about console usage
'no-console': ['warn', { allow: ['warn', 'error'] }],

// After: Strictly forbid all console usage
'no-console': 'error',

// Or: Disable completely for legacy code
'no-console': 'off',
```

Then test:
```bash
pnpm lint

# If violations appear, either fix them or adjust the rule again
```

---

## Troubleshooting Common Issues

### Issue 1: "ESLint: Unresolved Configuration"

**Error**: `Error: Could not find configuration files in the current working directory`

**Cause**: ESLint can't find `eslint.config.js` or it has a syntax error

**Solution**:
```bash
# Verify eslint.config.js exists at repo root
ls -la eslint.config.js

# Check for syntax errors
node -c eslint.config.js  # Validates JavaScript syntax

# If file was deleted, restore from git
git checkout eslint.config.js
```

---

### Issue 2: "Could not load parser"

**Error**: `Error: Could not find module '@typescript-eslint/parser'`

**Cause**: Dependencies not installed or node_modules corrupted

**Solution**:
```bash
# Reinstall dependencies
pnpm install

# Or if that doesn't work, clean and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

### Issue 3: TypeScript Compilation Errors in ESLint

**Error**: `error TS7001: 'arguments' implicitly has type 'any'`

**Cause**: TypeScript strict mode enabled with `projectService: true` but types are incorrect

**Solution**:
```bash
# Option 1: Add explicit return types (preferred)
async function myFunction(): Promise<string> {
  return 'value';
}

# Option 2: Disable projectService for faster linting (not recommended)
// In eslint.config.js
projectService: false,  // Trades accuracy for speed
```

---

### Issue 4: ESLint Too Slow

**Problem**: `pnpm lint` takes more than 30 seconds

**Cause**: `projectService: true` analyzes the entire TypeScript project for each lint run

**Solutions**:

```javascript
// Option 1: Disable projectService (trade accuracy for speed)
projectService: false,

// Option 2: Use incremental analysis (faster subsequent runs)
// No change needed - ESLint caches automatically

// Option 3: Lint only changed files
eslint src/my-changed-file.ts  // Single file
```

---

### Issue 5: Rule Conflicts

**Error**: Multiple rules triggering for the same code

**Example**: `@typescript-eslint/explicit-function-return-type` conflicts with function inference

**Solution**:
```javascript
// Disable one rule in favor of another
rules: {
  // Use explicit return types (more flexible)
  '@typescript-eslint/explicit-function-return-type': 'warn',
  
  // Override inference-based rule
  '@typescript-eslint/no-implicit-any': 'off',
}
```

---

### Issue 6: Import Order Issues

**Problem**: ESLint v9 removed import sorting (no built-in plugin)

**Solution**: Use a dedicated import sorter

```bash
# Option 1: Use simple-import-sort (lightweight)
pnpm add -D simple-import-sort eslint-plugin-simple-import-sort

# Option 2: Use eslint-plugin-import (full-featured)
pnpm add -D eslint-plugin-import

# Then add to eslint.config.js
import simpleSort from 'simple-import-sort';

export default [
  // ... existing config
  {
    plugins: {
      'simple-import-sort': simpleSort,
    },
    rules: {
      'simple-import-sort/imports': 'warn',
    },
  },
];
```

---

## Performance Tips

### 1. Use Ignore Patterns Wisely

```javascript
// Good: Excludes large directories
ignores: [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'coverage/**',
]

// Avoid: Overly specific patterns
ignores: [
  'src/**/*.test.ts',  // Too narrow - might miss issues
]
```

### 2. Lint Only Changed Files

```bash
# During development, lint only your changes
eslint src/my-file.ts

# ESLint will still load the full config but analyzes one file
# Result: Much faster feedback
```

### 3. Disable projectService for Large Projects

If your monorepo has hundreds of files and linting takes >60 seconds:

```javascript
projectService: false,  // Trades type accuracy for speed
```

**Trade-off**: Less accurate type checking, but 10x faster.

---

### 4. Use --cache Flag (If Supported)

```bash
# Some ESLint versions support --cache
eslint . --cache

# Subsequent runs use cached results
# Much faster on large projects
```

---

### 5. Parallel Linting (Alternative)

If default linting is still too slow, use a parallel runner:

```bash
# Install parallel runner
pnpm add -D eslint-formatter-pretty

# Run with parallel flag (if ESLint version supports)
eslint . --ext .ts,.tsx --format json | parallel-process
```

---

## Setting Up IDE Integration

### VS Code Setup

**Step 1**: Install ESLint Extension
- Go to Extensions (Cmd+Shift+X)
- Search for "ESLint"
- Install by Microsoft

**Step 2**: Configure VS Code Settings

Create `.vscode/settings.json` in the repository root:

```json
{
  "eslint.enable": true,
  "eslint.format.enable": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true,
      "source.formatDocument": true
    }
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
}
```

**Step 3**: Reload VS Code
- Press Cmd+Shift+P
- Type "Reload Window"
- Press Enter

**Result**: ESLint violations will be highlighted in red, and fixes will apply on save.

---

### JetBrains IDEs (IntelliJ, WebStorm)

**Step 1**: Enable ESLint in Settings

- Go to Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
- Check "Enable ESLint"
- Select "Automatic ESLint Configuration"

**Step 2**: Enable Auto-Fix on Save

- Go to Settings → Editor → Inspections
- Search for "ESLint"
- Check "Run eslint --fix on Save"

**Result**: ESLint violations highlighted, auto-fixes on save.

---

## Disabling Rules for Specific Code

### Disable for a Single Line

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = JSON.parse(unknownString);
```

### Disable for a Block

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */

const obj: any = {};
const arr: any[] = [];
const value: any = getValue();

/* eslint-enable @typescript-eslint/no-explicit-any */
```

### Disable for a File

```typescript
/* eslint-disable */
// This file is auto-generated by graphql-codegen
// All ESLint rules are disabled

export const AutoGeneratedTypes = { ... };
```

---

### Best Practices for Disabling Rules

**✅ DO**: Document why you're disabling
```typescript
// This external library returns `any` by design
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = require('external-config-loader');
```

**❌ DON'T**: Disable without explanation
```typescript
// eslint-disable-next-line
const data: any = something;  // Why? No one knows.
```

**✅ DO**: Disable specific rules
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = JSON.parse(str);
```

**❌ DON'T**: Disable all rules
```typescript
// eslint-disable
const data: any = JSON.parse(str);  // Disables ALL rules, not just one
```

---

## Running ESLint in CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/lint.yml

name: ESLint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run ESLint
        run: pnpm lint
        
      - name: Run Tests
        run: pnpm test
```

**Result**: Every PR gets linted automatically. Failed linting blocks merge.

---

## Migration from ESLint v8

If you're migrating from an old ESLint v8 configuration:

### Step 1: Backup Old Config
```bash
cp .eslintrc.js .eslintrc.js.backup
```

### Step 2: Create New Flat Config
```bash
# The repo already has eslint.config.js in place
# Review it to understand the new format
cat eslint.config.js
```

### Step 3: Update Package.json
```json
{
  "devDependencies": {
    "eslint": "^9.39.4",  // Updated version
    "@typescript-eslint/parser": "^8.58.2",
    "@typescript-eslint/eslint-plugin": "^8.58.2",
    "@eslint/js": "^9.39.4"  // New package
  }
}
```

### Step 4: Test

```bash
pnpm install
pnpm lint

# If issues appear, fix them using the guides above
```

### Step 5: Remove Old Config

```bash
rm .eslintrc.js  # Delete legacy config after verifying new one works
```

---

## FAQ: Common Questions

### Q: Can I have multiple eslint.config.js files?

**A**: No. ESLint v9 only reads `eslint.config.js` at the repo root. However, you can use the `files` array to apply different rules to different files:

```javascript
export default [
  {
    files: ['frontend/**/*.{ts,tsx}'],
    rules: { /* frontend-specific rules */ }
  },
  {
    files: ['backend-graphql/**/*.ts'],
    rules: { /* graphql-specific rules */ }
  },
];
```

---

### Q: How do I disable ESLint for a whole directory?

**A**: Add to the `ignores` array:

```javascript
ignores: [
  'dist/**',
  'coverage/**',
  'temp/**',  // Add your directory
]
```

---

### Q: Can I use ESLint to fix issues automatically?

**A**: Some rules support auto-fix. Try:

```bash
eslint . --fix  # Auto-fixes all auto-fixable issues
```

**Note**: Not all rules can be auto-fixed. ESLint will report which issues were fixed.

---

### Q: What's the difference between `warn` and `error`?

**A**: 
- `warn` (yellow): Reported, but doesn't fail the build
- `error` (red): Reported AND fails the build

In CI/CD, both might fail the build depending on your configuration. Locally:
- `warn`: VS Code shows yellow squiggles
- `error`: VS Code shows red squiggles

---

### Q: How do I know which rules exist?

**A**: ESLint provides comprehensive documentation:

```bash
# List all available rules
eslint --print-config eslint.config.js

# Or visit online documentation:
# https://eslint.org/docs/rules/
# https://typescript-eslint.io/rules/
# https://github.com/jsx-eslint/eslint-plugin-react#list-of-supported-rules
```

---

## Additional Resources

- **ESLint v9 Documentation**: https://eslint.org/docs/latest/
- **ESLint Migration Guide**: https://eslint.org/docs/latest/use/migrate-to-9.0.0
- **TypeScript ESLint**: https://typescript-eslint.io/
- **ESLint Plugin React**: https://github.com/jsx-eslint/eslint-plugin-react
- **Flat Config Format**: https://eslint.org/docs/latest/use/configure/configuration-files-new

---

## Support

For issues with ESLint v9 in this repository:

1. Check the troubleshooting section above
2. Review the main migration report: `docs/session-report/ESLINT-V9-MIGRATION-COMPLETE.md`
3. Check existing GitHub issues
4. Consult ESLint documentation (see links above)

---

**Last Updated**: April 18, 2026  
**Status**: ✅ Complete and Verified  
**All Packages**: 0 ESLint issues
