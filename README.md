# vrify

Create with your hands. Run your shop with your voice.

A Next.js App Router + TypeScript + Tailwind hackathon prototype. One workspace: photograph an item, describe it, edit a product draft, change a fixed storefront preview, and save a Shopify **DRAFT** with the actual image and variant price.

## Run

Node 20.9+ (Node 24 recommended).

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Without credentials, AI uses a labeled deterministic demo interpreter and Shopify save only reports a browser-local demo. No simulated Shopify admin links or success. Use demo photo → first example → playful example → storefront example → demo save. The fallback demo uses the provided graphic-shirt photo, stored locally in public/demo-shirt.jpeg. Its listing makes no material, size, or handmade claims.

## Live integrations

Set `AI_GATEWAY_API_KEY` server-side. `AI_MODEL` defaults to `openai/gpt-4.1`, currently listed by Gateway with image inputs. Uses AI SDK `generateObject`, Gateway provider, and Zod validation. Photos are product data; the model never generates replacement art. Hands-free mode uses browser speech recognition when supported, or AI Gateway transcription with `AI_TRANSCRIPTION_MODEL` (default `openai/whisper-1`). Unsupported devices without a Gateway key retain typed and gaze controls.

Configure one Shopify test store:

- `SHOPIFY_STORE_DOMAIN`: bare `your-store.myshopify.com`, no URL prefix.
- `SHOPIFY_ADMIN_ACCESS_TOKEN`: Admin API token with **read_products, write_products**. The staff/app must be allowed to create products. Shopify staged product media uploads use `write_products`; this app does not use the separate Files API.
- `SHOPIFY_API_VERSION`: defaults to documented stable `2026-07`.

The connection indicator makes a real read request. Product currency must match the store currency; choose it in Review product details. Staged upload uses the original photo normalized to JPEG (no artwork reinterpretation), then `productCreate` explicitly uses `DRAFT`, and `productVariantsBulkUpdate` sets the initial variant price. API GraphQL errors, mutation userErrors, upload failures, and media processing states are checked. A pending image is not shown as Saved; click Check image processing. Quantity stays local: **inventory is not synced**, no inventory/location scopes are requested. The storefront preview only lives in this app; Shopify theme is untouched.

The save button and command path share a client lock. A persistent draft UUID, a deterministic Shopify handle lookup, and a per-process server lock prevent normal repeated voice commands/retries from creating another item. After saving, edits are locked; New item creates a fresh UUID. This is not distributed transactional idempotency: simultaneous requests to different server instances or a Shopify search-index delay after an ambiguous network failure can still race. After a timeout, inspect Shopify before retrying; reuse the same draft. No database is used.

## Vercel

Import this repository into Vercel; choose Next.js, keep standard `npm run build`, and add server environment variables from `.env.example` (never `NEXT_PUBLIC_` secrets). Redeploy after changes. Use Vercel Deployment Protection for a private demo: this intentionally has no app authentication, so any visitor to an unprotected deployment can call the configured AI/store routes. Same-origin checks are included but are not authentication.

## Devices and persistence

Camera capture uses `getUserMedia` on HTTPS or localhost; permission or hardware failures give an upload fallback. Camera selection appears when multiple cameras are detected. Browser SpeechRecognition is checked at runtime, uses short user-started sessions, and can invoke capture, edit, and save commands. Optional speechSynthesis reads short responses. Recognition may depend on the browser's speech service. Hands-free mode needs an initial microphone activation/permission gesture, then listens for “vrify” followed by a command and automatically resumes between commands. Say “vrify stop listening” to stop. Camera permissions, real camera capture, speech input/output, and Quest behavior need hardware testing.

Quest support includes a responsive headset browser mode and an optional immersive WebXR workspace using Three.js. The app checks immersive-vr support at runtime. Enter VR requires a user gesture. The immersive workspace mirrors the draft, photo, and assistant response; controller triggers or 1.8-second gaze dwell invoke camera, capture, voice, and save actions. Actual headset behavior still needs hardware testing. Passthrough visibility does not guarantee raw camera access. Upload and typed controls remain available. No tracking, reconstruction, checkout, or payments.

Draft, normalized image, style, save identity, and verified save result persist in localStorage; secrets do not. Large photos are resized to 1400px, keeping the source artwork. Storage quota failures are shown. Local browser storage is not a backup.

## Verification

```sh
npm run test
npm run typecheck
npm run build
```

Tests cover core demo parsing, preservation of product fields, bounded style tokens, and action/image validation. API/browser verification covers upload, edits, style changes, missing credentials, and errors. Live AI inference and actual Shopify creation require configured test credentials.

Documentation used: [Gateway GPT-4.1](https://vercel.com/ai-gateway/models/gpt-4.1), [AI SDK generateObject](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object), [Shopify productCreate](https://shopify.dev/docs/api/admin-graphql/2026-07/mutations/productCreate), [stagedUploadsCreate](https://shopify.dev/docs/api/admin-graphql/2026-07/mutations/stagedUploadsCreate), [productVariantsBulkUpdate](https://shopify.dev/docs/api/admin-graphql/2026-07/mutations/productVariantsBulkUpdate).

## Camera access during local development

After changing next.config.mjs, restart the dev server. The configured LAN hostname 192.168.11.3 can load Next.js dev resources, but plain HTTP on a LAN IP is not a secure context and cannot use getUserMedia. On the same computer, open http://localhost:3000 and allow the browser camera permission. On a phone or Quest, use an HTTPS deployment with a valid certificate (for example Vercel). Camera hardware access still depends on the device/browser. The app now shows secure-context, permission, missing-device, and busy-camera errors directly below the camera controls.


## Headset workflow

Open [vrify](https://vrify.vercel.app) in the headset browser. Choose Headset mode for larger controls, then Enable hands-free voice and allow the microphone. Say “vrify open camera”, “vrify capture photo”, “vrify call it Girls Love My Swag. Price is 45 dollars. Only one available”, and “vrify save to Shopify”. Use the provided demo photo when raw headset cameras are unavailable. On WebXR devices, Enter immersive VR opens a floating workspace with controller and gaze-dwell actions. A held gaze activates an action once; look away before activating it again.

The first VR entry and microphone permission need a gesture. Quest browsers without browser speech recognition need a server-side AI_GATEWAY_API_KEY for recorded-audio transcription. Speech-containing WAV utterances (up to 12 seconds each) go through Gateway; recordings are not persisted. Silence detection uses a simple energy threshold and may need tuning in noisy environments. No hands-free claim is made for unsupported devices.

## CI/CD

GitHub Actions (.github/workflows/ci.yml) runs tests, a production build, and type checks on main pushes and pull requests using Node 24. Vercel Git integration deploys repository changes automatically. GitHub CI and Vercel builds run separately; CI is not a deployment gate unless repository/project policies are configured. Secrets belong in Vercel environment settings.
