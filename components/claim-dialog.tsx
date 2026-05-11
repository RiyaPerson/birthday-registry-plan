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
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check, Copy } from 'lucide-react'
import type { RegistryItemWithDetails } from '@/lib/types'

function generateUnclaimCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const values = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(values)
    .map((value) => chars[value % chars.length])
    .join('')
}

interface ClaimDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: RegistryItemWithDetails
  productOptionId: string | null
  registrySlug: string
}

export function ClaimDialog({
  open,
  onOpenChange,
  item,
  productOptionId,
  registrySlug,
}: ClaimDialogProps) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unclaimCode, setUnclaimCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const router = useRouter()

  const remainingQuantity = item.desired_quantity - item.claimed_quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setFormError('')
    const code = generateUnclaimCode()

    setIsLoading(true)

    const supabase = createClient()

    const { error } = await supabase.from('gift_claims').insert({
      item_id: item.id,
      product_option_id: productOptionId,
      quantity: parseInt(quantity) || 1,
      claimer_name: name || null,
      claimer_email: null,
      unclaim_code: code,
      message: message || null,
    })

    if (!error) {
      setUnclaimCode(code)
      setIsSuccess(true)
    } else {
      setFormError('Failed to claim gift. Please try again.')
    }

    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold">Gift Claimed!</h3>
              <p className="text-muted-foreground">
                Your claim is saved. Use the code below if you need to unclaim this gift.
              </p>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3">
                <p className="text-sm text-muted-foreground">Unclaim Code</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-lg tracking-[0.2em] uppercase">
                    {unclaimCode}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(unclaimCode)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false)
                setIsSuccess(false)
                setName('')
                setMessage('')
                setQuantity('1')
                setUnclaimCode('')
                router.refresh()
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim this gift</DialogTitle>
          <DialogDescription>
            Let them know you&apos;ve got this covered (anonymously)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="claim-name">Your Name (optional)</Label>
            <Input
              id="claim-name"
              placeholder="Anonymous Gift Giver"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Hidden until after the event date
            </p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
            <p className="text-sm font-semibold">Unclaim Code</p>
            <p className="text-xs text-muted-foreground mt-1">
              After claiming, you will get a unique code. Save it so you can unclaim this gift later.
            </p>
          </div>

          {item.desired_quantity > 1 && remainingQuantity > 1 && (
            <div className="space-y-2">
              <Label htmlFor="claim-quantity">How many are you getting?</Label>
              <Input
                id="claim-quantity"
                type="number"
                min="1"
                max={remainingQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                {remainingQuantity} still needed
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="claim-message">Message (optional)</Label>
            <Textarea
              id="claim-message"
              placeholder="A note to include with your gift..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Revealed after the event
            </p>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Claiming...' : 'Confirm Claim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
