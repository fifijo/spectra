import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, MoreHorizontal, Mail, User as UserIcon, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  id: number
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  status: "active" | "inactive" | "pending"
  lastLogin: string
}

const allUsers: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@acme.com", role: "admin", status: "active", lastLogin: "2 hours ago" },
  { id: 2, name: "Bob Smith", email: "bob@acme.com", role: "editor", status: "active", lastLogin: "1 day ago" },
  { id: 3, name: "Carol White", email: "carol@acme.com", role: "viewer", status: "inactive", lastLogin: "5 days ago" },
  { id: 4, name: "David Brown", email: "david@acme.com", role: "editor", status: "active", lastLogin: "3 hours ago" },
  { id: 5, name: "Eve Davis", email: "eve@acme.com", role: "viewer", status: "pending", lastLogin: "Never" },
  { id: 6, name: "Frank Miller", email: "frank@acme.com", role: "admin", status: "active", lastLogin: "30 mins ago" },
  { id: 7, name: "Grace Wilson", email: "grace@acme.com", role: "editor", status: "active", lastLogin: "2 days ago" },
  { id: 8, name: "Henry Taylor", email: "henry@acme.com", role: "viewer", status: "inactive", lastLogin: "1 week ago" },
  { id: 9, name: "Ivy Anderson", email: "ivy@acme.com", role: "editor", status: "active", lastLogin: "4 hours ago" },
  { id: 10, name: "Jack Thomas", email: "jack@acme.com", role: "viewer", status: "active", lastLogin: "6 hours ago" },
  { id: 11, name: "Kate Martinez", email: "kate@acme.com", role: "admin", status: "pending", lastLogin: "Never" },
  { id: 12, name: "Leo Garcia", email: "leo@acme.com", role: "viewer", status: "active", lastLogin: "1 hour ago" },
]

const ROLES = ["admin", "editor", "viewer"] as const
const STATUSES = ["active", "inactive", "pending"] as const
const ITEMS_PER_PAGE = 5

export function Users() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof User>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  const toggleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    const direction = sortDirection === "asc" ? 1 : -1
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * direction
    }
    return ((aVal as number) - (bVal as number)) * direction
  })

  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id))
    }
  }

  const toggleSelectUser = (id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    )
  }

  const statusColors = {
    active: "success",
    inactive: "secondary",
    pending: "warning",
  } as const

  const roleIcons = {
    admin: Shield,
    editor: Mail,
    viewer: UserIcon,
  } as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage your team members</p>
      </div>

      <Card data-testid="users-toolbar">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                data-testid="search-users-input"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]" data-testid="role-filter-select">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map(role => (
                  <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]" data-testid="status-filter-select">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted" data-testid="bulk-actions">
          <span className="text-sm font-medium">{selectedUsers.length} selected</span>
          <Button variant="outline" size="sm" data-testid="bulk-delete-button">Delete Selected</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>Clear</Button>
        </div>
      )}

      <Card data-testid="users-table-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 w-10">
                    <Checkbox
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="select-all-checkbox"
                    />
                  </th>
                  <th className="p-4 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("name")}
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      data-testid="sort-by-name"
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("role")}
                      className="-ml-3 h-8"
                      data-testid="sort-by-role"
                    >
                      Role
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-4 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort("status")}
                      className="-ml-3 h-8"
                      data-testid="sort-by-status"
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-4 text-left">Last Login</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50" data-testid={`user-row-${user.id}`}>
                    <td className="p-4">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                        data-testid={`select-user-${user.id}`}
                      />
                    </td>
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {(() => {
                          const Icon = roleIcons[user.role]
                          return <Icon className="h-3 w-3" />
                        })()}
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[user.status]}>{user.status}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{user.lastLogin}</td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`user-menu-${user.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem data-testid={`edit-user-${user.id}`}>Edit</DropdownMenuItem>
                          <DropdownMenuItem data-testid={`view-user-${user.id}`}>View</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" data-testid={`delete-user-${user.id}`}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between" data-testid="pagination">
          <span className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, sortedUsers.length)} of {sortedUsers.length} users
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              data-testid="prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm" data-testid="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              data-testid="next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}