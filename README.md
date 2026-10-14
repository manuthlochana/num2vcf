# Phone to VCF — Batch Phone Number to vCard Converter

A fast, private, and modern web application to clean, format, de-duplicate, and convert bulk telephone numbers into standardized `.vcf` (vCard 3.0) contact files ready for import into iOS, Android, Google Contacts, and Outlook.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-num2vcf.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://num2vcf.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

🔗 **Live Website**: [https://num2vcf.vercel.app](https://num2vcf.vercel.app)

---

## Features

- 🔒 **100% Client-Side Privacy**: All parsing, sanitization, formatting, and file generation run entirely inside your browser. No phone numbers or contact records ever leave your machine or touch a server.
- ⚡ **Instant Batch Parsing**: Paste thousands of lines directly from Excel, Google Sheets, CSV, or raw text files. Brackets, hyphens, spaces, and extraneous quotes are stripped automatically.
- 🇱🇰 **Sri Lankan (+94) & International Formatting**:
  - Automatically transforms local Sri Lankan numbers (e.g., `0771234567` or `771234567`) into international `+94771234567` format.
  - Supports custom country codes with automatic leading-zero normalization.
  - Retains original cleaned format if preferred.
- 📇 **RFC 2426 vCard 3.0 CRLF Compliance**: Generates strict, standards-compliant vCard 3.0 cards with CRLF (`\r\n`) line endings and proper delimiter escaping (`\`, `,`, `;`) for universal import compatibility.
- 🔄 **Intelligent De-duplication & Validation**: Real-time detection flags and drops duplicate numbers after formatting, filtering out entries that fail international length criteria (9–15 digits).
- 🏷️ **Customizable Contact Naming**:
  - Configurable name prefixes (e.g., `Lead`, `Client`, `Batch 2026`, or simple numeric tags like `1`).
  - Sequential counters with customizable starting index, separator (`_`, `-`, space), and zero-padding (`01`, `001`, `0001`).
- 📊 **Real-Time Preview & Metrics**: Live summary counters (total lines, valid numbers, invalid entries, duplicates dropped), paginated preview table, and raw `.vcf` output inspector.
- 📁 **Export & Clipboard**: Instant one-click `.vcf` download with timestamped filenames, or direct copy to clipboard.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) with [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Radix UI component primitives
- **Icons & Notifications**: [Lucide React](https://lucide.dev/) & [Sonner](https://sonner.emilkowal.ski/)
- **State & Data**: [TanStack Query](https://tanstack.com/query)
- **Testing**: [Vitest](https://vitest.dev/) & [Testing Library](https://testing-library.com/)
- **Language & Build**: [TypeScript](https://www.typescriptlang.org/) & [Vite](https://vitejs.dev/)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher) or [Bun](https://bun.sh/)
- `npm`, `pnpm`, or `bun`

### Installation

Clone the repository and install dependencies:

```bash
git clone [https://github.com/manuthlochana/num2vcf.git](https://github.com/manuthlochana/num2vcf.git)
cd num2vcf
npm install


Development Server

Start the local development server:

npm run dev


Open http://localhost:3000 (or the port shown in your terminal) in your browser.

Running Tests

Execute the unit test suite:

npm test


Production Build

Build the optimized application bundle:

npm run build


Preview the production build locally:

npm run preview


Project Structure

├── public/                # Static assets, favicon, and app icons
│   ├── favicon.ico
│   ├── favicon.png
│   └── icon.png
├── src/
│   ├── components/        # Reusable UI component library (Radix + Tailwind)
│   ├── lib/
│   │   ├── vcard.ts       # Pure core domain logic (cleaning, formatting, vCard generation)
│   │   ├── vcard.test.ts  # Unit tests for vCard parser and formatter
│   │   └── utils.ts       # Utility helper functions
│   ├── routes/
│   │   ├── __root.tsx     # Root layout, error boundary, and document head
│   │   └── index.tsx      # Interactive batch converter interface
│   ├── styles.css         # Global design tokens and Tailwind theme
│   └── router.tsx         # Router configuration
└── vitest.config.ts       # Test runner configuration


Live Demo

Try the live application directly in your browser:
👉 https://num2vcf.vercel.app

License

This project is licensed under the MIT License.
