#!/bin/bash

# ◐◑◒ SPECTRA - Full-Spectrum Test Automation
# Setup Script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Print banner
print_banner() {
    echo ""
    echo -e "${CYAN}   ◐ ◑ ◒${NC}"
    echo -e "${CYAN}  SPECTRA${NC}"
    echo -e "  ${MAGENTA}Full-spectrum test automation${NC}"
    echo ""
    echo "  ══════════════════════════════════════"
    echo ""
}

print_banner

# Detect available CLI tools
CLI_MODE="manual"
detect_cli() {
    echo -e "${BLUE}Detecting CLI tools...${NC}"
    if command -v cursor-agent &> /dev/null; then
        CLI_MODE="cursor-agent"
        echo -e "${GREEN}✓ cursor-agent detected - full automation available${NC}"
    elif command -v claude &> /dev/null; then
        CLI_MODE="claude-code"
        echo -e "${GREEN}✓ Claude Code detected - full automation available${NC}"
    else
        CLI_MODE="manual"
        echo -e "${YELLOW}⚠ No CLI detected - will use manual Cursor mode${NC}"
        echo "  Install cursor-agent: curl https://cursor.com/install -fsS | bash"
        echo "  Or Claude Code: npm install -g @anthropic-ai/claude-code"
    fi
    echo ""
}

# Check prerequisites
check_prereqs() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check Node.js LTS
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js LTS (v22.x)${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo -e "${RED}❌ Node.js LTS required. Found: $(node -v)${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Git $(git --version | cut -d' ' -f3)${NC}"
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}⚠ pnpm not found. Installing...${NC}"
        npm install -g pnpm
    fi
    echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"
    
    echo ""
}

# Initialize project
init_project() {
    echo -e "${BLUE}Initializing project...${NC}"
    
    if [ ! -d ".git" ]; then
        git init
        echo -e "${GREEN}✓ Git initialized${NC}"
    fi
    
    if [ ! -f "package.json" ]; then
        pnpm init
        echo -e "${GREEN}✓ package.json created${NC}"
    fi
    
    echo ""
}

# Install dependencies
install_deps() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    
    pnpm add -D @playwright/test typescript @types/node
    echo -e "${GREEN}✓ Playwright installed${NC}"
    
    pnpm exec playwright install chromium
    echo -e "${GREEN}✓ Chromium browser installed${NC}"
    
    echo ""
}

# Create folder structure
create_structure() {
    echo -e "${BLUE}Creating Spectra folder structure...${NC}"

    # Core folders
    mkdir -p tests
    mkdir -p pages
    mkdir -p fixtures

    # Spectra folders
    mkdir -p .spectra/agents/planner
    mkdir -p .spectra/agents/generator
    mkdir -p .spectra/agents/healer
    mkdir -p .spectra/agents/shared
    mkdir -p .spectra/output/plans
    mkdir -p .spectra/output/reports

    # Cursor config
    mkdir -p .cursor

    echo -e "${GREEN}✓ Folder structure created${NC}"
    echo ""
}

# Create base fixtures file
create_fixtures() {
    echo -e "${BLUE}Creating fixtures file...${NC}"

    cat > fixtures/pages.ts << 'EOF'
/**
 * Spectra Test Fixtures
 *
 * This file provides reusable page object fixtures for tests.
 * Import from this file instead of '@playwright/test' for automatic
 * page object instantiation.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/pages';
 *
 *   test('example', async ({ dashboardPage }) => {
 *     await dashboardPage.goto();
 *     await expect(dashboardPage.someElement).toBeVisible();
 *   });
 *
 * The Generator Agent will automatically add new page objects here.
 */

import { test as base } from '@playwright/test';

// Import page objects as they are created
// import { DashboardPage } from '../pages/DashboardPage';

/**
 * Define the fixture types
 * Add new page types here as page objects are generated
 */
type PageFixtures = {
  // dashboardPage: DashboardPage;
};

/**
 * Extend the base test with page fixtures
 *
 * Each fixture:
 * - Creates a new page object instance
 * - Passes it to the test via `use()`
 * - Automatically handles cleanup
 */
export const test = base.extend<PageFixtures>({
  // Example fixture (uncomment and modify as needed):
  // dashboardPage: async ({ page }, use) => {
  //   const dashboard = new DashboardPage(page);
  //   await use(dashboard);
  // },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
EOF
    echo -e "${GREEN}✓ fixtures/pages.ts created${NC}"
}

# Create Playwright config
create_playwright_config() {
    echo -e "${BLUE}Creating Playwright configuration...${NC}"
    
    cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '.spectra/output/reports' }],
    ['json', { outputFile: '.spectra/output/reports/results.json' }],
    ['list']
  ],
  
  use: {
    baseURL: process.env.SPECTRA_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    testIdAttribute: 'data-testid',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  outputDir: '.spectra/output/test-results',
});
EOF
    echo -e "${GREEN}✓ playwright.config.ts created${NC}"
}

