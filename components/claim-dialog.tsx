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
import { Check } from 'lucide-react'
import type { RegistryItemWithDetails } from '@/lib/types'

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
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')
  const router = useRouter()

  const remainingQuantity = item.desired_quantity - item.claimed_quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!email || !email.trim()) {
      setEmailError('Email is required to claim a gift')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    const { error } = await supabase.from('gift_claims').insert({
      item_id: item.id,
      product_option_id: productOptionId,
      quantity: parseInt(quantity) || 1,
      claimer_name: name || null,
      claimer_email: email.toLowerCase(),
      message: message || null,
    })

    if (!error) {
      setIsSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setIsSuccess(false)
        setName('')
        setEmail('')
        setMessage('')
        setQuantity('1')
        router.refresh()
      }, 2000)
    } else {
      setEmailError('Failed to claim gift. Please try again.')
    }

    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Gift Claimed!</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Thank you for claiming this gift. Use your email to unclaim it later.
            </p>
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

          <div className="space-y-2">
            <Label htmlFor="claim-email">Your Email <span className="text-destructive">*</span></Label>
            <Input
              id="claim-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError('')
              }}
              required
            />
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            {!emailError && <p className="text-xs text-muted-foreground">You'll need this to unclaim the gift</p>}
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
