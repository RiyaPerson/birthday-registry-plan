'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Check, Gift } from 'lucide-react'
import type { RegistryItemWithDetails } from '@/lib/types'
import { ClaimDialog } from '@/components/claim-dialog'
import { PublicProductOptions } from '@/components/public-product-options'

interface PublicItemCardProps {
  item: RegistryItemWithDetails
  registrySlug: string
  claimed?: boolean
}

export function PublicItemCard({ item, registrySlug, claimed }: PublicItemCardProps) {
  const router = useRouter()
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [isUnclaiming, setIsUnclaiming] = useState(false)
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

  const handleUnclaim = async () => {
    setIsUnclaiming(true)
    const supabase = createClient()
    await supabase.from('gift_claims').delete().eq('item_id', item.id)
    setIsUnclaiming(false)
    router.refresh()
  }

  return (
    <>
      <Card className="!py-3 !gap-3 border-2 border-[rgb(232,133,176)] bg-[rgb(249,218,231)]">
        <CardHeader className="pb-2 px-3">
          <CardTitle className="text-base leading-snug line-clamp-2">{item.title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          {item.description && (
            <p className="text-sm text-muted-foreground mb-2 leading-normal">
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
        <CardFooter className="flex gap-1 flex-wrap items-center px-3">
          {item.custom_url && (
            <Button variant="outline" size="sm" asChild className="opacity-100">
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
          {claimed && (
            <Button size="sm" variant="outline" onClick={handleUnclaim} disabled={isUnclaiming}>
              Unclaim
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
