import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gift } from 'lucide-react'
import Link from 'next/link'

export default function RegistryNotFound() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Gift className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">Wishlist Not Found</CardTitle>
        <CardDescription>
          This wishlist doesn&apos;t exist or you don&apos;t have access to it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
