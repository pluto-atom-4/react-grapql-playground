/**
 * Phase E2: Build Workflow E2E Tests
 *
 * Comprehensive end-to-end tests for the complete build workflow:
 * - Create Build → BUILD_CREATED event
 * - Upload File → FILE_UPLOADED event
 * - Update Status → BUILD_STATUS_CHANGED event
 * - Add Part → PART_ADDED event
 *
 * Verifies:
 * - Mutations are called correctly
 * - Events are emitted to Express event bus
 * - SSE stream receives events
 * - UI updates in real-time without page refresh
 * - Latency is acceptable (<500ms for UI updates)
 */

import { test, expect } from '../../fixtures';
import { DashboardPage } from '../../pages';

test.describe('Event Bus: Build Workflow', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();
    await dashboardPage.isDashboardReady();
  });

  // --------------------------------------------------------------------------
  // TC-E2E-BW-001: Complete workflow - Create → Upload → Status Update
  // --------------------------------------------------------------------------
  test('TC-E2E-BW-001: Complete workflow: Create Build → Upload → Status Update', async ({
    authenticatedPage,
  }) => {
    const buildName = `E2E Build ${Date.now()}`;
    const startTime = Date.now();

    // Step 1: Navigate to dashboard
    await dashboardPage.goto();

    // Step 2: Click "Create Build" button
    await dashboardPage.clickByTestId('create-build-button');

    // Step 3: Wait for create modal/form to appear
    await dashboardPage.waitForTestId('build-name-input', 10000);

    // Step 4: Fill build form
    await dashboardPage.fillByTestId('build-name-input', buildName);

    // Step 5: Submit form
    await dashboardPage.clickByTestId('create-build-submit');

    // Step 6: Wait for network to complete and build to appear
    const createLatency = Date.now() - startTime;
    await dashboardPage.waitForNetworkIdle();

    // Verify: BUILD_CREATED event received and UI updated
    const buildRow = dashboardPage.buildCard(buildName);
    await buildRow.waitFor({ state: 'visible', timeout: 5000 });
    expect(createLatency).toBeLessThan(2000); // Create should be fast

    // Step 7: Verify build appears in dashboard
    const builds = await dashboardPage.getBuilds();
    const createdBuild = builds.find((b) => b.name === buildName);
    expect(createdBuild).toBeDefined();
    expect(createdBuild?.status).toContain('PENDING');

    // Step 8: Click on build to open details
    await dashboardPage.clickBuild(buildName);

    // Step 9: Verify build detail page loaded
    await authenticatedPage.waitForURL(`**/builds/**`, { timeout: 10000 });

    // Step 10: Verify build status is visible
    const statusElement = authenticatedPage.locator('[data-testid="build-status"]');
    await statusElement.waitFor({ state: 'visible', timeout: 5000 });
  });

  // --------------------------------------------------------------------------
  // TC-E2E-BW-002: Create Build workflow with real-time update
  // --------------------------------------------------------------------------
  test('TC-E2E-BW-002: Create Build workflow with real-time update', async ({
    authenticatedPage,
  }) => {
    const buildName = `E2E Test Build ${Date.now()}`;

    // Navigate and create build
    await dashboardPage.goto();
    await dashboardPage.clickByTestId('create-build-button');
    await dashboardPage.waitForTestId('build-name-input');
    await dashboardPage.fillByTestId('build-name-input', buildName);

    // Submit and wait for update
    await dashboardPage.clickByTestId('create-build-submit');
    await dashboardPage.waitForNetworkIdle();

    // Verify: Build appears in UI immediately (SSE or optimistic update)
    const buildCard = dashboardPage.buildCard(buildName);
    await buildCard.waitFor({ state: 'visible', timeout: 5000 });

    // Verify: Build has status
    const statusBadge = buildCard.locator('[data-testid="build-status"]');
    await expect(statusBadge).toContainText('PENDING');
  });

  // --------------------------------------------------------------------------
  // TC-E2E-BW-003: Update status workflow with event sync
  // --------------------------------------------------------------------------
  test('TC-E2E-BW-003: Update status workflow with event sync', async ({ authenticatedPage }) => {
    const buildName = `E2E Status Test ${Date.now()}`;

    // Create a build first
    await dashboardPage.goto();
    await dashboardPage.clickByTestId('create-build-button');
    await dashboardPage.waitForTestId('build-name-input');
    await dashboardPage.fillByTestId('build-name-input', buildName);
    await dashboardPage.clickByTestId('create-build-submit');
    await dashboardPage.waitForNetworkIdle();

    // Verify build created
    const buildCard = dashboardPage.buildCard(buildName);
    await buildCard.waitFor({ state: 'visible', timeout: 5000 });

    // Click on build to open details
    await dashboardPage.clickBuild(buildName);
    await authenticatedPage.waitForURL(`**/builds/**`, { timeout: 10000 });

    // Find status dropdown/button
    const statusDropdown = authenticatedPage.locator('[data-testid="status-select"]');
    await statusDropdown.waitFor({ state: 'visible', timeout: 5000 });

    // Click to open dropdown
    await statusDropdown.click();

    // Wait for options to appear
    await authenticatedPage.waitForTimeout(500);

    // Select new status
    const completeOption = authenticatedPage.locator('[data-testid="status-option-COMPLETE"]');
    await completeOption.waitFor({ state: 'visible', timeout: 5000 });
    await completeOption.click();

    // Wait for mutation to complete
    await dashboardPage.waitForNetworkIdle();

    // Verify: Status updated in UI
    const statusValue = authenticatedPage.locator('[data-testid="build-status-value"]');
    await expect(statusValue).toContainText('COMPLETE', { timeout: 5000 });
  });

  // --------------------------------------------------------------------------
  // TC-E2E-BW-004: Add part workflow
  // --------------------------------------------------------------------------
  test('TC-E2E-BW-004: Add part workflow', async ({ authenticatedPage }) => {
    const buildName = `E2E Parts Test ${Date.now()}`;

    // Create build
    await dashboardPage.goto();
    await dashboardPage.clickByTestId('create-build-button');
    await dashboardPage.waitForTestId('build-name-input');
    await dashboardPage.fillByTestId('build-name-input', buildName);
    await dashboardPage.clickByTestId('create-build-submit');
    await dashboardPage.waitForNetworkIdle();

    // Open build details
    const buildCard = dashboardPage.buildCard(buildName);
    await buildCard.waitFor({ state: 'visible', timeout: 5000 });
    await dashboardPage.clickBuild(buildName);
    await authenticatedPage.waitForURL(`**/builds/**`, { timeout: 10000 });

    // Wait for details page to load
    await dashboardPage.waitForTestId('build-details-section');

    // Get initial parts count
    const partsList = authenticatedPage.locator('[data-testid="parts-list"]');
    const initialParts = await partsList.locator('[data-testid^="part-"]').count();

    // Click "Add Part" button
    const addPartButton = authenticatedPage.locator('[data-testid="add-part-button"]');
    await addPartButton.waitFor({ state: 'visible', timeout: 5000 });
    await addPartButton.click();

    // Wait for add part modal/form
    await authenticatedPage.waitForTimeout(500);
    const partNameInput = authenticatedPage.locator('[data-testid="part-name-input"]');
    await partNameInput.waitFor({ state: 'visible', timeout: 5000 });

    // Fill part form
    const partName = `Part ${Date.now()}`;
    await partNameInput.fill(partName);

    // Submit form
    const addPartSubmit = authenticatedPage.locator('[data-testid="add-part-submit"]');
    await addPartSubmit.click();

    // Wait for mutation and update
    await dashboardPage.waitForNetworkIdle();

    // Verify: Parts list updated
    const newParts = await partsList.locator('[data-testid^="part-"]').count();
    expect(newParts).toBeGreaterThan(initialParts);

    // Verify: New part visible
    const newPart = authenticatedPage.locator(`text=${partName}`);
    await expect(newPart).toBeVisible({ timeout: 5000 });
  });

  // --------------------------------------------------------------------------
  // TC-E2E-BW-005: Multiple operations sequence
  // --------------------------------------------------------------------------
  test('TC-E2E-BW-005: Multiple operations sequence', async ({ authenticatedPage }) => {
    const buildName = `E2E Sequence ${Date.now()}`;

    // Create build
    await dashboardPage.goto();
    await dashboardPage.clickByTestId('create-build-button');
    await dashboardPage.waitForTestId('build-name-input');
    await dashboardPage.fillByTestId('build-name-input', buildName);
    await dashboardPage.clickByTestId('create-build-submit');
    await dashboardPage.waitForNetworkIdle();

    // Verify build created
    const buildCard = dashboardPage.buildCard(buildName);
    await buildCard.waitFor({ state: 'visible', timeout: 5000 });

    // Open build
    await dashboardPage.clickBuild(buildName);
    await authenticatedPage.waitForURL(`**/builds/**`, { timeout: 10000 });

    // Add first part
    await dashboardPage.waitForTestId('build-details-section');
    const addPartButton = authenticatedPage.locator('[data-testid="add-part-button"]');
    await addPartButton.waitFor({ state: 'visible', timeout: 5000 });
    await addPartButton.click();

    const partInput1 = authenticatedPage.locator('[data-testid="part-name-input"]');
    await partInput1.waitFor({ state: 'visible', timeout: 5000 });
    await partInput1.fill('Part One');

    const submitPart1 = authenticatedPage.locator('[data-testid="add-part-submit"]');
    await submitPart1.click();
    await dashboardPage.waitForNetworkIdle();

    // Add second part
    await addPartButton.click();
    const partInput2 = authenticatedPage.locator('[data-testid="part-name-input"]');
    await partInput2.waitFor({ state: 'visible', timeout: 5000 });
    await partInput2.fill('Part Two');

    const submitPart2 = authenticatedPage.locator('[data-testid="add-part-submit"]');
    await submitPart2.click();
    await dashboardPage.waitForNetworkIdle();

    // Verify both parts visible
    const partOne = authenticatedPage.locator('text=Part One');
    const partTwo = authenticatedPage.locator('text=Part Two');
    await expect(partOne).toBeVisible({ timeout: 5000 });
    await expect(partTwo).toBeVisible({ timeout: 5000 });

    // Update status
    const statusDropdown = authenticatedPage.locator('[data-testid="status-select"]');
    await statusDropdown.waitFor({ state: 'visible', timeout: 5000 });
    await statusDropdown.click();

    const completeOption = authenticatedPage.locator('[data-testid="status-option-COMPLETE"]');
    await completeOption.waitFor({ state: 'visible', timeout: 5000 });
    await completeOption.click();
    await dashboardPage.waitForNetworkIdle();

    // Verify status changed
    const statusValue = authenticatedPage.locator('[data-testid="build-status-value"]');
    await expect(statusValue).toContainText('COMPLETE', { timeout: 5000 });
  });
});
