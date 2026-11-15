# Test Plan: TestApp (dummy-test-app)

## Application Overview
- Base URL: http://localhost:5173
- Pages Discovered: 10 (9 in-app routes + 1 unknown route behavior)
- Scope: full-spectrum (no additional constraints in `.spectra/agents/shared/current-scope.md`)

## Pages

### Dashboard
- **Route**: /
- **Elements**:
  - Sidebar: app name "TestApp", navigation links (Dashboard, Tasks, Products, Checkout, Kanban, Users, Notifications, Settings, Login), footer text "Demo App for Spectra Testing"
  - Main heading: "Dashboard" (h1), subtitle "Welcome back! Here's an overview of your business."
  - Stat cards: Total Revenue ($45,231.89, +20.1% from last month), Subscriptions (+2350, +180.1%), Sales (+12,234, +19%), Active Now (+573, +201)
  - Overview chart/list: January $4,500, February $6,200, March $8,100, April $5,400
  - Recent Sales: "You made 265 sales this month." with 5 entries (Olivia Martin, Jackson Lee, Isabella Nguyen, William Kim, Sofia Davis) and amounts
- **Actions**:
  - Navigate via sidebar links
- **Empty State Messages**:
  - None observed (dashboard populated with static/demo data)
- **Form Validations**:
  - N/A (no forms)
- **Toggle Behaviors**:
  - None observed
- **Additional UI Components**:
  - Metric/stat cards, simple overview bars/values, recent sales list
- **UX Flows**:
  - Landing/overview view; global navigation via sidebar
- **Notes**:
  - Console shows React hydration/nesting errors on load (`<div>` inside `<p>` / `<p>` cannot contain nested `<div>` in stat card badge area). Evidence: `.spectra/output/evidence/root.png`

### Tasks
- **Route**: /tasks
- **Elements**:
  - Heading "Tasks" (h1), subtitle "Manage your tasks and stay organized."
  - Button: "Add Task"
  - Filter combobox: "All Tasks"
  - Counter: "5 tasks"
  - Card "Your Tasks": "4 pending, 1 completed"
  - Task rows (5): checkbox, title, description, priority label (high/medium/low), delete icon button
    - Review project proposal (unchecked, high)
    - Update documentation (checked, medium)
    - Fix navigation bug (unchecked, high)
    - Design review meeting (unchecked, low)
    - Database optimization (unchecked, medium)
  - Add Task dialog (on click): "Create New Task", "Add a new task to your list.", fields Title (textbox, placeholder "Task title"), Description (textbox, placeholder "Task description"), Priority combobox (default "Medium"), buttons Cancel/Create Task, Close button
- **Actions**:
  - Open/close Add Task dialog (Add Task, Cancel, Close, Escape closes dialog)
  - Toggle task completion checkboxes
  - Filter tasks via combobox (options not fully enumerated during exploration)
  - Delete task via row action button (confirmation behavior not confirmed; destructive action present)
  - Submit Create Task form
- **Empty State Messages**:
  - Not observed in default state (list populated). Empty-state UI for zero tasks/filter-no-match not directly observed.
- **Form Validations**:
  - Add Task > Title: submitting empty showed no visible inline error message in accessibility snapshot; dialog remained open (possible HTML5/native or silent validation). Exact error message: not observed.
- **Toggle Behaviors**:
  - Task checkbox toggles checked/unchecked state (e.g. "Update documentation" initially checked)
  - Add Task dialog opens/closes
- **Additional UI Components**:
  - Dialog/modal, combobox filter, checkboxes, priority badges/labels, icon buttons
- **UX Flows**:
  - Task management CRUD-like interactions (create dialog, complete toggle, delete affordance)

### Products
- **Route**: /products
- **Elements**:
  - Heading "Products" (h1), subtitle "Browse our collection of products."
  - Button: "Cart (0)"
  - Filters card: Search textbox (placeholder "Search products..."), Category combobox ("All Categories"), Price Range label "Price Range: $0 - $300", sliders "Minimum" and "Maximum"
  - Product grid/cards (8): emoji/icon, name, price, rating, category, stock, "Add to Cart" button
    - Wireless Headphones $199.99 (4.5, electronics, 50 in stock)
    - Smart Watch $299.99 (4.8, electronics, 30 in stock)
    - Running Shoes $129.99 (4.3, sports, 100 in stock)
    - Coffee Maker $89.99 (4.6, home, 25 in stock)
    - Backpack $79.99 (4.4, accessories, 75 in stock)
    - Desk Lamp $49.99 (4.2, home, 60 in stock)
    - Yoga Mat $39.99 (4.7, sports, 120 in stock)
    - Bluetooth Speaker $149.99 (4.5, electronics, 40 in stock)
