import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { itemId, claimerEmail } = await req.json()

    if (!itemId || !claimerEmail || !String(claimerEmail).trim()) {
      return Response.json({ error: 'Missing item or email' }, { status: 400 })
    }

    const normalizedEmail = String(claimerEmail).trim().toLowerCase()
    const supabase = await createClient()

    const { data: item, error: itemError } = await supabase
      .from('registry_items')
      .select('registry_id')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      return Response.json({ error: 'Item not found' }, { status: 404 })
    }

    const { data: registry, error: registryError } = await supabase
      .from('registries')
      .select('id')
      .eq('id', item.registry_id)
      .eq('is_public', true)
      .single()

    if (registryError || !registry) {
      return Response.json({ error: 'Registry not found or not public' }, { status: 404 })
    }

    // Use count instead of .select() after delete: with RLS, deleted rows are often not
    // visible for RETURNING, so .delete().select() can return [] even when rows were removed.
    const { error: deleteError, count } = await supabase
      .from('gift_claims')
      .delete({ count: 'exact' })
      .eq('item_id', itemId)
      .eq('claimer_email', normalizedEmail)

    if (deleteError) {
      console.error('Unclaim error:', deleteError)
      return Response.json(
        { error: deleteError.message || 'Failed to unclaim' },
        { status: 500 }
      )
    }

    const deleted = count ?? 0
    if (deleted === 0) {
      return Response.json(
        { error: 'No claims found with this email for this item' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, deletedCount: deleted })
  } catch (error) {
    console.error('Unclaim endpoint error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
