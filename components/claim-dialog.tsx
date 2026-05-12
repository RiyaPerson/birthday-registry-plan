'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Check } from 'lucide-react'
import type { RegistryItemWithDetails } from '@/lib/types'

interface ClaimDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: RegistryItemWithDetails
  productOptionId: string | null
}

export function ClaimDialog({
  open,
  onOpenChange,
  item,
  productOptionId,
}: ClaimDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const router = useRouter()

  const remainingQuantity = item.desired_quantity - item.claimed_quantity

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) {
      setName('')
      setEmail('')
      setMessage('')
      setQuantity('1')
      setFormError('')
      setIsSuccess(false)
    }
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setFormError('')

    if (!email || !email.trim()) {
      setFormError('Email is required to claim a gift')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/claim-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          productOptionId,
          quantity: parseInt(quantity) || 1,
          claimerName: name || null,
          claimerEmail: email.trim().toLowerCase(),
          message: message || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFormError(data?.error || 'Failed to claim gift. Please try again.')
      } else if (data?.success) {
        setIsSuccess(true)
      } else {
        setFormError('Failed to claim gift. Please try again.')
      }
    } catch (error) {
      console.error('Claim error:', error)
      setFormError('Failed to claim gift. Please try again.')
    }

    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold">Gift claimed!</h3>
              <p className="text-muted-foreground text-sm">
                To change your mind later, use Unclaim on this list and enter the same email you used here.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                handleDialogOpenChange(false)
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
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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

          <div className="space-y-2">
            <Label htmlFor="claim-email">Your Email <span className="text-destructive">*</span></Label>
            <Input
              id="claim-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setFormError('')
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use the same email if you unclaim this gift from this page later.
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
            <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
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