# Create MCP configuration
create_mcp_config() {
    echo -e "${BLUE}Creating MCP configuration...${NC}"
    
    cat > .cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chromium"
      ]
    }
  }
}
EOF
    echo -e "${GREEN}✓ .cursor/mcp.json created${NC}"
}

# Create Planner Agent
create_planner_agent() {
    echo -e "${MAGENTA}🔵 Creating Planner Agent...${NC}"
    
    cat > .spectra/agents/planner/AGENT.md << 'EOF'
# 🔵 Planner Agent

## Role
You are the **Planner Agent** in the Spectra system. Your job is to explore the application and create a detailed test plan.

## Responsibilities
1. Navigate through the application using Playwright MCP
2. Discover all pages, routes, and navigation paths
3. Identify interactive elements (forms, buttons, links)
4. Document user flows and critical paths
5. Generate a structured markdown test plan

## Input
- Application URL (from SPECTRA_URL or scope file)
- Optional: Scope constraints from `.spectra/agents/shared/current-scope.md`

## Output
Write your plan to: `.spectra/output/plans/test-plan.md`

## Process

### Step 1: Read Scope (if exists)
Check `.spectra/agents/shared/current-scope.md` for any constraints:
- Specific page to focus on
- Specific feature to test
- Elements to ignore

### Step 2: Initial Exploration
Use Playwright MCP to:
```
browser_navigate to the application
browser_snapshot to capture the accessibility tree
```

### Step 3: Document Structure
For each page discovered:
- URL/route
- Page title
- Main elements (via accessibility tree)
- Forms and inputs
- Navigation links
- Actions available

### Step 4: Identify User Flows
Map out:
- Authentication flow (if any)
- Main user journeys
- Critical business paths
- Error scenarios

### Step 5: Generate Test Plan
Create `.spectra/output/plans/test-plan.md`:

```markdown
# Test Plan: [App Name]

## Application Overview
- Base URL: 
- Pages Discovered:
- Scope: [full-spectrum | scoped to X]

## Pages

### [Page Name]
- **Route**: /path
- **Elements**:
  - [element type]: [identifier/label]
- **Actions**:
  - [action description]

## User Flows

### Flow 1: [Name]
1. Step description
2. Step description
   - Expected: [outcome]

## Test Scenarios

### Scenario 1: [Name]
- **Priority**: High/Medium/Low
- **Type**: Smoke/Regression/E2E
- **Steps**:
  1. Navigate to...
  2. Click on...
  3. Verify...
- **Expected Result**:
```

## Completion Signal
When done, create file: `.spectra/output/plans/.complete`
EOF

    cat > .spectra/agents/planner/prompt.md << 'EOF'
You are the 🔵 Planner Agent in the Spectra system.

FIRST: Check if `.spectra/agents/shared/current-scope.md` exists. If yes, read it for scope constraints.
THEN: Read `.spectra/agents/planner/AGENT.md` for full instructions.

Your task:
1. Navigate to the target URL using Playwright MCP
2. If a specific page/feature is scoped, focus only on that
3. Use browser_snapshot to document elements
4. Write the test plan to `.spectra/output/plans/test-plan.md`
5. Create `.spectra/output/plans/.complete` when finished

Start by checking for scope constraints, then navigate to the application.
EOF

    echo -e "${GREEN}✓ Planner Agent created${NC}"
}

