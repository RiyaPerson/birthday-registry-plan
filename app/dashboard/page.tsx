import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, ExternalLink, Gift } from 'lucide-react'
import Link from 'next/link'
import type { Registry } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: registries } = await supabase
    .from('registries')
    .select('*')
    .eq('user_id', user!.id)
    .order('event_date', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Wishlists</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your wishlists
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="mr-2 h-4 w-4" />
            New Wishlist
          </Link>
        </Button>
      </div>

      {registries && registries.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registries.map((registry: Registry) => (
            <RegistryCard key={registry.id} registry={registry} />
          ))}
        </div>
      ) : (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Gift className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No wishlists yet</h3>
            <p className="mt-2 text-muted-foreground text-center">
              Create your first wishlist and start adding items!
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Wishlist
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RegistryCard({ registry }: { registry: Registry }) {
  const eventDate = new Date(registry.event_date)
  const isUpcoming = eventDate > new Date()
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Link href={`/dashboard/${registry.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="line-clamp-1">{registry.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {eventDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registry.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {registry.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            {isUpcoming ? (
              <span className="text-sm font-medium text-primary">
                {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow!' : `${daysUntil} days away`}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Past event</span>
            )}
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
