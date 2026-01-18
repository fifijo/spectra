import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import { Dashboard } from "./pages/Dashboard"
import { Tasks } from "./pages/Tasks"
import { Products } from "./pages/Products"
import { Settings } from "./pages/Settings"
import { LayoutDashboard, CheckSquare, Package, Settings as SettingsIcon } from "lucide-react"

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
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
