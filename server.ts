import express from "express";
import { createServer as createViteServer } from "vite";
import * as path from "path";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to scrape product from external URL
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`Scraping URL: ${url}`);
      
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout for server-side fetch

      const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        signal: controller.signal
      });
      clearTimeout(id);

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch URL" });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract basic OG metadata
      const ogTitle = $('meta[property="og:title"]').attr("content");
      const ogImage = $('meta[property="og:image"]').attr("content");
      const titleTag = $('title').text();
      
      // Attempt to extract some price - looking for standard schema markup or meta tags
      let price = 0;
      const priceMeta = $('meta[property="product:price:amount"]').attr("content") || $('meta[name="twitter:data1"]').attr("content");
      
      if (priceMeta) {
          price = parseFloat(priceMeta.replace(/[^0-9.]/g, ""));
      } else {
          // Fallback, try to find an element with "price" class or id
          const tempPrice = $('[class*="price"]').first().text();
          if (tempPrice) {
            const match = tempPrice.match(/\d+(\.\d{1,2})?/);
            if (match) price = parseFloat(match[0]);
          }
      }

      const title = ogTitle || titleTag || "Unknown Product";
      const imageUrl = ogImage || "https://placehold.co/400x400/png?text=No+Image";

      res.json({
        title: title.trim().substring(0, 500),
        imageUrl: imageUrl.substring(0, 1000),
        price: isNaN(price) ? 0 : price,
        originalLink: url.substring(0, 1500),
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
