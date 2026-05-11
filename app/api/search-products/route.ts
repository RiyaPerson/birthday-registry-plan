import { generateText, Output, tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const productSchema = z.object({
  title: z.string().describe('Product name'),
  url: z.string().describe('Direct link to buy the product'),
  price_cents: z.number().nullable().describe('Price in cents, null if unknown'),
  retailer: z.string().nullable().describe('Retailer name like Amazon, Target, Best Buy'),
  image_url: z.string().nullable().describe('Product image URL'),
})

const searchResultsSchema = z.object({
  item_title: z.string().describe('A clean title for the wishlist item'),
  item_description: z.string().nullable().describe('Brief description of what the user is looking for'),
  products: z.array(productSchema).describe('Array of 3-5 product options from different retailers'),
})

export async function POST(req: Request) {
  try {
    const { query, registryId } = await req.json()

    if (!query || !registryId) {
      return Response.json({ error: 'Missing query or registryId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify registry ownership
    const { data: registry } = await supabase
      .from('registries')
      .select('id')
      .eq('id', registryId)
      .eq('user_id', user.id)
      .single()

    if (!registry) {
      return Response.json({ error: 'Registry not found' }, { status: 404 })
    }

    // Use AI to search for products
    const result = await generateText({
      model: 'openai/gpt-5-mini',
      output: Output.object({ schema: searchResultsSchema }),
      prompt: `You are a helpful shopping assistant. A user wants to add an item to their wishlist.

Their request: "${query}"

Search your knowledge to find 3-5 real product options from major retailers (Amazon, Target, Best Buy, Walmart, etc.) that match what they're looking for.

For each product, provide:
- The exact product title
- A direct URL to purchase (use real retailer URLs like amazon.com, target.com, etc.)
- The price in cents (e.g., $29.99 = 2999 cents), or null if you don't know
- The retailer name
- An image URL if you know one, otherwise null

Also provide a clean title for the wishlist item and a brief description.

Focus on finding products that best match the user's preferences for brand, price range, and features mentioned in their request.`,
    })

    const searchResults = result.output
    
    if (!searchResults) {
      return Response.json({ error: 'No results found' }, { status: 404 })
    }

    // Create the registry item
    const { data: item, error: itemError } = await supabase
      .from('registry_items')
      .insert({
        registry_id: registryId,
        title: searchResults.item_title,
        description: searchResults.item_description,
        desired_quantity: 1,
      })
      .select()
      .single()

    if (itemError || !item) {
      return Response.json({ error: 'Failed to create item' }, { status: 500 })
    }

    // Add product options
    if (searchResults.products && searchResults.products.length > 0) {
      const productOptions = searchResults.products.map((p) => ({
        item_id: item.id,
        title: p.title,
        url: p.url,
        price_cents: p.price_cents,
        retailer: p.retailer,
        image_url: p.image_url,
        currency: 'USD',
      }))

      await supabase.from('product_options').insert(productOptions)
    }

    return Response.json({ success: true, item })
  } catch (error) {
    console.error('Product search error:', error)
    return Response.json({ error: 'Search failed' }, { status: 500 })
  }
}
