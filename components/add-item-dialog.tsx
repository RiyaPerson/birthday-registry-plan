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
  const router = useRouter()

  const handleAddManual = async () => {
    setIsLoading(true)
    const supabase = createClient()

    let itemData: any = {
      registry_id: registryId,
      title,
      description: description || null,
      desired_quantity: parseInt(quantity) || 1,
      custom_url: customUrl || null,
    }

    // Extract metadata from URL if provided
    if (customUrl) {
      try {
        const response = await fetch('/api/extract-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: customUrl }),
        })

        if (response.ok) {
          const metadata = await response.json()
          if (metadata.title && !title) {
            itemData.title = metadata.title
          }
          if (metadata.image_url) {
            itemData.image_url = metadata.image_url
          }
          // Note: Price extraction for custom URLs could be added here if needed
        }
      } catch (error) {
        console.error('Failed to extract URL metadata:', error)
      }
    }

    const { error } = await supabase.from('registry_items').insert(itemData)

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
        resetForm()
        setOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Search failed:', error)
    }

    setIsSearching(false)
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
