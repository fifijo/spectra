import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import { Dashboard } from "./pages/Dashboard"
import { Tasks } from "./pages/Tasks"
import { Products } from "./pages/Products"
import { Settings } from "./pages/Settings"
import { Login } from "./pages/Login"
import { Checkout } from "./pages/Checkout"
import { Users } from "./pages/Users"
import { Notifications } from "./pages/Notifications"
import { Kanban } from "./pages/Kanban"
import { LayoutDashboard, CheckSquare, Package, Settings as SettingsIcon, LogIn, ShoppingCart, Users as UsersIcon, Bell, Layout } from "lucide-react"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
              <span className="text-xl font-bold">TestApp</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4" data-testid="main-navigation">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-dashboard"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </NavLink>
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-tasks"
              >
                <CheckSquare className="h-5 w-5" />
                Tasks
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-products"
              >
                <Package className="h-5 w-5" />
                Products
              </NavLink>
              <NavLink
                to="/checkout"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-checkout"
              >
                <ShoppingCart className="h-5 w-5" />
                Checkout
              </NavLink>
              <NavLink
                to="/kanban"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-kanban"
              >
                <Layout className="h-5 w-5" />
                Kanban
              </NavLink>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-users"
              >
                <UsersIcon className="h-5 w-5" />
                Users
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-notifications"
              >
                <Bell className="h-5 w-5" />
                Notifications
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-settings"
              >
                <SettingsIcon className="h-5 w-5" />
                Settings
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
                data-testid="nav-login"
              >
                <LogIn className="h-5 w-5" />
                Login
              </NavLink>
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
              <p className="text-xs text-muted-foreground">
                Demo App for Spectra Testing
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/products" element={<Products />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/users" element={<Users />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App