- **Actions**:
  - Search products by text
  - Filter by category and price range sliders
  - Add items to cart
  - Open cart (button present)
- **Empty State Messages**:
  - **"No products found"** (shown when searching for `zzzznonexistent`)
- **Form Validations**:
  - N/A (filters/search inputs; no submit validation flow observed)
- **Toggle Behaviors**:
  - Search dynamically filters results/listing
- **Additional UI Components**:
  - Search input, combobox, dual sliders (range), product cards, rating/stock/category labels
- **UX Flows**:
  - Browse/filter/search catalog; cart entry point

### Checkout
- **Route**: /checkout
- **Elements**:
  - Heading "Checkout" (h1), subtitle "Complete your order"
  - Stepper/progress: Address, Payment, Confirm
  - Step 1 (Address): "Shipping Address" / "Enter your shipping details"
    - Fields: First Name, Last Name, Email, Phone, Street Address, City, State combobox ("Select"), ZIP Code
    - Checkbox: "Save this address for future orders"
    - Buttons: Back (disabled on step 1), Next
  - Step 2 (Payment, reached after Next): "Payment Details" / "Enter your payment information"
    - Fields: Name on Card, Card Number (placeholder "1234 5678 9012 3456"), Expiry Date (placeholder "MM/YY"), CVC (placeholder "123")
    - Text: "Secure", "Your payment info is encrypted"
    - Buttons: Back, Next
  - Order Summary (persistent): items (Wireless Headphones x1 $199.99, Smart Watch x1 $299.99), Subtotal $499.98, Shipping $9.99, Tax $40.00, Total $549.97
- **Actions**:
  - Navigate checkout steps via Next/Back
  - Fill shipping/payment forms
  - Toggle save-address checkbox
  - Select state from combobox
- **Empty State Messages**:
  - None observed
- **Form Validations**:
  - Step 1 > Address form: clicking Next with all fields empty advanced to Payment step in exploration; no inline validation error messages observed. (Validation behavior may be minimal or deferred; flag for test design.)
- **Toggle Behaviors**:
  - "Save this address for future orders" checkbox toggles
  - Step content switches between Address/Payment/Confirm
- **Additional UI Components**:
  - Multi-step wizard/stepper, form inputs, combobox, checkbox, order summary panel
- **UX Flows**:
  - Checkout funnel: Address -> Payment -> Confirm (Confirm step UI not fully explored)

### Kanban
- **Route**: /kanban
- **Elements**:
  - Heading "Kanban Board" (h1), subtitle "Drag and drop tasks to update status"
  - Columns with counts and add buttons:
    - Backlog (3): User authentication flow (high), API rate limiting (medium), Database indexing (low)
    - To Do (2): Design new dashboard (high), Implement search filters (medium)
    - In Progress (1): Fix login bug (high) with description "Users unable to login with special chars"
    - Done (2): Setup CI/CD pipeline (medium), Update documentation (low)
  - Each card shows title, priority badge, action/menu button; some show description
- **Actions**:
  - Drag and drop cards between columns (stated by UI)
  - Add card/task per column (button present)
  - Card-level actions via buttons
- **Empty State Messages**:
  - None observed (all columns populated)
- **Form Validations**:
  - N/A observed
- **Toggle Behaviors**:
  - Drag-and-drop status changes implied (not executed in exploration)
- **Additional UI Components**:
  - Kanban board/columns, draggable cards, priority badges, icon buttons
- **UX Flows**:
  - Workflow/status management via board

### Users
- **Route**: /users
- **Elements**:
  - Heading "Users" (h1), subtitle "Manage your team members"
  - Filters/controls: textbox "Search users...", combobox "All Roles", combobox "All Statuses"
  - Table with sortable headers/buttons: checkbox (select all), Name, Email, Role, Status, Last Login, actions column
  - Rows (page 1, 5 shown): Alice Johnson (admin, active), Bob Smith (editor, active), Carol White (viewer, inactive), David Brown (editor, active), Eve Davis (viewer, pending)
  - Row controls: per-row checkbox, per-row action/menu button
  - Footer/pagination: "Showing 1 to 5 of 12 users", previous button disabled, "Page 1 of 3", next button enabled
