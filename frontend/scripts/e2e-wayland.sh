#!/bin/bash

##############################################################################
# Playwright E2E Test Runner for Wayland (KDE Plasma)
#
# This script provides a convenient way to run Playwright E2E tests with
# Xvfb support for Wayland display servers.
#
# Usage:
#   ./scripts/e2e-wayland.sh [--headed] [--debug] [test-file]
#
# Examples:
#   ./scripts/e2e-wayland.sh                # Run all tests headless
#   ./scripts/e2e-wayland.sh --headed       # Run with visual window
#   ./scripts/e2e-wayland.sh --debug        # Run in debug mode
#   ./scripts/e2e-wayland.sh auth.spec.ts   # Run specific test
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DISPLAY_NUM=99
SCREEN_RESOLUTION="1920x1080x24"
MAX_ATTEMPTS=3

# Parse arguments
HEADED_MODE=""
DEBUG_MODE=""
TEST_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --headed)
      HEADED_MODE="--headed"
      shift
      ;;
    --debug)
      DEBUG_MODE="--debug"
      shift
      ;;
    --help|-h)
      grep "^#" "$0" | tail -n +2 | cut -c 3-
      exit 0
      ;;
    *)
      TEST_FILE="$1"
      shift
      ;;
  esac
done

##############################################################################
# Helper Functions
##############################################################################

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

check_xvfb() {
  if ! command -v xvfb-run &> /dev/null; then
    log_error "xvfb-run not found"
    echo ""
    echo "Xvfb is required to run tests on Wayland. Install it with:"
    echo "  sudo apt-get install xvfb xauth"
    echo ""
    exit 1
  fi
  log_success "Xvfb is available"
}

check_playwright() {
  if ! command -v pnpm &> /dev/null; then
    log_error "pnpm not found. Install Node.js and pnpm first."
    exit 1
  fi
  log_success "pnpm is available"
}

check_services() {
  log_info "Checking service connectivity..."
  
  local services=(
    "Frontend|http://localhost:3000"
    "GraphQL|http://localhost:4000/graphql"
    "Express|http://localhost:5000/health"
  )
  
  for service_info in "${services[@]}"; do
    IFS='|' read -r name url <<< "$service_info"
    
    if curl -sf "$url" > /dev/null 2>&1; then
      log_success "$name is running ($url)"
    else
      log_warn "$name is not running ($url) - will start services if needed"
    fi
  done
}

##############################################################################
# Main
##############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Playwright E2E Tests on Wayland (Xvfb)            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
log_info "Checking prerequisites..."
check_xvfb
check_playwright
echo ""

# Check services
check_services
echo ""

# Build test command
log_info "Configuring test run..."
TEST_CMD="pnpm e2e"

if [ -n "$HEADED_MODE" ]; then
  TEST_CMD="$TEST_CMD $HEADED_MODE"
  log_info "Mode: Headed (visual window)"
fi

if [ -n "$DEBUG_MODE" ]; then
  TEST_CMD="$TEST_CMD $DEBUG_MODE"
  log_info "Mode: Debug"
fi

if [ -n "$TEST_FILE" ]; then
  TEST_CMD="$TEST_CMD $TEST_FILE"
  log_info "Test file: $TEST_FILE"
fi

echo ""
log_info "Running: $TEST_CMD"
log_info "Xvfb: Display :$DISPLAY_NUM at $SCREEN_RESOLUTION"
echo ""

# Run tests with Xvfb
xvfb-run -a --server-num=$DISPLAY_NUM --server-args="-screen 0 $SCREEN_RESOLUTION" \
  $TEST_CMD

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   ✓ E2E Tests Completed Successfully                 ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
else
  echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║   ✗ E2E Tests Failed (exit code: $EXIT_CODE)${NC}                 ${RED}║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check if services are running: pnpm dev"
  echo "  2. Enable debug mode: ./scripts/e2e-wayland.sh --debug"
  echo "  3. Run headed mode: ./scripts/e2e-wayland.sh --headed"
  echo "  4. View report: pnpm e2e:report"
fi

exit $EXIT_CODE
