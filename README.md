# MKULIMA Seedlings Ltd

A modern seedling e-commerce platform for Kenyan farmers.

## Features

- **Product Catalog** - Browse seedlings by category (fruit, vegetable, tree, ornamental, cash crop, fodder)
- **Stock Management** - Admin panel to toggle product availability
- **Order System** - Customers can submit order requests
- **Contact Form** - Direct communication with farmers

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express + SQLite
- **Database**: SQLite (file-based, no setup required)

## Quick Start

### Prerequisites
- Node.js 18+ installed

### Installation

```bash
# Clone the repository
git clone https://github.com/Aubrey359/mkulimaseedling.git
cd mkulimaseedling

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and set your admin password

# Start the server
npm run dev
```

### Access

- **Website**: http://localhost:3000
- **Admin Password**: Set in `.env` file (default: `mkulima2026!`)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| PUT | `/api/products/:id/stock` | Toggle product stock |
| POST | `/api/orders` | Submit order request |
| POST | `/api/contacts` | Submit contact message |
| GET | `/api/admin/orders` | Get all orders (admin) |
| GET | `/api/admin/contacts` | Get all contacts (admin) |

## Deployment

See [BACKEND_DEPLOYMENT_GUIDE.md](BACKEND_DEPLOYMENT_GUIDE.md) for deployment options:

- **Railway** - One-click deployment
- **Render** - Free tier available
- **DigitalOcean** - App Platform
- **Supabase** - Alternative backend (PostgreSQL)

## Project Structure

```
mkulimaseedling/
├── mku.html           # Main frontend
├── server.js          # Backend API
├── package.json       # Node.js dependencies
├── .env               # Environment variables (not tracked)
├── .env.example       # Environment template
├── mkulima.db         # SQLite database (auto-created)
└── BACKEND_DEPLOYMENT_GUIDE.md
```

## License

MIT License - MKULIMA Seedlings Ltd