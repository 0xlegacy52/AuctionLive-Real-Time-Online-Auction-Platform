# AuctionLive — Real-Time Online Auction Platform

## Overview
AuctionLive is a real-time online auction platform where users list items with a starting price and duration, other users bid in real-time via Socket.io, and the highest bidder wins when time expires. Features anti-sniping logic, proxy bidding, and auction lifecycle management.

## Tech Stack
- **Backend**: Node.js + Express + TypeScript (served on port 5000)
- **Frontend**: React 18 + Vite + Tailwind CSS (SPA, built to `dist/public/`)
- **Database**: PostgreSQL (Replit built-in) + Prisma ORM
- **Real-time**: Socket.io (live bid updates, countdown sync)
- **Auth**: Express sessions + bcryptjs

## Architecture
Single Express server on port 5000 serves both the API (`/api/*`) and the built React SPA. Socket.io handles real-time bidding and countdown synchronization.

### Server (`server/`)
- `index.ts` — Express server entry point, session config, static serving
- `db.ts` — Prisma client singleton
- `auth.ts` — Auth middleware (requireAuth)
- `socket.ts` — Socket.io setup and room management
- `scheduler.ts` — In-memory auction expiry scheduler with anti-snipe support
- `routes/auth.ts` — Registration, login, logout, current user
- `routes/auctions.ts` — CRUD, browse, search, filter, watchlist
- `routes/bids.ts` — Place bids, auto-bid (proxy bidding), auto-bid processing

### Frontend (`client/src/`)
- `App.tsx` — React Router setup
- `hooks/useAuth.tsx` — Auth context provider
- `lib/api.ts` — API client
- `lib/socket.ts` — Socket.io client
- `pages/` — Home, Login, Register, Browse, EndingSoon, CreateAuction, AuctionDetail, MyAuctions, MyBids
- `components/` — Navbar, AuctionCard, CountdownTimer, BidHistory

### Shared (`shared/`)
- `types.ts` — Shared types, constants, bid increment calculator, username masking

### Database (`prisma/`)
- Models: User, Auction, Bid, AutoBid, WatchlistItem, AuctionResult, SellerRating, Session

## Key Features
1. **Real-time bidding** — Socket.io rooms per auction, instant bid updates to all viewers
2. **Anti-sniping** — Bids in last 2 minutes auto-extend auction by 2 minutes
3. **Auto-bid (proxy bidding)** — Set maximum, system bids incrementally
4. **Server-authoritative countdown** — Server syncs time every 10 seconds
5. **Auction lifecycle** — Scheduled end via setTimeout, reserve price checking, sold/unsold outcomes
6. **Browse & search** — Category/condition filters, text search, sort options, pagination
7. **Buy Now** — Optional instant purchase price

## Running
- Dev: `npx tsx server/index.ts` (serves built frontend from `dist/public/`)
- Build frontend: `npx vite build --config vite.config.ts`
- DB migrations: `npx prisma db push`
