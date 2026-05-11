'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Check, Gift, ShoppingBag } from 'lucide-react'
import type { RegistryItemWithDetails } from '@/lib/types'
import { ClaimDialog } from '@/components/claim-dialog'
import { PublicProductOptions } from '@/components/public-product-options'

interface PublicItemCardProps {
  item: RegistryItemWithDetails
  registrySlug: string
  claimed?: boolean
}

export function PublicItemCard({ item, registrySlug, claimed }: PublicItemCardProps) {
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const remainingQuantity = item.desired_quantity - item.claimed_quantity
  const isFullyClaimed = remainingQuantity <= 0

  const lowestPrice = item.product_options.length > 0
    ? Math.min(...item.product_options.filter(o => o.price_cents).map(o => o.price_cents!))
    : null

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const handleClaimClick = (productOptionId?: string) => {
    setSelectedProductId(productOptionId || null)
    setClaimDialogOpen(true)
  }

  return (
    <>
      <Card className={claimed ? 'opacity-60' : ''}>
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
                {remainingQuantity} of {item.desired_quantity} left
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
        <CardFooter className="flex gap-2 flex-wrap">
          {item.custom_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={item.custom_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </a>
            </Button>
          )}
          {item.product_options.length > 0 && (
            <PublicProductOptions 
              item={item}
              onClaim={handleClaimClick}
              disabled={isFullyClaimed}
            />
          )}
          {!isFullyClaimed && (
            <Button 
              size="sm" 
              onClick={() => handleClaimClick()}
              variant={item.product_options.length > 0 ? 'outline' : 'default'}
            >
              <Gift className="mr-2 h-4 w-4" />
              Claim
            </Button>
          )}
        </CardFooter>
      </Card>

      <ClaimDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        item={item}
        productOptionId={selectedProductId}
        registrySlug={registrySlug}
      />
    </>
  )
}
