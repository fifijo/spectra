import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react"

const stats = [
  { title: "Total Revenue", value: "$45,231.89", change: "+20.1%", icon: DollarSign },
  { title: "Subscriptions", value: "+2350", change: "+180.1%", icon: Users },
  { title: "Sales", value: "+12,234", change: "+19%", icon: ShoppingCart },
  { title: "Active Now", value: "+573", change: "+201", icon: TrendingUp },
]

const recentSales = [
  { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "+$1,999.00" },
  { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "+$39.00" },
  { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: "+$299.00" },
  { name: "William Kim", email: "will@email.com", amount: "+$99.00" },
  { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "+$39.00" },
]

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="stats-grid">
        {stats.map((stat, i) => (
          <Card key={i} data-testid={`stat-card-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <Badge variant="success" className="mr-1">{stat.change}</Badge>
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overview and Recent Sales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4" data-testid="overview-card">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>January</span>
                <span>$4,500</span>
              </div>
              <Progress value={45} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>February</span>
                <span>$6,200</span>
              </div>
              <Progress value={62} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>March</span>
                <span>$8,100</span>
              </div>
              <Progress value={81} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>April</span>
                <span>$5,400</span>
              </div>
              <Progress value={54} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3" data-testid="recent-sales-card">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale, i) => (
                <div key={i} className="flex items-center" data-testid={`sale-item-${i}`}>
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">{sale.name.charAt(0)}</span>
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.name}</p>
                    <p className="text-sm text-muted-foreground">{sale.email}</p>
                  </div>
                  <div className="ml-auto font-medium">{sale.amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