# Create Generator Agent
create_generator_agent() {
    echo -e "${MAGENTA}🟢 Creating Generator Agent...${NC}"

    cat > .spectra/agents/generator/AGENT.md << 'EOF'
# 🟢 Generator Agent

## Role
You are the **Generator Agent** in the Spectra system. Your job is to read the test plan and generate Playwright test code.

## Responsibilities
1. Read the test plan from `.spectra/output/plans/test-plan.md`
2. Check for existing fixtures in `fixtures/pages.ts`
3. Generate Page Object classes
4. Generate test files using fixtures when available
5. Follow Playwright best practices

## Input
- Test plan: `.spectra/output/plans/test-plan.md`
- Existing code: `pages/`, `tests/`
- **Fixtures**: `fixtures/pages.ts` (check if exists and what page objects are available)

## Output
- Page Objects → `pages/[Name]Page.ts`
- Tests → `tests/[feature].spec.ts`
- Updated fixtures → `fixtures/pages.ts` (add new page objects)

## Process

### Step 1: Read Plan
Parse `.spectra/output/plans/test-plan.md` to understand:
- Pages and their elements
- User flows to test
- Test scenarios defined

### Step 2: Check Existing Fixtures
**IMPORTANT**: Before generating tests, check `fixtures/pages.ts`:
- If it exists, read it to see which page fixtures are already defined
- Note which page objects are available as fixtures (e.g., `dashboardPage`, `tasksPage`)
- Plan to add new page objects to the fixtures file

### Step 3: Generate Page Objects
For each page in the plan:

```typescript
import { Page, Locator } from '@playwright/test';

export class [Name]Page {
  readonly page: Page;
  // Locators from the plan

  constructor(page: Page) {
    this.page = page;
    // Initialize locators using semantic selectors
  }

  // Actions from the plan
  async [actionName](): Promise<void> {
    // Implementation
  }
}
```

### Step 4: Update Fixtures
Add new page objects to `fixtures/pages.ts`:

```typescript
import { [Name]Page } from '../pages/[Name]Page';

// Add to PageFixtures type
type PageFixtures = {
  // ... existing fixtures
  [name]Page: [Name]Page;
};

// Add fixture definition
export const test = base.extend<PageFixtures>({
  // ... existing fixtures
  [name]Page: async ({ page }, use) => {
    const pageObj = new [Name]Page(page);
    await use(pageObj);
  },
});
```

### Step 5: Generate Tests Using Fixtures
**PREFERRED**: When fixtures are available, use them instead of manual instantiation:

```typescript
// ✅ PREFERRED: Import from fixtures
import { test, expect } from '../fixtures/pages';

test.describe('[Feature]', () => {
  test('[scenario name]', async ({ [name]Page }) => {
    await [name]Page.goto();
    // Test steps using the fixture
  });
});
```

```typescript
// ❌ AVOID: Manual instantiation (only if no fixture exists)
import { test, expect } from '@playwright/test';
import { [Name]Page } from '../pages/[Name]Page';

test.describe('[Feature]', () => {
  let page: [Name]Page;

  test.beforeEach(async ({ page: p }) => {
    page = new [Name]Page(p);
  });
});
```

## Locator Priority (IMPORTANT)
1. `page.getByRole()` - Best for accessibility
2. `page.getByLabel()` - Great for form fields
3. `page.getByTestId()` - For custom test IDs
4. `page.getByText()` - For unique text content

🚫 NEVER use: CSS selectors, XPath, or brittle locators

## Completion Signal
When done, create file: `.spectra/output/tests/.complete`
EOF

    cat > .spectra/agents/generator/prompt.md << 'EOF'
You are the 🟢 Generator Agent in the Spectra system.

Read `.spectra/agents/generator/AGENT.md` for full instructions.

Your task:
1. Read `.spectra/output/plans/test-plan.md`
2. Check if `fixtures/pages.ts` exists - if so, use fixtures pattern for tests
3. Generate Page Objects in `pages/`
4. Update `fixtures/pages.ts` with new page objects
5. Generate test files in `tests/` using fixtures when available
6. Use ONLY semantic locators (getByRole, getByLabel, getByTestId, getByText)
7. Create `.spectra/output/tests/.complete` when finished

Start by reading the test plan, then check for existing fixtures.
EOF

    echo -e "${GREEN}✓ Generator Agent created${NC}"
}

