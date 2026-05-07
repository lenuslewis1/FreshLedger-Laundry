# FreshLedger Laundry Management

FreshLedger is a React and Supabase web app for managing a laundry business. It supports Auth-protected workspaces, customers, orders, payments, inventory, expenses, services, settings, and reports.

## Stack

- React
- Vite
- Supabase Auth
- Supabase Postgres with Row Level Security

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env.local
```

3. Fill in:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

4. Run the app:

```bash
npm run dev -- --host 127.0.0.1 --port 5187
```

## Supabase

Migration files are in `supabase/migrations`.

The app uses:

- `profiles`
- `businesses`
- `business_members`
- `customers`
- `services`
- `orders`
- `order_items`
- `payments`
- `inventory_items`
- `expenses`

All app tables are protected with Row Level Security.

### Production Auth Email

Supabase's default Auth email sender is for testing and has strict rate limits. Before onboarding real users, configure custom SMTP in the Supabase dashboard under Authentication > SMTP. Signup confirmation, password reset, magic link, and invite emails all count toward Auth email sending limits.

## Build

```bash
npm run build
```
