'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [unclaimDialogOpen, setUnclaimDialogOpen] = useState(false)
  const [unclaimEmail, setUnclaimEmail] = useState('')
  const [isUnclaiming, setIsUnclaiming] = useState(false)
  const [unclaimError, setUnclaimError] = useState('')
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

  const handleUnclaimSubmit = async () => {
    setUnclaimError('')

    if (!unclaimEmail || !unclaimEmail.trim()) {
      setUnclaimError('Please enter your email')
      setTimeout(() => setUnclaimError(''), 3000)
      return
    }

    setIsUnclaiming(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('gift_claims')
      .delete()
      .eq('item_id', item.id)
      .eq('claimer_email', unclaimEmail.toLowerCase())
      .select()

    if (!error && data && data.length > 0) {
      setUnclaimDialogOpen(false)
      setUnclaimEmail('')
      router.refresh()
    } else if (data && data.length === 0) {
      const msg = 'No claims found with this email for this item'
      setUnclaimError(msg)
      setTimeout(() => setUnclaimError(''), 3000)
    } else {
      const msg = error?.message || 'Failed to unclaim. Please try again.'
      setUnclaimError(msg)
      setTimeout(() => setUnclaimError(''), 3000)
    }

    setIsUnclaiming(false)
  }

  return (
    <>
      <Card className="!py-3 !gap-3 border-[6px] border-[rgb(232,133,176)] bg-[rgb(249,218,231)]">
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
          {isFullyClaimed && (
            <Button size="sm" variant="outline" onClick={() => setUnclaimDialogOpen(true)}>
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

      <Dialog open={unclaimDialogOpen} onOpenChange={setUnclaimDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unclaim this gift</DialogTitle>
            <DialogDescription>
              Enter the email you used to claim this gift
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unclaim-email">Email</Label>
              <Input
                id="unclaim-email"
                type="email"
                placeholder="you@example.com"
                value={unclaimEmail}
                onChange={(e) => {
                  setUnclaimEmail(e.target.value)
                  setUnclaimError('')
                }}
              />
              {unclaimError && <p className="text-xs text-destructive">{unclaimError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUnclaimDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUnclaimSubmit} disabled={isUnclaiming}>
              {isUnclaiming ? 'Unclaiming...' : 'Unclaim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
