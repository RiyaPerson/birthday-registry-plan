'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import type { RegistryItemWithDetails, ProductOption } from '@/lib/types'

interface ProductOptionsDialogProps {
  item: RegistryItemWithDetails
  isOwner: boolean
  onClaim?: () => void
}

export function ProductOptionsDialog({ item, isOwner, onClaim }: ProductOptionsDialogProps) {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShoppingBag className="mr-2 h-4 w-4" />
          {item.product_options.length} Options
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            {item.description || 'Choose where to purchase'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
          {item.product_options.map((option: ProductOption) => (
            <div
              key={option.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{option.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {option.retailer && (
                    <span className="text-xs text-muted-foreground">
                      {option.retailer}
                    </span>
                  )}
                  {option.price_cents && (
                    <span className="text-sm font-semibold">
                      {formatPrice(option.price_cents)}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={option.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Buy
                </a>
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
