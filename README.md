# ReelAtlas
<img width="1470" height="807" alt="image" src="https://github.com/user-attachments/assets/118a7dc6-e524-412a-a77a-81cb3f55ec9f" />

**Your brand speaks. The world understands.**

ReelAtlas is a brand intelligence and UGC script generation platform that culturally adapts marketing content for global markets. Not translated — reimagined.

Paste your URL. ReelAtlas reads your brand, understands your voice, and rebuilds your UGC content for every market.

---

## How It Works

1. **Intelligence Scrape** — Paste your brand URL. Our agent crawls your site to map your tone, values, and cultural flexibility thresholds.
2. **Adaptive Narrative** — Generate script variations that preserve your core message while shifting the emotional hook per market.
3. **Cultural Injection** — Content is reconstructed with local slang, ritual context, and references for every locale.

---

## Features

### Brand Intelligence
- Paste a brand URL into a conversational chat interface
- Firecrawl scrapes and analyzes the website automatically
- AI generates 5 personalized questions to understand tone, audience, content goals, and cultural adaptation preferences
- Produces a comprehensive Brand Image profile: voice, audience, content style, themes, cultural notes per market, UGC suggestions
- Refinable with natural language ("Focus on eco-friendly positioning", "Target younger demographics")

### Script Studio
- Generate 1–4 UGC scripts per batch with real-time streaming
- 10+ script formats: testimonial, tutorial, day-in-the-life, unboxing, GRWM, before/after, storytime, POV, problem-solution, comparison
- Custom direction notes per generation
- Inline refinement with natural language
- Production-ready output: title, format/duration/platform metadata, scene directions, dialogue, on-screen text overlays, timing cues, production notes
- 25–40 seconds spoken, optimized for TikTok, Reels, YouTube Shorts
- Written for the US market by default — American cultural references, slang, and English throughout

### Script Management
- Save with auto-extracted titles
- Full markdown editor (TipTap) with auto-save
- Version history with line-by-line diff view and one-click revert

### Cultural Localization (via Lingo.dev)
- Localize to 15 markets: US, UK, CA, AU, JP, KR, BR, MX, DE, FR, IN, ID, VN, RU, TR
- Cultural adaptation — not translation: idiom replacement, reference swaps, humor/tone adjustment, CTA patterns, formality levels, region-specific examples
- Back-translation with inline annotations explaining *why* each cultural change was made
- Multi-market batch localization in parallel
- Two Lingo API calls per market: cultural adaptation (en → target) + annotated back-translation (target → en)

### Shareable Links
- Share localized scripts with UGC creators via per-language public links — no login required
- Each market gets its own independent share link
- Revoke access per market at any time

---

## Lingo.dev Integration

