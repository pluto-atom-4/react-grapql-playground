# Test Fixtures

## Overview

This directory contains test fixtures for the Express backend tests. Fixtures can be either **static files** (checked into version control) or **dynamically generated** (created on-demand during test setup).

## Generated Fixtures

### large-file.bin

- **Purpose**: Test file upload size limit validation (>50MB)
- **Size**: 55MB (dynamically generated)
- **MIME Type**: Binary data
- **Generated**: Automatically in `beforeAll` hook of upload tests
- **Cleaned**: Automatically in `afterAll` hook
- **Why Dynamic?** Storing 55MB binary files in the repository wastes space and slows clones. Generating on-demand keeps the repo clean and the fixture fresh for each test run.

### Size Limit Testing

The upload route enforces a 50MB file size limit via Multer:

```typescript
limits: {
  fileSize: 50 * 1024 * 1024, // 50MB
}
```

The `large-file.bin` fixture (55MB) is used to verify that files exceeding this limit are properly rejected with a 413 Payload Too Large response.

## Usage

Fixtures are managed through the **`generate-fixtures.ts`** module:

```typescript
import {
  generateBinaryFile,
  cleanupFixtures,
  getFixturePath,
  fixtureExists,
  getFixtureSize,
} from './generate-fixtures';

// In your test file - generate fixture inline
it('should test file size limits', async () => {
  // Generate fixture
  const filePath = await generateBinaryFile('large-file.zip', 55);

  try {
    // Use the fixture
    const res = await request(app).post('/upload').attach('file', filePath);
    expect(res.status).toBe(413);
  } finally {
    // Clean up after test
    await cleanupFixtures(['large-file.zip']);
  }
});
```

Alternatively, for setup/teardown at suite level:

```typescript
describe('Upload Tests', () => {
  beforeAll(async () => {
    // Generate fixture before all tests
    await generateBinaryFile('large-file.zip', 55);
  });

  afterAll(async () => {
    // Clean up after tests
    await cleanupFixtures(['large-file.zip']);
  });

  it('should reject files > 50MB', async () => {
    const filePath = getFixturePath('large-file.zip');
    // ... test code
  });
});
```

## Fixture Functions

### `generateBinaryFile(filename: string, sizeInMB: number): Promise<string>`

Generates a binary file with random data.

- **Parameters**:
  - `filename`: Name to save the file as
  - `sizeInMB`: Size in megabytes
- **Returns**: Promise resolving to the full file path
- **Implementation**: Uses Node.js streams to avoid loading entire file in memory

**Example**:

```typescript
const filePath = await generateBinaryFile('large-file.bin', 55);
// Creates: backend-express/__tests__/fixtures/large-file.bin (55MB)
```

### `cleanupFixtures(filenames: string[]): Promise<void>`

Removes generated fixture files.

- **Parameters**:
  - `filenames`: Array of filenames to delete
- **Returns**: Promise that resolves when cleanup is complete
- **Behavior**: Silently ignores missing files (idempotent)

**Example**:

```typescript
await cleanupFixtures(['large-file.bin', 'test-archive.zip']);
```

### `getFixturePath(filename: string): string`

Returns the full path to a fixture file (doesn't check existence).

**Example**:

```typescript
const path = getFixturePath('large-file.bin');
// Returns: /full/path/to/backend-express/__tests__/fixtures/large-file.bin
```

### `fixtureExists(filename: string): boolean`

Checks if a fixture file exists.

**Example**:

```typescript
if (fixtureExists('large-file.bin')) {
  console.log('Fixture already exists');
}
```

### `getFixtureSize(filename: string): number`

Returns the size of a fixture file in bytes (0 if not found).

**Example**:

```typescript
const sizeInBytes = getFixtureSize('large-file.bin');
const sizeInMB = sizeInBytes / (1024 * 1024);
```

## File Organization

```
backend-express/__tests__/
├── fixtures/
│   ├── generate-fixtures.ts     ← Fixture generator module
│   ├── README.md                ← This file
│   └── large-file.bin           ← GENERATED (55MB, not in git)
├── upload.test.ts               ← Tests using generated fixtures
├── events.test.ts
└── middleware.test.ts
```

## .gitignore Configuration

Generated fixtures are excluded from version control:

```gitignore
# Generated fixture files
backend-express/__tests__/fixtures/large-file.bin
**/__tests__/fixtures/*.bin
```

## Performance Considerations

### File Generation Time

Generating a 55MB file takes approximately:

- **Local SSD**: 0.5-1 second
- **Local HDD**: 2-5 seconds
- **CI/CD environment**: Variable (depends on disk I/O)

The fixture is generated once per test suite (`beforeAll`), not per test.

### Memory Usage

The fixture generator uses **streaming I/O** to avoid loading the entire 55MB file into memory. Memory overhead is approximately **1MB per concurrent write operation** (the chunk buffer size).

### Test Performance Impact

- **First run**: ~1 second for fixture generation
- **Subsequent runs**: Same (fixture is regenerated fresh each time)
- **Cleanup**: <100ms for file deletion

## Adding New Generated Fixtures

To add a new dynamically generated fixture:

1. **Create the fixture in `beforeAll`**:

   ```typescript
   beforeAll(async () => {
     await generateBinaryFile('my-fixture.bin', 100);
   });
   ```

2. **Clean it up in `afterAll`**:

   ```typescript
   afterAll(async () => {
     await cleanupFixtures(['my-fixture.bin']);
   });
   ```

3. **Use in test**:

   ```typescript
   const filePath = getFixturePath('my-fixture.bin');
   // Use filePath in test
   ```

4. **Document in `.gitignore`** if needed (not required, already covered by wildcard `*.bin`)

## Static Fixtures

For small files (< 1MB), you can commit them directly to the repository:

- **Text files**: JSON, XML, CSV, logs
- **Binary files**: PNG, JPEG, PDF (if small)
- **Archives**: Small ZIPs or TARs

These don't require the generator—just add them to the fixtures directory and use them directly:

```typescript
const filePath = path.join(__dirname, 'fixtures', 'config.json');
```

## Troubleshooting

### File Generation Hangs

If fixture generation appears to hang:

1. Check available disk space
2. Verify the fixtures directory is writable
3. Monitor system I/O performance
4. Try a smaller size (e.g., 10MB instead of 55MB)

### Cleanup Fails

If cleanup doesn't work:

1. Check file permissions
2. Verify the file isn't open in another process
3. Look for permission errors in test output
4. The cleanup is idempotent—retrying is safe

### Fixture File Persists After Tests

This can happen if:

1. Test crashes before `afterAll` runs—manually delete the file
2. Test runner doesn't execute `afterAll` hooks—check test configuration
3. File has permission issues—adjust permissions and retry

### Out of Disk Space

If generating 55MB fixtures causes disk space issues:

1. Check available disk space: `df -h`
2. Clean up other test artifacts: `rm -rf node_modules/__tests__/artifacts`
3. Reduce fixture size for testing: Use 10MB instead of 55MB
4. Use a test environment with more disk space (CI/CD configuration)

## Related Files

- **Upload Tests**: `backend-express/__tests__/upload.test.ts`
- **Upload Route**: `backend-express/src/routes/upload.ts`
- **Git Ignore**: `../.gitignore` (root project)
- **Multer Config**: Defined in `backend-express/src/routes/upload.ts` (50MB limit)
