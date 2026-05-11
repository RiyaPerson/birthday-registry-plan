'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Link as LinkIcon, Sparkles, Loader2 } from 'lucide-react'

interface AddItemDialogProps {
  registryId: string
}

export function AddItemDialog({ registryId }: AddItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [customUrl, setCustomUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const router = useRouter()

  const handleAddManual = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from('registry_items').insert({
      registry_id: registryId,
      title,
      description: description || null,
      desired_quantity: parseInt(quantity) || 1,
      custom_url: customUrl || null,
    })

    if (!error) {
      resetForm()
      setOpen(false)
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)

    try {
      const response = await fetch('/api/search-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          registryId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    }

    setIsSearching(false)
  }

  const handleSelectProduct = async (product: any) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Create the registry item
      const { data: item, error: itemError } = await supabase
        .from('registry_items')
        .insert({
          registry_id: registryId,
          title: product.title,
          description: product.description || null,
          desired_quantity: 1,
        })
        .select()
        .single()

      if (itemError || !item) {
        console.error('Failed to create item')
        setIsLoading(false)
        return
      }

      // Add product option
      if (product.products && product.products.length > 0) {
        const productOptions = product.products.map((p: any) => ({
          item_id: item.id,
          title: p.title,
          url: p.url,
          price_cents: p.price_cents,
          retailer: p.retailer,
          image_url: p.image_url,
          currency: 'USD',
        }))

        await supabase.from('product_options').insert(productOptions)
      }

      resetForm()
      setSearchResults(null)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to add item:', error)
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setQuantity('1')
    setCustomUrl('')
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an item</DialogTitle>
          <DialogDescription>
            Add your own link or let AI find options for you
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <LinkIcon className="mr-2 h-4 w-4" />
              My Link
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Search
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Item Name</Label>
              <Input
                id="title"
                placeholder="e.g., Sony WH-1000XM5 Headphones"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customUrl">Link (optional)</Label>
              <Input
                id="customUrl"
                type="url"
                placeholder="https://amazon.com/..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Notes (optional)</Label>
              <Textarea
                id="description"
                placeholder="Size, color, or other preferences..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20"
              />
            </div>
            <Button 
              onClick={handleAddManual} 
              disabled={!title || isLoading}
              className="w-full"
            >
              {isLoading ? 'Adding...' : 'Add Item'}
            </Button>
          </TabsContent>
          <TabsContent value="ai" className="space-y-4 mt-4">
            {searchResults ? (
              <>
                <div className="mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSearchResults(null)}
                  >
                    ← New Search
                  </Button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Select a product to add:
                  </p>
                  {searchResults.products?.map((product: any, idx: number) => {
                    const price = product.price_cents 
                      ? `$${(product.price_cents / 100).toFixed(2)}`
                      : 'Price not available'
                    return (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSelectProduct({ ...searchResults, products: [product] })}
                      >
                        <p className="font-medium text-sm line-clamp-2">{product.title}</p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {product.retailer || 'Online'}
                          </p>
                          <p className="text-sm font-semibold">{price}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="searchQuery">What are you looking for?</Label>
                  <Textarea
                    id="searchQuery"
                    placeholder="e.g., Wireless noise-cancelling headphones under $400, preferably Sony or Bose..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    rows={3}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Our AI will search online retailers to find matching products with prices and links.
                </p>
                <Button 
                  onClick={handleAISearch} 
                  disabled={!searchQuery.trim() || isSearching}
                  className="w-full"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Find Products
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
