'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExternalLink, MoreVertical, Trash2, Check, Gift } from 'lucide-react'
import type { RegistryItemWithDetails } from '@/lib/types'
import { ProductOptionsDialog } from '@/components/product-options-dialog'

interface ItemCardProps {
  item: RegistryItemWithDetails
  isOwner: boolean
  onClaim?: () => void
}

export function ItemCard({ item, isOwner, onClaim }: ItemCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const remainingQuantity = item.desired_quantity - item.claimed_quantity
  const isFullyClaimed = remainingQuantity <= 0

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()
    await supabase.from('registry_items').delete().eq('id', item.id)
    router.refresh()
  }

  const lowestPrice = item.product_options.length > 0
    ? Math.min(...item.product_options.filter(o => o.price_cents).map(o => o.price_cents!))
    : null

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  return (
    <Card className={isFullyClaimed ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {item.image_url && (
              <div className="mb-3">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-32 object-cover rounded-md"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {item.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {item.desired_quantity > 1 && (
            <Badge variant="secondary">
              {item.claimed_quantity}/{item.desired_quantity} claimed
            </Badge>
          )}
          {isFullyClaimed && (
            <Badge variant="default" className="bg-green-600">
              <Check className="mr-1 h-3 w-3" />
              Claimed
            </Badge>
          )}
          {lowestPrice && (
            <Badge variant="outline">
              From {formatPrice(lowestPrice)}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {item.custom_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={item.custom_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </a>
          </Button>
        )}
        {item.product_options.length > 0 && (
          <ProductOptionsDialog 
            item={item} 
            isOwner={isOwner}
            onClaim={onClaim}
          />
        )}
        {!isOwner && !isFullyClaimed && !item.custom_url && item.product_options.length === 0 && (
          <Button size="sm" onClick={onClaim}>
            <Gift className="mr-2 h-4 w-4" />
            Claim
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
