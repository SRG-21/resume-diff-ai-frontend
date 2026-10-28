# AI Resume-JD Comparator Frontend

A mobile-first, responsive React frontend application that allows users to compare their resume against job descriptions using AI-powered analysis.

## Features

- 📱 **Mobile-First Design** - Optimized for mobile devices with touch-friendly UI
- 🔄 **Flexible Job Description Input** - Upload PDF or paste text
- 📄 **Multi-Format Resume Support** - PDF, DOC, DOCX, and TXT files
- 🎯 **Match Analysis** - Visual display of match percentage with animated progress circle
- 🏷️ **Skill Comparison** - See matched and missing skills at a glance
- 📋 **Export Options** - Copy to clipboard or export missing skills to CSV
- ♿ **Accessible** - WCAG compliant with proper ARIA labels and keyboard navigation
- ✅ **Form Validation** - Client-side validation with helpful error messages
- 🔄 **Request Cancellation** - Cancel in-flight API requests
- 🌐 **TypeScript** - Fully typed for better developer experience

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Vitest** - Unit testing
- **React Testing Library** - Component testing

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd resume-diff-ai-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure API endpoint in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Note: The `/compare` endpoint is automatically appended by the application.

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Testing

Run tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

## API Contract

The frontend expects a backend API endpoint at `/compare` (relative to the base URL configured in `VITE_API_BASE_URL`). 

For example, if `VITE_API_BASE_URL=http://localhost:8000/api`, the application will make requests to `http://localhost:8000/api/compare`.

The endpoint should accept `POST` requests with the following FormData fields:

### Request

- `jd_file` (optional) - Job description PDF file
- `jd_text` (optional) - Job description text
- `resume_file` (required) - Resume file (PDF/DOC/DOCX/TXT)

**Note:** Either `jd_file` OR `jd_text` must be provided (not both).

### Response

```typescript
{
  matchPercent: number;              // 0-100
  matchedSkills: string[];           // Array of matched skills
  missingSkills: string[];           // Array of missing skills
  highlights?: {                     // Optional highlights
    jdMatches?: Array<{
      term: string;
      context: string;
    }>;
    resumeMatches?: Array<{
      term: string;
      context: string;
    }>;
  };
  warnings?: string[];               // Optional warnings
}
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ErrorMessage.tsx
│   ├── FileUpload.tsx
│   ├── JDInput.tsx
│   ├── LoadingSpinner.tsx
│   ├── ProgressCircle.tsx
│   ├── ResultsView.tsx
│   └── SkillChips.tsx
├── hooks/              # Custom React hooks
│   └── useCompare.ts
├── types/              # TypeScript type definitions
│   └── api.ts
├── utils/              # Utility functions
│   ├── export.ts
│   └── validation.ts
├── test/               # Test files
│   ├── setup.ts
│   ├── validation.test.ts
│   ├── useCompare.test.ts
│   └── ResultsView.test.tsx
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Key Features Implementation

### Client-Side Validation

- Resume file is required
- Exactly one of JD file or JD text must be provided
- File size limits (10MB max)
- File type validation
- Character count for text input (50,000 max)

### Mobile Optimization

- Single-column layout on small screens
- Two-column results on larger viewports
- Sticky submit button on mobile
- Touch-friendly tap targets (44px minimum)
- Responsive typography and spacing

### Accessibility

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader friendly

### Error Handling

- Network error handling
- Backend error messages display
- Retry functionality
- Request cancellation
- Validation error display

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- React Team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Vite for the blazing fast build tool

## SaaS features

Routes: `/` landing, `/pricing`, `/privacy`, `/terms`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, and (signed in) `/app`, `/history`, `/history/:id`, `/resumes`, `/tracker`, `/bulk` (Coach), `/billing`.

- Plan state comes from `GET /api/billing/status` (`BillingProvider`); components call `useBilling().can('rewrites')` and show an `UpgradePrompt` when a feature is not included. The server enforces the same rules, so hiding UI is never the only protection.
- `src/api/client.ts` attaches the bearer token, refreshes it once on a 401 (shared across concurrent requests) and signs the user out if refresh fails.
- Display prices live in `src/config/pricing.ts` and must match the Stripe Prices configured on the backend.
- Copy in `src/pages/LegalPages.tsx` is a starting template describing how the product behaves. **Have a lawyer review it, and confirm the refund policy and provider list, before launch.**

### Browser extension (experimental)

`extension/` is a Manifest V3 extension that scores the job page you are viewing against a saved resume. Load it via `chrome://extensions` → Developer mode → Load unpacked. It signs in with email and password and has not been tested in a browser or across LinkedIn/Indeed page layouts; treat it as a starting point.

## Testing

```bash
npm test          # vitest
npm run lint
npm run build
```