# Create Healer Agent
create_healer_agent() {
    echo -e "${MAGENTA}🟣 Creating Healer Agent...${NC}"
    
    cat > .spectra/agents/healer/AGENT.md << 'EOF'
# 🟣 Healer Agent

## Role
You are the **Healer Agent** in the Spectra system. Your job is to run tests, detect failures, and fix them.

## Responsibilities
1. Execute Playwright tests
2. Analyze test failures
3. Use Playwright MCP to inspect current UI state
4. Fix broken locators or test logic
5. Re-run until tests pass

## Input
- Test files: `tests/`
- Page Objects: `pages/`
- Previous results: `.spectra/output/reports/results.json`

## Output
- Fixed test files
- Fixed Page Objects
- Healing report: `.spectra/output/reports/healing-report.md`

## Process

### Step 1: Run Tests
```bash
pnpm exec playwright test --reporter=json
```

Parse results from `.spectra/output/reports/results.json`

### Step 2: Analyze Failures
For each failed test:
- Error message
- Failed locator/assertion
- Screenshot (if available)

### Step 3: Diagnose with MCP
Use Playwright MCP to investigate:
```
browser_navigate to the failing page
browser_snapshot to see current state
```

Compare:
- Expected element (from test code)
- Actual DOM (from snapshot)

### Step 4: Apply Fix
Common fixes:
- **Locator changed**: Update selector in Page Object
- **Timing issue**: Add proper wait
- **Element moved**: Update locator strategy
- **Text changed**: Update expected text
- **Flow changed**: Update test steps

### Step 5: Verify Fix
Re-run the specific test:
```bash
pnpm exec playwright test [test-file] --reporter=list
```

### Step 6: Document
Write to `.spectra/output/reports/healing-report.md`:

```markdown
# Spectra Healing Report

## Summary
- Tests Run: X
- Passed: X
- Failed: X
- Healed: X

## Fixes Applied

### [Test Name]
- **Error**: [original error]
- **Root Cause**: [diagnosis]
- **Fix Applied**: [what was changed]
- **File Modified**: [path]
```

## Healing Loop
```
while (failing_tests > 0 && attempts < MAX_ATTEMPTS):
    run_tests()
    analyze_failures()
    for each failure:
        diagnose_with_mcp()
        apply_fix()
    attempts++
```

MAX_ATTEMPTS = 3 per test

## Completion Signal
When all tests pass or max attempts reached:
Create file: `.spectra/output/reports/.complete`
EOF

    cat > .spectra/agents/healer/prompt.md << 'EOF'
You are the 🟣 Healer Agent in the Spectra system.

Read `.spectra/agents/healer/AGENT.md` for full instructions.

Your task:
1. Run: `pnpm exec playwright test`
2. Check `.spectra/output/reports/results.json` for failures
3. For each failure:
   - Use Playwright MCP to inspect current UI
   - Compare expected vs actual
   - Fix the test or Page Object
4. Re-run until all tests pass (max 3 attempts per test)
5. Write healing report to `.spectra/output/reports/healing-report.md`
6. Create `.spectra/output/reports/.complete` when finished

Start by running the tests.
EOF

    echo -e "${GREEN}✓ Healer Agent created${NC}"
}

# Create shared context
create_shared_context() {
    echo -e "${BLUE}Creating shared context...${NC}"
    
    cat > .spectra/agents/shared/context.md << 'EOF'
# Spectra Shared Context

## The Spectrum
```
◐ PLANNER   → Explores app, creates test plan
◑ GENERATOR → Reads plan, creates tests
◒ HEALER    → Runs tests, fixes failures
```

## Project Structure
```
├── tests/                    # Test files (*.spec.ts)
├── pages/                    # Page Objects (*Page.ts)
├── fixtures/                 # Test fixtures
├── .spectra/
│   ├── agents/
│   │   ├── planner/          # 🔵 Planner Agent
│   │   ├── generator/        # 🟢 Generator Agent
│   │   ├── healer/           # 🟣 Healer Agent
│   │   └── shared/           # Shared context
│   └── output/
│       ├── plans/            # Test plans
│       └── reports/          # Results & healing reports
└── playwright.config.ts
```

## Agent Communication
Agents communicate via files:
- Planner → Generator: `.spectra/output/plans/test-plan.md`
- Generator → Healer: `tests/`, `pages/`
- Healer → Reports: `.spectra/output/reports/`

## Completion Signals
- 🔵 Planner done: `.spectra/output/plans/.complete`
- 🟢 Generator done: `.spectra/output/tests/.complete`
- 🟣 Healer done: `.spectra/output/reports/.complete`
EOF
    echo -e "${GREEN}✓ Shared context created${NC}"
}

