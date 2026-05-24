import * as cheerio from "cheerio";

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    // --- Step 1: Scrape ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Referer": "https://www.google.com/",
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    let html = await response.text();
    
    // Follow Meta-Refresh
    if (html.includes('http-equiv="refresh"') && html.length < 1000) {
      const $shell = cheerio.load(html);
      const refreshContent = $shell('meta[http-equiv="refresh"]').attr('content');
      if (refreshContent && refreshContent.includes('url=')) {
        const nextUrl = refreshContent.split('url=')[1].trim();
        if (nextUrl) {
          const nextFull = nextUrl.startsWith('http') ? nextUrl : new URL(nextUrl, response.url).href;
          const nextRes = await fetch(nextFull);
          html = await nextRes.text();
        }
      }
    }

    const $ = cheerio.load(html);

    // Extraction
    const ogTitle = $('meta[property="og:title"]').attr("content") || $('title').text() || "Unknown Product";
    const ogDesc = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
    
    let ogImage = $('meta[property="og:image"]').attr("content") || 
                  $('meta[name="twitter:image"]').attr("content") || 
                  $('#landingImage').attr('src') || 
                  $('.a-dynamic-main-image').attr('src') || "";
    
    if (ogImage && ogImage.startsWith('//')) ogImage = 'https:' + ogImage;
    else if (ogImage && ogImage.startsWith('/')) ogImage = new URL(url).origin + ogImage;

    let price = 0;
    const priceText = $('.a-price-whole, .pdp-price strong, .price').first().text();
    if (priceText) {
      const match = priceText.replace(/[,₹\s]/g, '').match(/\d+(\.\d{1,2})?/);
      if (match) price = parseFloat(match[0]);
    }

    // --- Step 2: AI Refinement ---
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    let refined = { title: ogTitle, description: ogDesc, category: "Electronics", dealType: "best_offer" };

    if (OPENROUTER_API_KEY) {
      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-flash-1.5",
            messages: [{
              role: "user",
              content: `Product: "${ogTitle}"\nDesc: "${ogDesc}"\n\nReturn JSON: {"title": "catchy", "description": "2 sentence summary", "category": "one of (Electronics, Fashion, Groceries, Accessories, Home Decor, Miscellaneous)", "dealType": "loot or best_offer"}`
            }],
          })
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const jsonMatch = aiData.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
          if (jsonMatch) refined = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("AI Error:", e);
      }
    }

    res.json({
      ...refined,
      price,
      imageUrl: ogImage,
      originalLink: url
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Endpoint failed" });
  }
}
