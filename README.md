# Harbinger Sales Pipeline Dashboard

A production-ready, responsive web dashboard that visualizes the Harbinger sales pipeline, actuals, and modeled plan vs actuals from a single Google Sheet ("sales predictions") with multiple tabs.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** with Harbinger-branded design tokens
- **Recharts** for charts (revenue, partners, pipeline breakdowns)
- **TanStack Table** for sortable/filterable data tables
- **Zod** for runtime data validation schemas
- **Papa Parse** for CSV parsing
- **ESLint + Prettier** for code quality

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the defaults (already included in `.env.local`):

```env
SALES_PREDICTIONS_SHEET_ID=2PACX-1vTmXpub-XcClEL87mq-nr1mpCCshRrqj1Xcu_f4eJlPlYQHRiVOW_yF67C3F06vANp97APtcK_5YrRw
TOP_SHEET_GID=867529212
USE_MOCK_DATA=false
REVALIDATE_SECONDS=300
```

Set `USE_MOCK_DATA=true` to use local CSV fixtures from `/data/` for offline development.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
npx jest
```

### 5. Build for production

```bash
npm run build
npm start
```

## Architecture

### Data Flow

```
Google Sheets (published CSV) → API Routes → CSV Parsers → JSON → Client Components
```

1. **API routes** (`/api/monthly?month=YYYY-MM` and `/api/topsheet`) fetch CSV server-side to avoid CORS
2. **Parsers** split the monthly CSV into pipeline + actuals sections, and parse the Top Sheet into monthly series
3. **Client** fetches from API routes and renders the dashboard

### Data Source: One Sheet, Multiple Tabs

The "sales predictions" Google Sheet has one tab per month (e.g., "FEB 1 (26)") and a "Top Sheet" tab. Each tab is identified by a `gid`. The app builds CSV export URLs from `SHEET_ID + gid`.

Tab-to-gid mapping is in `src/config/monthTabs.ts`.

### Column Mapping

Real spreadsheet headers are mapped to normalised field names via config in `src/config/columns.ts`. The system supports:

- **Exact match**: direct header → field mapping
- **Synonym fallback**: case-insensitive fuzzy matching with synonyms

### Monthly Tab Structure

Each month tab contains:
1. **Pipeline section** ("1st of MONTH"): prospect rows with deal value, owner, stage, probabilities
2. **Summary rows**: 30/60 day prediction summaries
3. **Actuals section** ("End of MONTH"): closed deals

The parser detects section boundaries by scanning for marker text ("1st of MONTH", "End of MONTH", etc.).

## Dashboard Features

- **KPI Cards**: Total Pipeline, Weighted Pipeline, 30/60 Day Forecasts, Closed Deals
- **YTD Plan vs Actual**: Revenue and partners charts from Top Sheet
- **Pipeline Charts**: By stage, by owner, by state, deal value vs close probability scatter
- **Pipeline Table**: Searchable, filterable, sortable with detail panel on row click
- **Actuals Table**: Closed deals for the month
- **Insights Strip**: Top owner, largest deal, top stages, top states
- **Dark/Light Toggle**: Harbinger-branded theme
- **Month Selector**: Defaults to current month (America/New_York timezone)
- **Auto-refresh**: Data revalidates every 5 minutes

## How to Update Mappings

### Adding a New Month Tab

1. Find the tab's `gid` from the published sheet HTML
2. Add the entry to `MONTH_GID_MAP` in `src/config/monthTabs.ts`
3. Add a label to `MONTH_LABELS`

### Changing Column Names

Update the mapping objects in `src/config/columns.ts`:
- `PIPELINE_COLUMN_MAP` for exact matches
- `PIPELINE_SYNONYMS` for fallback matching

### Switching to a Different Sheet

Update `SALES_PREDICTIONS_SHEET_ID` and `TOP_SHEET_GID` in `.env.local`.

## File Structure

```
src/
├── app/
│   ├── api/monthly/route.ts    # Monthly tab CSV endpoint
│   ├── api/topsheet/route.ts   # Top Sheet CSV endpoint
│   ├── globals.css             # Tailwind + Harbinger design tokens
│   ├── layout.tsx              # Root layout with ThemeProvider
│   └── page.tsx                # Dashboard entry point
├── components/
│   ├── Dashboard.tsx           # Main dashboard orchestrator
│   ├── Header.tsx              # Header with month selector + controls
│   ├── KpiCard.tsx             # Individual KPI card
│   ├── KpiCards.tsx            # Current month KPI section
│   ├── YtdSection.tsx          # YTD plan vs actual charts
│   ├── PipelineCharts.tsx      # Pipeline breakdown charts
│   ├── PipelineTable.tsx       # Searchable pipeline table
│   ├── ActualsTable.tsx        # Closed deals table
│   ├── DetailPanel.tsx         # Prospect detail side panel
│   ├── InsightsStrip.tsx       # Quick insights cards
│   └── ThemeProvider.tsx       # Dark/light theme context
├── config/
│   ├── columns.ts              # Column name mappings + synonyms
│   ├── monthTabs.ts            # Month → GID mapping
│   └── sheet.ts                # Sheet ID + URL builders
├── hooks/
│   └── useDashboardData.ts     # Data fetching hook
├── lib/
│   ├── fetcher.ts              # CSV fetch with mock mode
│   ├── format.ts               # Currency/percent/number formatters
│   ├── normalize.ts            # Value normalisation helpers
│   ├── schemas.ts              # Zod validation schemas
│   └── parsers/
│       ├── monthly.ts          # Monthly tab CSV parser
│       └── topsheet.ts         # Top Sheet CSV parser
└── types/
    └── index.ts                # TypeScript interfaces

data/                           # Sample CSV fixtures for mock mode
__tests__/                      # Jest unit tests
```

## Deployment

Vercel-ready with zero configuration. Push to deploy.

For other platforms, `npm run build` produces a standalone build.

## Assumptions

- The Google Sheet is publicly web-published (no auth needed)
- Monthly tabs follow the naming convention "MON 1 (YY)" with known gids
- Pipeline data appears under a "1st of MONTH" header; actuals under "End of MONTH"
- Top Sheet uses a section-based layout with months across columns
- Percentage values may be formatted as "35%", "0.35", or "35"
- Currency values may include "$" and commas
