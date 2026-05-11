'use client'

import { useState } from 'react'
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
import { Copy, Check, Share2 } from 'lucide-react'

interface ShareButtonProps {
  slug: string
}

export function ShareButton({ slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/r/${slug}`
    : `/r/${slug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your wishlist</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your wishlist and claim gifts
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input value={shareUrl} readOnly className="font-mono text-sm" />
          <Button onClick={handleCopy} variant="outline" size="icon">
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
