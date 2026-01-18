import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Search, ShoppingCart, Star } from "lucide-react"

const products = [
  { id: 1, name: "Wireless Headphones", price: 199.99, category: "electronics", rating: 4.5, stock: 50, image: "🎧" },
  { id: 2, name: "Smart Watch", price: 299.99, category: "electronics", rating: 4.8, stock: 30, image: "⌚" },
  { id: 3, name: "Running Shoes", price: 129.99, category: "sports", rating: 4.3, stock: 100, image: "👟" },
  { id: 4, name: "Coffee Maker", price: 89.99, category: "home", rating: 4.6, stock: 25, image: "☕" },
  { id: 5, name: "Backpack", price: 79.99, category: "accessories", rating: 4.4, stock: 75, image: "🎒" },
  { id: 6, name: "Desk Lamp", price: 49.99, category: "home", rating: 4.2, stock: 60, image: "💡" },
  { id: 7, name: "Yoga Mat", price: 39.99, category: "sports", rating: 4.7, stock: 120, image: "🧘" },
  { id: 8, name: "Bluetooth Speaker", price: 149.99, category: "electronics", rating: 4.5, stock: 40, image: "🔊" },
]

export function Products() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 300])
  const [cart, setCart] = useState<number[]>([])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || product.category === category
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
    return matchesSearch && matchesCategory && matchesPrice
  })

  const addToCart = (productId: number) => {
    setCart([...cart, productId])
  }

  const isInCart = (productId: number) => cart.includes(productId)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Browse our collection of products.</p>
        </div>
        <Button variant="outline" data-testid="cart-button">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart ({cart.length})
        </Button>
      </div>

      {/* Filters */}
      <Card data-testid="filters-card">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search products..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
              <Slider
                min={0}
                max={300}
                step={10}
                value={priceRange}
                onValueChange={setPriceRange}
                data-testid="price-slider"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="products-grid">
        {filteredProducts.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">No products found</p>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} data-testid={`product-card-${product.id}`}>
              <CardHeader>
                <div className="text-6xl text-center mb-2">{product.image}</div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">${product.price}</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm">{product.rating}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">{product.category}</Badge>
                  <Badge variant={product.stock > 50 ? "success" : "warning"}>
                    {product.stock} in stock
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isInCart(product.id) ? "secondary" : "default"}
                  onClick={() => addToCart(product.id)}
                  disabled={isInCart(product.id)}
                  data-testid={`add-to-cart-${product.id}`}
                >
                  {isInCart(product.id) ? "Added to Cart" : "Add to Cart"}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