- **Actions**:
  - Search users
  - Filter by role/status
  - Sort by Name/Role/Status (buttons present)
  - Select rows / select all
  - Paginate results
  - Open row actions menu
- **Empty State Messages**:
  - Not observed (data present)
- **Form Validations**:
  - N/A
- **Toggle Behaviors**:
  - Checkboxes for selection
  - Pagination state changes
- **Additional UI Components**:
  - Data table, search input, combobox filters, sortable headers, pagination controls, status/role badges
- **UX Flows**:
  - User management/list administration

### Notifications
- **Route**: /notifications
- **Elements**:
  - Heading "Notifications" (h1), subtitle "Manage your alerts and preferences"
  - Button: "Mark all as read (2)"
  - Notification list items:
    - Order Shipped (New, "Your order #ORD-1234 has been shipped", 5 mins ago) — Mark as read, Dismiss
    - Low Stock Alert (New, "Wireless Headphones are running low", 1 hour ago) — Mark as read, Dismiss
    - Profile Updated ("Your profile changes have been saved", 2 hours ago) — Dismiss
    - 20% Off Sale ("Use code SAVE20 for 20% off today", 5 hours ago) — Dismiss
    - Payment Received ("Payment of $299.99 confirmed", 1 day ago) — Dismiss
  - "Notification Settings" card: Email Notifications (switch on), Push Notifications (switch on), Order Updates (switch on), Marketing (switch off)
  - "Preferences" card: "Enable Sound" button, `Duration: Always Show` button
- **Actions**:
  - Mark individual/all notifications as read
  - Dismiss notifications
  - Toggle notification setting switches
  - Change sound/duration preferences
- **Empty State Messages**:
  - Not observed (notifications present)
- **Form Validations**:
  - N/A
- **Toggle Behaviors**:
  - Switches toggle notification preferences (Email/Push/Order Updates checked, Marketing unchecked)
- **Additional UI Components**:
  - Notification feed/list, "New" badges, action buttons, switches, settings/preferences cards
- **UX Flows**:
  - Notification triage and preference management

### Settings
- **Route**: /settings
- **Elements**:
  - Heading "Settings" (h1), subtitle "Manage your account settings and preferences."
  - Tabs: Profile (default), Notifications, Appearance, Security
  - Profile tab panel: "Profile Information" — Full Name (John Doe), Email (john@example.com), Company (Acme Inc), Bio ("Software developer and coffee enthusiast."), "Save Changes" button
  - Notifications tab panel: "Notification Preferences" — Email Notifications (on), Push Notifications (on), Marketing Emails (off), Product Updates (on)
  - Appearance tab panel: "Appearance Settings" — Theme combobox (Light), Language combobox (English), Timezone combobox (UTC)
  - Security tab panel: "Security Settings" — Two-Factor Authentication (Not Enabled) with "Enable Two-Factor Authentication"; Active Sessions (3 Active) with "Manage Sessions"; "Delete Account" button
- **Actions**:
  - Switch tabs
  - Edit profile fields and save
  - Toggle notification switches
  - Change theme/language/timezone selections
  - Enable 2FA, manage sessions, delete account (destructive)
- **Empty State Messages**:
  - None observed
- **Form Validations**:
  - Not observed in exploration (Profile fields prefilled; no invalid submit tested)
- **Toggle Behaviors**:
  - Tabs switch panels and update selected state (`aria-selected` behavior implied by selected tab in snapshots)
  - Notification preference switches toggle
- **Additional UI Components**:
  - Tabs/tabpanels, text inputs/textarea, switches, combobox/selects, action buttons, destructive button
- **UX Flows**:
  - Account/settings management across profile, notifications, appearance, security

### Login
- **Route**: /login
- **Elements**:
  - Heading "Sign In" (h3), subtitle "Enter your credentials to access your account"
  - Email textbox (placeholder "name@example.com")
  - Password textbox (placeholder "Enter your password") with show/hide password icon button
  - "Forgot password?" button
  - "Remember me" switch
  - "Sign In" button
  - Demo credentials shown: Email `demo@example.com`, Password `password123`
- **Actions**:
  - Enter credentials and sign in
  - Toggle password visibility
  - Toggle "Remember me"
  - Navigate to forgot password flow
- **Empty State Messages**:
  - N/A
