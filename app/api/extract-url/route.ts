import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Fetch the URL and extract metadata
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WishlistBot/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
    }

    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    // Extract Open Graph image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const ogImage = ogImageMatch ? ogImageMatch[1] : null

    // Extract Twitter image as fallback
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const twitterImage = twitterImageMatch ? twitterImageMatch[1] : null

    // Extract regular meta image as fallback
    const metaImageMatch = html.match(/<meta[^>]*name=["']image["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const metaImage = metaImageMatch ? metaImageMatch[1] : null

    // Extract price using common patterns
    const pricePatterns = [
      /\$([0-9,]+\.[0-9]{2})/g,  // $29.99
      /price["\s:]+([0-9,]+\.[0-9]{2})/gi,  // price: 29.99
      /data-price=["']([0-9,]+\.[0-9]{2})["']/gi,  // data-price="29.99"
    ]

    let price = null
    for (const pattern of pricePatterns) {
      const match = html.match(pattern)
      if (match) {
        // Extract the first price found
        const priceStr = match[0].replace(/[^0-9.]/g, '')
        const priceNum = parseFloat(priceStr)
        if (!isNaN(priceNum)) {
          price = Math.round(priceNum * 100) // Convert to cents
          break
        }
      }
    }

    // Use the best available image
    const imageUrl = ogImage || twitterImage || metaImage

    return NextResponse.json({
      title: title || null,
      image_url: imageUrl,
      price_cents: price,
    })
  } catch (error) {
    console.error('URL metadata extraction error:', error)
    return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 })
  }
}