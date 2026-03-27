# Financial Portfolio Tracker "Bloom View"

Bloom View is a full stack solution created to simplify portfolio tracking for new to intermediate investors. The system focuses on clear monitoring, using a KPI driven dashbaord and interactive visualisations to transform raw financial data into actionable insights with a focus on educational framework to empower users to learn and make more informed decisions.

## Features

### Portfolio dashboard
- KPI cards: portfolio value, profit, IRR (where available), passive income
- Allocation breakdown (donut + summary table)
- Holdings table with search/filter
- Asset performance popup (30-day chart + trend line + projection)

### Holdings & assets
- Add/delete holdings for stocks and crypto
- Asset master lookup for symbol/name/type
- LatestPrice + PriceHistory persistence
- Rolling window retention by pruneing old history

### Income tracking
- Track dividend and staking income entries
- Search + filters
- Monthly + YTD summary KPIs

### Security 
- HttpOnly cookie auth (access and refresh tokens)
- CORS locked to allowed origins
- Helmet + rate limiting + sanitization middleware (server)
- Password hashing (bcrypt)

## Tech Stack
**Frontend:** React + Vite, Chakra UI, Recharts  
**Backend:** Node.js + Express 
**Database:** MongoDB Atlas  
**Market data:** Stooq for stocks and Yahoo Finance for crypto
