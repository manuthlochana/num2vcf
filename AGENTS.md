# Developer & Agent Guidelines

- **Core Logic Isolation**: Phone sanitization, number formatting, validation, and vCard string generation live as pure, deterministic functions in `src/lib/vcard.ts` with unit tests beside it (`src/lib/vcard.test.ts`).
- **Client-Side Privacy**: All processing runs 100% in the user's browser via `processInput` — no user contact data is ever transmitted to a server.
- **vCard Compliance**: The exported `.vcf` file strictly adheres to the RFC 2426 vCard 3.0 specification with standard CRLF (`\r\n`) line terminations.
