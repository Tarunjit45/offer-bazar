import express from "express";
import { createServer as createViteServer } from "vite";
import * as path from "path";
import * as cheerio from "cheerio";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(cors());

  // API Route to scrape product from external URL
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`[Scraper] Starting: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
          signal: controller.signal,
          redirect: 'follow'
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`[Scraper] HTTP Error ${response.status} for ${url}`);
          return res.status(response.status).json({ error: `Failed to fetch URL: ${response.statusText}` });
        }

        const html = await response.text();
        console.log(`[Scraper] Fetched ${html.length} bytes`);
        
        const $ = cheerio.load(html);

        // Extract Title
        const ogTitle = $('meta[property="og:title"]').attr("content");
        const twitterTitle = $('meta[name="twitter:title"]').attr("content");
        const titleTag = $('title').text();
        const title = (ogTitle || twitterTitle || titleTag || "Unknown Product").trim();

        // Extract Image
        const ogImage = $('meta[property="og:image"]').attr("content");
        const twitterImage = $('meta[name="twitter:image"]').attr("content");
        const firstImg = $('article img').first().attr('src') || $('main img').first().attr('src');
        let imageUrl = ogImage || twitterImage || firstImg || "https://placehold.co/600x400/orange/white?text=No+Product+Image";

        // Fix relative URLs
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        else if (imageUrl.startsWith('/')) {
            const baseUrl = new URL(url).origin;
            imageUrl = baseUrl + imageUrl;
        }

        // Extract Price
        let price = 0;
        const priceSelectors = [
            'meta[property="product:price:amount"]',
            'meta[property="og:price:amount"]',
            'meta[name="twitter:label1"]',
            '.pdp-price strong',
            '.price',
            '[class*="price"]'
        ];

        for (const selector of priceSelectors) {
            const content = $(selector).attr('content') || $(selector).text();
            if (content) {
                const match = content.replace(/,/g, '').match(/\d+(\.\d{1,2})?/);
                if (match) {
                    price = parseFloat(match[0]);
                    if (price > 0) break;
                }
            }
        }

        console.log(`[Scraper] Success: "${title}" | Price: ${price} | Image: ${imageUrl.substring(0, 50)}...`);

        res.json({
          title: title.substring(0, 500),
          imageUrl: imageUrl.substring(0, 1000),
          price: isNaN(price) ? 0 : price,
          originalLink: url.substring(0, 1500),
        });

      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          console.error(`[Scraper] Timeout for ${url}`);
          return res.status(408).json({ error: "Scraping timed out" });
        }
        throw fetchErr;
      }

    } catch (err) {
      console.error(`[Scraper] Fatal Error:`, err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error during scraping" });
    }
  });

  // API Route to upload image to Firebase Storage (Server-side bypass for CORS)
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { base64, fileName, contentType } = req.body;
      if (!base64 || !fileName) {
        return res.status(400).json({ error: "Image data and filename are required" });
      }

      console.log(`[Upload] Processing image: ${fileName}`);

      // We use the client SDK on the server to bypass CORS
      const { initializeApp: initApp } = await import('firebase/app');
      const { getStorage: getStor, ref: storRef, uploadBytes: upBytes, getDownloadURL: getUrl } = await import('firebase/storage');
      const { getAuth: getA, signInWithEmailAndPassword: signIn } = await import('firebase/auth');
      const firebaseConfig = (await import('./firebase-applet-config.json', { assert: { type: 'json' } })).default;

      // Initialize (or get existing) app
      const serverApp = initApp(firebaseConfig, "server-upload-app");
      const serverAuth = getA(serverApp);
      const serverStorage = getStor(serverApp, `gs://${firebaseConfig.projectId}.appspot.com`);

      // Auth as admin to allow write
      await signIn(serverAuth, 'offerbazar00100@gmail.com', 'admin@000');

      // Convert base64 to Buffer
      const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
      const storageRef = storRef(serverStorage, `products/${fileName}`);

      console.log(`[Upload] Uploading to Firebase...`);
      const uploadResult = await upBytes(storageRef, buffer, { contentType: contentType || 'image/jpeg' });
      const downloadUrl = await getUrl(uploadResult.ref);

      console.log(`[Upload] Success! URL: ${downloadUrl.substring(0, 50)}...`);
      res.json({ imageUrl: downloadUrl });

    } catch (err: any) {
      console.error(`[Upload] Fatal Error:`, err);
      res.status(500).json({ error: err.message || "Failed to upload image from server" });
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
