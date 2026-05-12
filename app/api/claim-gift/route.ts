import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { itemId, productOptionId, quantity, claimerName, claimerEmail, message } = await req.json()

    if (!itemId || !quantity) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!claimerEmail) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the item exists and belongs to a public registry
    const { data: item, error: itemError } = await supabase
      .from('registry_items')
      .select('registry_id')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      return Response.json({ error: 'Item not found' }, { status: 404 })
    }

    // Verify the registry is public
    const { data: registry, error: registryError } = await supabase
      .from('registries')
      .select('id')
      .eq('id', item.registry_id)
      .eq('is_public', true)
      .single()

    if (registryError || !registry) {
      return Response.json({ error: 'Registry not found or not public' }, { status: 404 })
    }

    const { error: claimError } = await supabase.from('gift_claims').insert({
      item_id: itemId,
      product_option_id: productOptionId || null,
      quantity,
      claimer_name: claimerName || null,
      claimer_email: claimerEmail.trim().toLowerCase(),
      unclaim_code: null,
      message: message || null,
    })

    if (claimError) {
      console.error('Claim error:', claimError)
      return Response.json(
        { error: claimError?.message || 'Failed to create claim' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Claim endpoint error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