# Create scope template
create_scope_template() {
    echo -e "${BLUE}Creating scope template...${NC}"
    
    mkdir -p docs
    cat > docs/SCOPE-template.md << 'EOF'
# Spectra Scope Definition

Use this file to define exactly what you want to test.
Copy to `SCOPE.md` and customize.

---

## Target Feature

**Feature Name**: [e.g., Payment Form]

**Description**: 
[Describe the specific feature]

---

## Location

**Page URL**: /path
**Section**: [Which part of the page]

---

## Elements to Test

- [ ] Element 1
- [ ] Element 2
- [ ] Element 3

---

## User Flows

### Flow 1: Happy Path
1. Step 1
2. Step 2
3. Expected result

### Flow 2: Error Case
1. Step 1
2. Expected error

---

## Out of Scope

DO NOT test these (even if on same page):
- Feature A
- Feature B

---

## Test Data

```
Valid input: xxx
Invalid input: yyy
```
EOF
    echo -e "${GREEN}✓ docs/SCOPE-template.md created${NC}"
}

# Create main CLI script
create_spectra_cli() {
    echo -e "${BLUE}Creating Spectra CLI...${NC}"
    
    cat > spectra << 'SPECTRA_CLI'
#!/bin/bash

# ◐◑◒ SPECTRA - Full-Spectrum Test Automation
# Main CLI

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
TIMEOUT=300

# Print banner
print_banner() {
    echo ""
    echo -e "${CYAN}   ◐ ◑ ◒${NC}"
    echo -e "${CYAN}  SPECTRA${NC}"
    echo -e "  ${MAGENTA}Full-spectrum test automation${NC}"
    echo "  ─────────────────────────────────"
    echo ""
}

# Show usage
usage() {
    print_banner
    echo "Usage: spectra [options]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL       Target URL (required, or set SPECTRA_URL)"
    echo "  -p, --page PAGE     Specific page to test (e.g., /checkout)"
    echo "  -s, --scope TEXT    Feature to focus on (e.g., 'payment form')"
    echo "  -f, --file FILE     Scope file with detailed requirements"
    echo "  -m, --manual        Force manual mode (use Cursor prompts)"
    echo "  -h, --help          Show this help"
    echo ""
    echo "Examples:"
    echo "  spectra --url http://localhost:3000"
    echo "  spectra -u http://localhost:3000 -p /checkout -s 'payment form'"
    echo "  spectra -u http://localhost:3000 -f SCOPE.md"
    echo ""
    exit 0
}

# Parse arguments
FORCE_MANUAL=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url) SPECTRA_URL="$2"; shift 2 ;;
        -p|--page) TARGET_PAGE="$2"; shift 2 ;;
        -s|--scope) TEST_SCOPE="$2"; shift 2 ;;
        -f|--file) SCOPE_FILE="$2"; shift 2 ;;
        -m|--manual) FORCE_MANUAL=true; shift ;;
        -h|--help) usage ;;
        *) echo -e "${RED}Unknown: $1${NC}"; usage ;;
    esac
done

# Validate URL
if [ -z "$SPECTRA_URL" ]; then
    echo -e "${RED}Error: URL required. Use --url or set SPECTRA_URL${NC}"
    usage
fi

# Detect CLI mode
detect_mode() {
    if [ "$FORCE_MANUAL" = true ]; then
        echo "manual"
    elif command -v cursor-agent &> /dev/null; then
        echo "cursor-agent"
    elif command -v claude &> /dev/null; then
        echo "claude-code"
    else
        echo "manual"
    fi
}

