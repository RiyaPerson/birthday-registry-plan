import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Gift } from 'lucide-react'
import type { Registry, RegistryItem, ProductOption, GiftClaim, Profile } from '@/lib/types'
import { PublicItemCard } from '@/components/public-item-card'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: registry } = await supabase
    .from('registries')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!registry) {
    return { title: 'Registry Not Found' }
  }

  return {
    title: `${registry.title} - Wishlist`,
    description: registry.description || `View and claim gifts from ${registry.title}`,
  }
}

export default async function PublicRegistryPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  const { data: registry } = await supabase
    .from('registries')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!registry) {
    notFound()
  }

  // Get owner profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', registry.user_id)
    .single()

  // Get items with options and claims
  const { data: items } = await supabase
    .from('registry_items')
    .select('*')
    .eq('registry_id', registry.id)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  const itemIds = items?.map((i: RegistryItem) => i.id) || []

  const { data: productOptions } = await supabase
    .from('product_options')
    .select('*')
    .in('item_id', itemIds.length > 0 ? itemIds : [''])

  const { data: claims } = await supabase
    .from('gift_claims')
    .select('*')
    .in('item_id', itemIds.length > 0 ? itemIds : [''])

  const itemsWithDetails = items?.map((item: RegistryItem) => {
    const itemOptions = productOptions?.filter((o: ProductOption) => o.item_id === item.id) || []
    const itemClaims = claims?.filter((c: GiftClaim) => c.item_id === item.id) || []
    const claimedQuantity = itemClaims.reduce((sum: number, c: GiftClaim) => sum + c.quantity, 0)
    const currentUserClaimQuantity = currentUserId
      ? itemClaims.reduce((sum: number, c: GiftClaim) => c.user_id === currentUserId ? sum + c.quantity : sum, 0)
      : 0

    return {
      ...item,
      product_options: itemOptions,
      gift_claims: itemClaims,
      claimed_quantity: claimedQuantity,
      current_user_claim_quantity: currentUserClaimQuantity,
    }
  }) || []

  const eventDate = new Date(registry.event_date)
  const isUpcoming = eventDate > new Date()
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const unclaimedItems = itemsWithDetails.filter(
    (item) => item.claimed_quantity < item.desired_quantity
  )
  const claimedItems = itemsWithDetails.filter(
    (item) => item.claimed_quantity >= item.desired_quantity
  )

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
            <Gift className="h-5 w-5" />
            <span>{profile?.display_name || 'Someone'}&apos;s Wishlist</span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl text-balance">{registry.title}</h1>
          <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {isUpcoming && (
              <span className="ml-2 text-primary font-medium">
                ({daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow!' : `${daysUntil} days away`})
              </span>
            )}
          </div>
          {registry.description && (
            <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">
              {registry.description}
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {unclaimedItems.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-6">
              Available Gifts ({unclaimedItems.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unclaimedItems.map((item) => (
                <PublicItemCard
                  key={item.id}
                  item={item}
                  registrySlug={slug}
                  currentUserClaimQuantity={item.current_user_claim_quantity}
                />
              ))}
            </div>
          </section>
        )}

        {claimedItems.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-6 text-muted-foreground">
              Already Claimed ({claimedItems.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
              {claimedItems.map((item) => (
                <PublicItemCard
                  key={item.id}
                  item={item}
                  registrySlug={slug}
                  claimed
                  currentUserClaimQuantity={item.current_user_claim_quantity}
                />
              ))}
            </div>
          </section>
        )}

        {itemsWithDetails.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Gift className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No items yet</h3>
              <p className="mt-2 text-muted-foreground">
                Check back later for wishlist items!
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Create your own wishlist at{' '}
            <a href="/" className="underline underline-offset-4">
              Wishlist
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
