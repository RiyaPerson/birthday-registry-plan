import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gift } from 'lucide-react'
import Link from 'next/link'

export default function RegistryNotFound() {
  return (
    <div className="min-h-svh bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Gift className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Wishlist Not Found</CardTitle>
          <CardDescription>
            This wishlist doesn&apos;t exist or has been made private.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            The link may be incorrect, or the wishlist owner may have removed it.
          </p>
          <Button asChild>
            <Link href="/">Create Your Own Wishlist</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
