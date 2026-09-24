# Sideline

Sideline is a rename-friendly, original sports companion for content, contextual research (**Scout**), and discovery (**Lore**). It does not use third-party branding, assets, or proprietary code.

## Stack rationale
1. pnpm workspaces keep shared domain contracts versioned together.
2. Turborepo provides a small, cacheable build graph.
3. Expo + React Native gives one iOS/Android app.
4. React Navigation separates Content, Scout, Lore, and Chirp surfaces.
5. Fastify owns provider secrets and the research boundary.
6. Drizzle keeps the future Postgres schema typed and migration-friendly.
7. Vitest tests pure context, routing, citation, odds, and persona behavior.
8. SSE/fetch interfaces are defined without exposing server credentials.

## Milestone 1 status
- Working monorepo scaffold under `sideline/`.
- Mobile demo shell with contextual web/article/player/prop/fantasy flows.
- Backend health endpoint and Scout request endpoint.
- Context, routing, research, retrieval, Lore, sports, fantasy, odds, Companion, Chirp, and privacy foundations.
- Mock providers are explicitly labeled and never claim to be live.

## What's mocked
Sports, odds, fantasy, web search/extraction, user context, Lore graph, and ChangeEvent fixtures. No push delivery, wagering, transactions, or live provider pipeline exists.

## Keys needed next
Copy `apps/api/.env.example`: `DATABASE_URL`, `SEARCH_API_KEY`, `LLM_API_KEY`, `SPORTS_API_KEY`, and `ODDS_API_KEY`. Keys remain server-only; the mobile app receives none.

## Limitations
The mobile WebView and native builds require an Expo-capable local environment. Postgres migrations are a starter schema, not a production privacy audit. SSRF checks are intentionally conservative and need integration tests against the chosen proxy/provider.

## Recommended milestone 2
Add tabs/bookmarks, real provider adapters behind the existing interfaces, authenticated encrypted persistence, Postgres repositories, SSE progress transport, accessibility review, and native-device testing.

## Commands
`pnpm install && pnpm test && pnpm dev`

Deviation: this scaffold uses mocked provider implementations and an in-memory backend path for milestone 1; the specified Postgres/Drizzle boundary and migration are included for the next persistence increment.