- **Form Validations**:
  - Email: submit empty — Error: **"Email is required"**
  - Password: submit empty — Error: **"Password is required"**
  - Invalid email format / incorrect credentials: not exercised in exploration
- **Toggle Behaviors**:
  - "Remember me" switch toggles
  - Password visibility toggle button present
- **Additional UI Components**:
  - Login form, switch, password reveal control, helper/demo credentials block
- **UX Flows**:
  - Authentication entry (login). Forgot-password and successful-login outcomes not fully traced.

### Unknown Route (404 behavior)
- **Route**: /this-route-does-not-exist
- **Elements**:
  - Sidebar/navigation still present
  - Main content area appears empty in accessibility snapshot (no visible "404"/"Not Found" message captured)
- **Actions**:
  - Navigate back via sidebar
- **Empty State Messages**:
  - No explicit 404 message observed (gap)
- **Form Validations**:
  - N/A
- **Toggle Behaviors**:
  - N/A
- **Additional UI Components**:
  - Global app shell persists
- **UX Flows**:
  - Graceful 404 handling: **not clearly evidenced**; needs verification (expected user-friendly not-found page/message)

## User Flows

### Flow 1: Global navigation
1. Load app at `/` (Dashboard).
2. Use sidebar links to navigate to Tasks, Products, Checkout, Kanban, Users, Notifications, Settings, Login.
   - Expected: URL and main heading/content update to selected page; sidebar remains visible.

### Flow 2: Authentication (login form)
1. Navigate to `/login`.
2. Submit empty form.
   - Expected: "Email is required" and "Password is required" are shown.
3. Enter demo credentials and submit (not executed).
   - Expected: Successful sign-in or clear error feedback; outcome to be verified.

### Flow 3: Task management
1. Navigate to `/tasks`.
2. Click "Add Task", review dialog fields, submit/cancel/close.
   - Expected: Dialog opens and closes correctly; valid submission creates task (creation success not verified).
3. Toggle a task checkbox.
   - Expected: Completion state/counts update.
4. Use delete action on a task.
   - Expected: Confirmation shown and delete/cancel behavior correct (confirmation not observed).

### Flow 4: Product discovery and cart
1. Navigate to `/products`.
2. Search/filter by text, category, and price range.
   - Expected: Product list updates; impossible query shows "No products found".
3. Click "Add to Cart".
   - Expected: Cart count/state updates (not verified).

### Flow 5: Checkout
1. Navigate to `/checkout`.
2. Complete Address step and click Next.
   - Expected: Proceeds to Payment, then Confirm, and order placement (full completion not verified). In exploration, empty Address advanced directly to Payment.
3. Use Back/Next between steps.
   - Expected: Step navigation preserves entered data.

### Flow 6: Settings management
1. Navigate to `/settings`.
2. Switch between Profile, Notifications, Appearance, Security tabs.
   - Expected: Correct panel content shown and active tab indicated.
3. Modify fields/toggles and save/apply actions.
   - Expected: Changes persist with appropriate feedback (not verified).

## Test Scenarios

### Scenario 1: Dashboard loads with key metrics
- **Priority**: High
- **Type**: Smoke
- **Steps**:
  1. Navigate to `/`.
  2. Verify heading "Dashboard" and sidebar navigation are visible.
  3. Verify stat cards and Recent Sales content render.
- **Expected Result**: Dashboard displays overview metrics, chart/summary values, and recent sales list.

### Scenario 2: Products search no results — EMPTY STATE
- **Priority**: Medium
- **Type**: Smoke
- **Steps**:
  1. Navigate to `/products`.
  2. Enter an impossible query (e.g. `zzzznonexistent`) in Search.
  3. Verify empty state appears.
- **Expected Result**: Empty state message **"No products found"** is visible and product cards are hidden.

### Scenario 3: Login required fields — VALIDATION
- **Priority**: High
- **Type**: Regression
- **Steps**:
  1. Navigate to `/login`.
  2. Click "Sign In" with empty Email and Password.
  3. Verify validation errors appear.
- **Expected Result**: Error messages **"Email is required"** and **"Password is required"** are shown.

### Scenario 4: Settings tabs switch — TOGGLE/INTERACTION
- **Priority**: Medium
- **Type**: Regression
- **Steps**:
  1. Navigate to `/settings`.
  2. Click "Notifications", then "Appearance", then "Security" tabs.
  3. Verify panel content and selected tab state change.
