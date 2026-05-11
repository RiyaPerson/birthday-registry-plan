import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Copy, Plus, Settings, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { Registry, RegistryItem, ProductOption, GiftClaim } from '@/lib/types'
import { ItemCard } from '@/components/item-card'
import { AddItemDialog } from '@/components/add-item-dialog'
import { ShareButton } from '@/components/share-button'
import { RegistrySettings } from '@/components/registry-settings'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RegistryDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: registry } = await supabase
    .from('registries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!registry) {
    notFound()
  }

  const { data: items } = await supabase
    .from('registry_items')
    .select('*')
    .eq('registry_id', id)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  // Get product options and claims for each item
  const itemIds = items?.map((i: RegistryItem) => i.id) || []
  
  const { data: productOptions } = await supabase
    .from('product_options')
    .select('*')
    .in('item_id', itemIds.length > 0 ? itemIds : [''])

  const { data: claims } = await supabase
    .from('gift_claims')
    .select('*')
    .in('item_id', itemIds.length > 0 ? itemIds : [''])

  // Combine data
  const itemsWithDetails = items?.map((item: RegistryItem) => {
    const itemOptions = productOptions?.filter((o: ProductOption) => o.item_id === item.id) || []
    const itemClaims = claims?.filter((c: GiftClaim) => c.item_id === item.id) || []
    const claimedQuantity = itemClaims.reduce((sum: number, c: GiftClaim) => sum + c.quantity, 0)
    return {
      ...item,
      product_options: itemOptions,
      gift_claims: itemClaims,
      claimed_quantity: claimedQuantity,
    }
  }) || []

  const eventDate = new Date(registry.event_date)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{registry.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <ShareButton slug={registry.slug} />
          <RegistrySettings registry={registry} />
        </div>
      </div>

      {registry.description && (
        <Card className="mb-8">
          <CardContent className="py-4">
            <p className="text-muted-foreground">{registry.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Items ({itemsWithDetails.length})</h2>
        <AddItemDialog registryId={id} />
      </div>

      {itemsWithDetails.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itemsWithDetails.map((item) => (
            <ItemCard key={item.id} item={item} isOwner={true} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Plus className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No items yet</h3>
            <p className="mt-2 text-muted-foreground text-center">
              Start adding items to your wishlist
            </p>
            <AddItemDialog registryId={id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
