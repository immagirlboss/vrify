# vrify verification

Verified October 14, 2026.

- Production Next.js Webpack build: passed. Turbopack was blocked by the local sandbox's CSS worker port binding; standard Webpack scripts are used for reliable local/Vercel builds.
- TypeScript: passed.
- Automated tests: four passing tests, including the core scripted demo, partial field preservation, bounded actions/styles/images, missing credentials, invalid request/origin, mocked Shopify HTTP and userErrors, staged upload, DRAFT status, separate variant pricing, handle reuse, and processing/failed media states.
- Desktop browser: uploaded PNG accepted and displayed in both panels; provided graphic-shirt demo photo loaded; Girls Love My Swag at $45 with quantity one generated; playful description preserved title/price; bold monochrome style updated; demo save explicitly reported no real Shopify product; draft/image/style restored after refresh.
- Mobile browser at 390px: stacked panels, document scroll width 390px; no horizontal overflow.
- Preview screenshot: vrify-preview.jpg.

Not verified against external services: live AI inference and actual Shopify product creation (credentials not supplied). Shopify error paths and success payloads were verified with mock fetch responses, not a real shop. No public Vercel deployment was made.

Hardware verification remains: microphone recognition and spoken responses, camera selection across devices, Quest browser camera permissions, and headset readability. This is a browser-panel MVP, not immersive WebXR. Typed commands and uploads are always available. Inventory remains local and Shopify's native theme is untouched.