ReelAtlas uses [Lingo.dev](https://lingo.dev) as its localization engine. Lingo powers the cultural adaptation layer — turning American UGC scripts into locally resonant content for each target market.

### Two-step localization per market

**Step 1 — Cultural adaptation (English → Target locale)**

```
POST https://api.lingo.dev/process/localize
```

- Source: `en` (American English)
- Target: market-specific locale (`ja`, `pt-BR`, `ko`, `de`, etc.)
- Script content is sent with a detailed `_instructions` field telling Lingo this is a **full cultural localization**, not a word-for-word translation
- Instructions cover: idiom replacement, cultural reference swaps (celebrities, holidays, food, sports, memes), humor/tone adaptation, CTA pattern changes, formality adjustment, region-specific example substitution
- Brand context (name, voice, per-market cultural notes from the brand image) is injected into instructions when available

**Step 2 — Back-translation (Target locale → English)**

- Same endpoint, reversed direction
- Translates **literally** back to English so users can see exactly what their audience reads
- Annotates cultural changes inline: `"Champions League final ()[replaced 'Super Bowl' — football is the dominant sport]"`
- Best-effort — if it fails, the localized content is still saved

### Market-to-locale mapping

| Market | Locale | Market | Locale |
|--------|--------|--------|--------|
| US | `en` | JP | `ja` |
| UK | `en-GB` | KR | `ko` |
| CA | `en-CA` | DE | `de` |
| AU | `en-AU` | FR | `fr` |
| IN | `hi` | TR | `tr` |
| BR | `pt-BR` | RU | `ru` |
| MX | `es-MX` | VN | `vi` |
| ID | `id` | | |

### Data flow

- API key via `LINGO_API_KEY` env variable, sent as `X-API-Key` header
- All target markets localized in parallel (`Promise.allSettled`)
- Results upserted into `localized_scripts` table (unique on `script_id + locale`)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Phosphor Icons, Lucide React |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| AI/LLM | Google Gemini 2.5 Flash via OpenRouter |
| Scraping | Firecrawl |
| Localization | Lingo.dev API |
| Editor | TipTap (Markdown) |
| Validation | Zod |
| 3D Globe | Cobe |
| Shaders | @paper-design/shaders-react |
| Animations | React Spring |
| Notifications | Sonner |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- API keys for: Clerk, OpenRouter, Firecrawl, Lingo.dev

### Environment Variables

Create a `.env.local` file:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenRouter (for Gemini)
OPENROUTER_API_KEY=

# Firecrawl
FIRECRAWL_API_KEY=

# Lingo.dev
LINGO_API_KEY=
```

### Database Setup

Run the schema in your Supabase SQL editor:

```bash
# Base schema
supabase/schema.sql

# Migrations (run in order)
supabase/migrations/001_create_scripts.sql
supabase/migrations/002_create_localized_scripts.sql
supabase/migrations/003_add_back_translation.sql
supabase/migrations/004_add_origin_country.sql
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  page.tsx                          # Landing page
  layout.tsx                        # Root layout (fonts, Clerk provider)
  components/
    Globe.tsx                       # Cobe 3D globe
    ShaderBackground.tsx            # Paper Design shader effects
  dashboard/
    layout.tsx                      # Sidebar, DashboardContext
    page.tsx                        # Home (script list) + onboarding chat
    brand/page.tsx                  # Brand image view/refine
    studio/
      page.tsx                      # Script generation
      [id]/page.tsx                 # Script detail + editor
    localize/
      page.tsx                      # Localization hub
      [id]/page.tsx                 # Per-script localization view
    settings/page.tsx               # Account settings
    components/
      BrandImageEditor.tsx          # Read-only markdown display
      ScriptEditor.tsx              # Editable TipTap script editor
  api/
    profile/route.ts                # GET/PATCH user profile
    scrape/route.ts                 # POST scrape URL + generate MCQs
    brand-image/route.ts            # POST create brand image
    brand-image/refine/route.ts     # POST refine brand image
    scripts/route.ts                # GET list scripts
    scripts/save/route.ts           # POST save script
    scripts/generate/route.ts       # POST generate scripts (streaming)
    scripts/refine/route.ts         # POST refine script (streaming)
    scripts/[id]/route.ts           # GET/PUT/DELETE single script
    scripts/[id]/versions/route.ts  # GET/POST version history
    scripts/[id]/share/route.ts     # POST/DELETE share tokens
    localize/route.ts               # GET/POST localizations
    share/[token]/route.ts          # GET public share data
  share/[token]/page.tsx            # Public share page
lib/
  supabase.ts                       # Supabase client (public + admin)
supabase/
  schema.sql                        # Base database schema
  migrations/                       # Incremental migrations
```

---

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scrape` | POST | Scrape URL + generate MCQs |
| `/api/brand-image` | POST | Create brand image from survey |
| `/api/brand-image/refine` | POST | Refine brand image with prompt |
| `/api/scripts/generate` | POST | Generate UGC scripts (streaming) |
| `/api/scripts/refine` | POST | Refine existing script (streaming) |
| `/api/scripts` | GET | List all scripts with localization count |
| `/api/scripts/save` | POST | Save generated script |
| `/api/scripts/{id}` | GET/PUT/DELETE | CRUD for individual script |
| `/api/scripts/{id}/versions` | GET/POST | List versions / revert |
| `/api/localize` | GET/POST | Get/create localizations via Lingo.dev |
| `/api/scripts/{id}/share` | POST/DELETE | Generate/revoke share token |
| `/api/share/{token}` | GET | Public share data (no auth) |
| `/api/profile` | GET/PATCH | Get user profile / update settings |

---

## Database Schema

| Table | Key Columns |
|-------|-------------|
| **profiles** | user_id, onboarding_complete, origin_country |
| **brand_images** | user_id, brand_url, brand_name, voice, audience, style, full_brand_image (JSONB) |
| **scripts** | id, user_id, title, content, ready_to_localize |
| **script_versions** | script_id, content, version_number |
| **localized_scripts** | script_id, locale, market_code, content, back_translation |
