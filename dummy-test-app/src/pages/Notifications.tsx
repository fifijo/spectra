import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, Check, AlertTriangle, Info, ShoppingCart, Heart, MessageSquare, Star, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Notification {
  id: number
  type: "info" | "warning" | "success" | "order" | "promo"
  title: string
  message: string
  time: string
  read: boolean
}

const initialNotifications: Notification[] = [
  { id: 1, type: "order", title: "Order Shipped", message: "Your order #ORD-1234 has been shipped", time: "5 mins ago", read: false },
  { id: 2, type: "warning", title: "Low Stock Alert", message: "Wireless Headphones are running low", time: "1 hour ago", read: false },
  { id: 3, type: "info", title: "Profile Updated", message: "Your profile changes have been saved", time: "2 hours ago", read: true },
  { id: 4, type: "promo", title: "20% Off Sale", message: "Use code SAVE20 for 20% off today", time: "5 hours ago", read: true },
  { id: 5, type: "success", title: "Payment Received", message: "Payment of $299.99 confirmed", time: "1 day ago", read: true },
]

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: Check,
  order: ShoppingCart,
  promo: Star,
}

const typeColors = {
  info: "bg-blue-100 text-blue-600",
  warning: "bg-yellow-100 text-yellow-600",
  success: "bg-green-100 text-green-600",
  order: "bg-purple-100 text-purple-600",
  promo: "bg-pink-100 text-pink-600",
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    orders: true,
    marketing: false,
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const dismissNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Manage your alerts and preferences</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} data-testid="mark-all-read-button">
            <Check className="mr-2 h-4 w-4" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4" data-testid="notifications-list">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = typeIcons[notification.type]
              return (
                <Card
                  key={notification.id}
                  className={notification.read ? "opacity-60" : ""}
                  data-testid={`notification-${notification.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${typeColors[notification.type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                          </div>
                          {!notification.read && (
                            <Badge variant="default" className="shrink-0">New</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-primary hover:underline"
                              data-testid={`mark-read-${notification.id}`}
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="text-xs text-destructive hover:underline"
                            data-testid={`dismiss-${notification.id}`}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <Card data-testid="notification-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Notification Settings
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive via email</p>
                </div>
                <Switch
                  checked={settings.email}
                  onCheckedChange={(checked) => setSettings({ ...settings, email: checked })}
                  data-testid="email-notifications-toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch
                  checked={settings.push}
                  onCheckedChange={(checked) => setSettings({ ...settings, push: checked })}
                  data-testid="push-notifications-toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Order Updates</Label>
                  <p className="text-sm text-muted-foreground">Shipment and delivery alerts</p>
                </div>
                <Switch
                  checked={settings.orders}
                  onCheckedChange={(checked) => setSettings({ ...settings, orders: checked })}
                  data-testid="orders-notifications-toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing</Label>
                  <p className="text-sm text-muted-foreground">Promotions and deals</p>
                </div>
                <Switch
                  checked={settings.marketing}
                  onCheckedChange={(checked) => setSettings({ ...settings, marketing: checked })}
                  data-testid="marketing-notifications-toggle"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" data-testid="notification-sound-toggle">
                Enable Sound
              </Button>
              <Button variant="outline" className="w-full" data-testid="notification-duration-select">
                Duration: Always Show
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}