- **Expected Result**: Each tab shows its corresponding panel (Notification Preferences, Appearance Settings, Security Settings) with the active tab selected.

### Scenario 5: Price range sliders — UI COMPONENT
- **Priority**: Medium
- **Type**: Regression
- **Steps**:
  1. Navigate to `/products`.
  2. Adjust "Minimum" and/or "Maximum" price sliders.
  3. Verify price range label and/or filtered results update.
- **Expected Result**: Selected price range is reflected and product list filters accordingly.

### Scenario 6: Task create dialog and submission — FORM/DIALOG
- **Priority**: Medium
- **Type**: Regression
- **Steps**:
  1. Navigate to `/tasks`.
  2. Click "Add Task" and observe dialog fields (Title, Description, Priority).
  3. Click "Create Task" with empty Title and observe behavior.
  4. Close dialog via Cancel/Close/Escape.
- **Expected Result**: Dialog opens/closes reliably. Empty-title submission should show a clear validation error (gap: no visible error message observed; confirm expected behavior).

### Scenario 7: Notification preferences switches — TOGGLE/INTERACTION
- **Priority**: Medium
- **Type**: Regression
- **Steps**:
  1. Navigate to `/notifications`.
  2. Toggle Email/Push/Order Updates/Marketing switches in Notification Settings.
  3. Verify on/off state changes.
- **Expected Result**: Switch states update correctly and persist as designed.

### Scenario 8: Notifications mark as read / dismiss — ACTION/FEEDBACK
- **Priority**: Medium
- **Type**: Smoke
- **Steps**:
  1. Navigate to `/notifications`.
  2. Click "Mark all as read (2)" or an individual "Mark as read".
  3. Click "Dismiss" on a notification.
- **Expected Result**: Read state/count updates and dismissed notification is removed/hidden with appropriate UI feedback.

### Scenario 9: Users table filters and pagination — KEYBOARD/UX CONTROLS
- **Priority**: Medium
- **Type**: Accessibility
- **Steps**:
  1. Navigate to `/users`.
  2. Tab through search, role/status filters, table controls, and pagination buttons.
  3. Verify focus is visible and controls are operable via keyboard (Enter/Space).
  4. Use Next pagination (Page 1 of 3).
- **Expected Result**: Interactive controls are reachable and operable by keyboard; pagination advances results as indicated.

### Scenario 10: Checkout step progression — MULTI-STEP FORM
- **Priority**: High
- **Type**: Regression
- **Steps**:
  1. Navigate to `/checkout`.
  2. Review Address step fields and click "Next".
  3. Verify transition to Payment step (Name on Card, Card Number, Expiry Date, CVC).
  4. Click "Back" and verify return to Address.
- **Expected Result**: Stepper advances/returns correctly with step-specific content. (Observed: empty Address advanced to Payment; required-field validation to be confirmed.)

### Scenario 11: Unknown route handling — ERROR/EDGE CASE
- **Priority**: High
- **Type**: Regression
- **Steps**:
  1. Navigate to `/this-route-does-not-exist`.
  2. Observe main content and available recovery navigation.
- **Expected Result**: App shows a clear 404/not-found message with a way to recover. **Gap:** main content appeared empty in exploration (no explicit 404 text observed) while sidebar remained.

## Gaps and Risks
- **404 UX unclear:** unknown route rendered app shell with empty main area; no explicit not-found message observed.
- **Checkout validation unclear:** empty Address step advanced to Payment without visible errors.
- **Task create validation unclear:** empty submit showed no visible error text; confirm required-field behavior.
- **Destructive confirmations unverified:** task delete, user actions, "Delete Account" in Settings need confirmation/safety behavior checks.
- **Dynamic outcomes unverified:** login success, cart count updates, save/create/update persistence, drag-and-drop on Kanban.
- **Console errors on Dashboard:** React hydration/nesting warnings/errors observed on initial load.

## Exploration Evidence
- Screenshots: `.spectra/output/evidence/root.png`, `tasks.png`, `login.png`, `products.png`, `products-no-results.png`, `checkout.png`, `checkout-validation.png`, `kanban.png`, `users.png`, `notifications.png`, `settings.png`, `not-found.png`
- Scope: `.spectra/agents/shared/current-scope.md` (URL http://localhost:5173, full scope)
- Notes captured via Playwright MCP snapshots during exploration of all listed routes and key interactions.
