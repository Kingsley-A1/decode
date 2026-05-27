// Phase H compatibility shim.
//
// The original Decode URL shortener was a client-side widget that posted to
// the third-party `is.gd` service, had no persistence, no verification, and
// produced fallback URLs at a `decode.local/s/{hex}` host with no real route
// behind them. Phase F–G replaced it with a Decode-native shortener
// (`/api/short-links` + `/s/[slug]` + the verifier pipeline), and this file
// is kept only so any stale import keeps compiling. Mount the console
// directly at `/shorten` or via `@/components/short-links/ShortLinkConsole`.
//
// Follow-up: delete this file in the release after the shim ships.

export { ShortLinkConsole as URLShortener } from "@/components/short-links/ShortLinkConsole";
