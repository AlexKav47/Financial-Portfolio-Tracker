# Financial Portfolio Tracker

A full-stack portfolio dashboard for beginner Irish investors: unified holdings, allocation breakdown, KPIs, rolling 30-day price history, and an income tracker dividends and staking. 

## Features

### Portfolio dashboard
- KPI cards: portfolio value, profit, IRR (where available), passive income
- Allocation breakdown (donut + summary table)
- Holdings table with search/filter
- Asset performance popup (30-day chart + trend line + projection)

### Holdings & assets
- Add/delete holdings (stocks + crypto)
- Asset master lookup for symbol/name/type
- LatestPrice + PriceHistory persistence
- Rolling window retention (prunes old history)

### Income tracking
- Track dividend and staking income entries
- Search + filters
- Monthly + YTD summary KPIs

### Security 
- HttpOnly cookie auth (access + refresh tokens)
- CORS locked to allowed origins
- Helmet + rate limiting + sanitization middleware (server)
- Password hashing (bcrypt)

## Tech Stack
**Frontend:** React + Vite, Chakra UI, Recharts  
**Backend:** Node.js + Express (ESM)  
**Database:** MongoDB (Atlas recommended)  
**Process:** PM2 + Nginx (Hetzner deployment)  
**Market data:** Stooq (stocks), Yahoo Finance (crypto)