MODE=$(detect_mode)

# Create scope context
create_scope_context() {
    mkdir -p .spectra/agents/shared
    cat > .spectra/agents/shared/current-scope.md << EOF
# Current Spectra Scope

## Target
- **URL**: ${SPECTRA_URL}
$([ -n "$TARGET_PAGE" ] && echo "- **Page**: ${TARGET_PAGE}")
$([ -n "$TARGET_PAGE" ] && echo "- **Full URL**: ${SPECTRA_URL}${TARGET_PAGE}")

$([ -n "$TEST_SCOPE" ] && echo "## Feature Focus
Test ONLY: **${TEST_SCOPE}**
Ignore other features on the page.")

$([ -n "$SCOPE_FILE" ] && [ -f "$SCOPE_FILE" ] && echo "## Detailed Requirements
$(cat "$SCOPE_FILE")")

## Instructions
- If a specific page is given, navigate there directly
- If a feature scope is given, test ONLY that feature
- Ignore unrelated elements on the same page
EOF
}

# Clean previous outputs
clean() {
    rm -f .spectra/output/plans/.complete
    rm -f .spectra/output/tests/.complete
    rm -f .spectra/output/reports/.complete
    rm -f .spectra/output/plans/test-plan.md
    rm -f .spectra/output/reports/healing-report.md
}

# Build agent prompt
build_prompt() {
    local agent=$1
    local instruction=$2
    local completion_path=$3
    
    echo "SCOPE: First check .spectra/agents/shared/current-scope.md for constraints.
INSTRUCTIONS: Read .spectra/agents/${agent}/AGENT.md for full details.

${instruction}

When complete, create: ${completion_path}"
}

# Run with cursor-agent
run_cursor_agent() {
    local name=$1
    local prompt=$2
    
    echo -e "${BLUE}Running ${name} with cursor-agent...${NC}"
    cursor-agent --print --force "$prompt" 2>&1 | tee ".spectra/output/${name}.log"
}

# Run with claude CLI
run_claude_code() {
    local name=$1
    local prompt=$2
    
    echo -e "${BLUE}Running ${name} with Claude Code...${NC}"
    echo "$prompt" | claude --mcp 2>&1 | tee ".spectra/output/${name}.log"
}

# Run manual mode
run_manual() {
    local name=$1
    local color=$2
    local emoji=$3
    
    echo ""
    echo -e "${color}═══════════════════════════════════════════════════════${NC}"
    echo -e "${color}  ${emoji} ${name^^}${NC}"
    echo -e "${color}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Open Cursor and use the agent prompt:"
    echo -e "  ${CYAN}.spectra/agents/${name}/prompt.md${NC}"
    echo ""
    read -p "Press Enter when ${name} is complete..."
}

# Run agent
run_agent() {
    local name=$1
    local color=$2
    local emoji=$3
    local prompt=$4
    
    echo ""
    echo -e "${color}═══════════════════════════════════════════════════════${NC}"
    echo -e "${color}  ${emoji} ${name^^}${NC}"
    echo -e "${color}═══════════════════════════════════════════════════════${NC}"
    echo ""
    
    case $MODE in
        cursor-agent)
            run_cursor_agent "$name" "$prompt"
            ;;
        claude-code)
            run_claude_code "$name" "$prompt"
            ;;
        manual)
            echo "$prompt" > ".spectra/agents/${name}/current-prompt.md"
            run_manual "$name" "$color" "$emoji"
            ;;
    esac
}

