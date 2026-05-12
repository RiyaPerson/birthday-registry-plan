import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

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

    const admin = createServiceRoleClient()
    const deleteClient = admin ?? supabase

    const { error: deleteError, count } = await deleteClient
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
    if (deleted > 0) {
      return Response.json({ success: true, deletedCount: deleted })
    }

    // Anon RLS often allows SELECT + INSERT on claims but not DELETE — delete affects 0 rows with no error.
    const { data: stillThere } = await supabase
      .from('gift_claims')
      .select('id')
      .eq('item_id', itemId)
      .eq('claimer_email', normalizedEmail)
      .limit(1)

    if (stillThere && stillThere.length > 0 && !admin) {
      console.error(
        'Unclaim: matching claim exists but anon delete removed 0 rows. Set SUPABASE_SERVICE_ROLE_KEY in server env (see lib/supabase/admin.ts).'
      )
      return Response.json(
        {
          error:
            'Could not unclaim this gift. Please try again later or contact the list owner.',
        },
        { status: 503 }
      )
    }

    return Response.json(
      { error: 'No claims found with this email for this item' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Unclaim endpoint error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
