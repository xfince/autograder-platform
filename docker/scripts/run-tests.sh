#!/bin/bash
# ============================================
# Test Execution Script for Sandbox
# ============================================
set -e

# Configuration
REPO_DIR="${REPO_DIR:-/workspace/repo}"
TEST_DIR="${TEST_DIR:-/workspace/tests}"
RESULTS_DIR="${RESULTS_DIR:-/workspace/results}"
TIMEOUT="${TIMEOUT:-600}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Main execution
# ============================================
main() {
    log_info "Starting test execution in sandbox..."
    
    # Validate directories exist
    if [ ! -d "$REPO_DIR" ]; then
        log_error "Repository directory not found: $REPO_DIR"
        exit 1
    fi
    
    if [ ! -d "$TEST_DIR" ]; then
        log_error "Tests directory not found: $TEST_DIR"
        exit 1
    fi
    
    # Create results directory if it doesn't exist
    mkdir -p "$RESULTS_DIR"
    
    # Change to repository directory
    cd "$REPO_DIR"
    log_info "Working directory: $(pwd)"
    
    # Install dependencies if package.json exists
    if [ -f "package.json" ]; then
        log_info "Installing dependencies..."
        npm install --silent --no-audit --no-fund || {
            log_error "Failed to install dependencies"
            exit 1
        }
    fi
    
    # Copy test files to repository
    log_info "Copying test files..."
    cp -r "$TEST_DIR"/* . || {
        log_error "Failed to copy test files"
        exit 1
    }
    
    # Run Jest tests
    log_info "Running tests (timeout: ${TIMEOUT}s)..."
    
    # Execute with timeout
    timeout "$TIMEOUT" npm test -- --json --outputFile="$RESULTS_DIR/results.json" || TEST_EXIT=$?
    
    if [ "$TEST_EXIT" = "124" ]; then
        log_error "Tests timed out after ${TIMEOUT} seconds"
        echo '{"error":"timeout","message":"Test execution exceeded time limit"}' > "$RESULTS_DIR/results.json"
        exit 124
    elif [ "$TEST_EXIT" != "0" ] && [ -n "$TEST_EXIT" ]; then
        log_warn "Tests completed with errors (exit code: $TEST_EXIT)"
        exit "$TEST_EXIT"
    fi
    
    log_info "Tests completed successfully"
    
    # Output results location
    if [ -f "$RESULTS_DIR/results.json" ]; then
        log_info "Results saved to: $RESULTS_DIR/results.json"
    fi
    
    exit 0
}

# Run main function
main "$@"