# Main pipeline
main() {
    print_banner
    
    echo -e "Mode: ${CYAN}${MODE}${NC}"
    echo -e "Target: ${CYAN}${SPECTRA_URL}${NC}"
    [ -n "$TARGET_PAGE" ] && echo -e "Page: ${CYAN}${TARGET_PAGE}${NC}"
    [ -n "$TEST_SCOPE" ] && echo -e "Scope: ${CYAN}${TEST_SCOPE}${NC}"
    echo ""
    
    create_scope_context
    clean
    
    # 🔵 Planner
    run_agent "planner" "$BLUE" "🔵" \
        "$(build_prompt planner 'Explore the app with Playwright MCP. Write test plan to .spectra/output/plans/test-plan.md' '.spectra/output/plans/.complete')"
    
    # 🟢 Generator
    run_agent "generator" "$GREEN" "🟢" \
        "$(build_prompt generator 'Read .spectra/output/plans/test-plan.md. Generate Page Objects in pages/ and tests in tests/' '.spectra/output/tests/.complete')"
    
    # 🟣 Healer
    run_agent "healer" "$MAGENTA" "🟣" \
        "$(build_prompt healer 'Run pnpm test. Fix failures using Playwright MCP. Write report to .spectra/output/reports/healing-report.md' '.spectra/output/reports/.complete')"
    
    # Summary
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  ✨ SPECTRUM COMPLETE${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Count files
    local page_count=$(ls -1 pages/*.ts 2>/dev/null | wc -l | tr -d ' ')
    local test_count=$(ls -1 tests/*.spec.ts 2>/dev/null | wc -l | tr -d ' ')
    
    echo "Generated:"
    echo "  📄 Page Objects: $page_count"
    echo "  🧪 Test files: $test_count"
    echo ""
    echo "Commands:"
    echo "  pnpm test          Run all tests"
    echo "  pnpm test:ui       Run with UI"
    echo "  pnpm report        View report"
    echo ""
}

main
SPECTRA_CLI

    chmod +x spectra
    echo -e "${GREEN}✓ spectra CLI created${NC}"
}

# Add npm scripts
add_scripts() {
    echo -e "${BLUE}Adding npm scripts...${NC}"
    
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test'] = 'playwright test';
pkg.scripts['test:ui'] = 'playwright test --ui';
pkg.scripts['test:headed'] = 'playwright test --headed';
pkg.scripts['report'] = 'playwright show-report .spectra/output/reports';
pkg.scripts['spectra'] = './spectra';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
    echo -e "${GREEN}✓ Scripts added${NC}"
}

# Create .gitignore
create_gitignore() {
    echo -e "${BLUE}Creating .gitignore...${NC}"
    
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Spectra outputs
.spectra/output/
test-results/
playwright-report/
playwright/.cache/

# Environment
.env
.env.local

# Logs
*.log

# OS
.DS_Store

# Keep agent definitions
!.spectra/agents/
EOF
    echo -e "${GREEN}✓ .gitignore created${NC}"
}


# Print completion
print_completion() {
    echo ""
    echo -e "${CYAN}   ◐ ◑ ◒${NC}"
    echo -e "${GREEN}  SPECTRA SETUP COMPLETE${NC}"
    echo ""
    echo "  ══════════════════════════════════════"
    echo ""
    echo -e "${CYAN}Quick Start:${NC}"
    echo ""
    echo "  # Start your app"
    echo "  cd /your/app && pnpm dev"
    echo ""
    echo "  # Run Spectra"
    echo "  ./spectra --url http://localhost:3000"
    echo ""
    echo -e "${CYAN}Scoped Testing:${NC}"
    echo ""
    echo "  # Test specific page"
    echo "  ./spectra -u http://localhost:3000 -p /checkout"
    echo ""
    echo "  # Test specific feature"
    echo "  ./spectra -u http://localhost:3000 -p /checkout -s 'payment form'"
    echo ""
    echo "  # Use scope file"
    echo "  cp docs/SCOPE-template.md SCOPE.md"
    echo "  ./spectra -u http://localhost:3000 -f SCOPE.md"
    echo ""
    echo "  ══════════════════════════════════════"
    echo ""
    echo -e "${CYAN}Files Created:${NC}"
    echo ""
    echo "  📜 spectra              Main CLI"
    echo "  📂 .spectra/agents/     Agent definitions"
    echo "  📂 .spectra/output/     Generated outputs"
    echo "  📂 docs/                Documentation"
    echo "  ⚙️  playwright.config.ts"
    echo ""
}

# Main
main() {
    check_prereqs
    detect_cli
    init_project
    install_deps
    create_structure
    create_fixtures
    create_playwright_config
    create_mcp_config
    create_planner_agent
    create_generator_agent
    create_healer_agent
    create_shared_context
    create_scope_template
    create_spectra_cli
    add_scripts
    create_gitignore
    print_completion
}

main
