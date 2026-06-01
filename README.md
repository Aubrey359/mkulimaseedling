# MKULIMA Seedlings Ltd

A modern seedling tracking web app for Kenyan farmers with PostgreSQL database support.

## Features

- **Product Catalog** - Browse seedlings by category (fruit, vegetable, forestry, ornamental, cash crop, fodder)
- **Farmer Management** - Track farmers with location, farm size, and contact details
- **Seedling Tracking** - Monitor seedling growth stages, quantities, and expected harvest dates
- **Distribution Management** - Record and track seedling distributions to farmers
- **Stock Management** - Admin panel to toggle product availability
- **Order System** - Customers can submit order requests
- **Contact Form** - Direct communication with farmers
- **Photo Upload** - Upload seedling photos for tracking

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express + Sequelize ORM
- **Database**: PostgreSQL (Railway)
- **File Storage**: Local uploads (configurable for cloud storage)
- **Redis** (Optional): For caching and queues at scale

## Project Structure

```
mkulima-seedling/
├── mku.html           # Main frontend
├── products.html      # Products page
├── admin.html         # Admin dashboard
├── server.js          # Backend API
├── package.json       # Node.js dependencies
├── .env               # Environment variables (not tracked)
├── .env.example       # Environment template
├── models/
│   ├── index.js       # Sequelize models index
│   ├── Farmer.js      # Farmer model
│   ├── Seedling.js    # Seedling model
│   ├── Distribution.js # Distribution model
│   ├── Product.js     # Product model
│   ├── Order.js       # Order model
│   └── Contact.js     # Contact model
├── config/
│   └── database.js    # Database configuration
├── uploads/           # Seedling photos (created on first upload)
└── BACKEND_DEPLOYMENT_GUIDE.md
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Railway account)

### Installation

```bash
# Clone the repository
git clone https://github.com/Aubrey359/mkulimaseedling.git
cd mkulimaseedling

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and set your configuration

# Start the server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `ADMIN_PASSWORD` | Admin login password | mkulima |
| `DATABASE_URL` | PostgreSQL connection URL | - |
| `REDIS_URL` | Redis connection URL (optional) | - |
| `REDIS_ENABLED` | Enable Redis caching | false |
| `UPLOAD_DIR` | Directory for file uploads | ./uploads |
| `MAX_FILE_SIZE` | Max upload size in bytes | 5242880 |

### Access

- **Website**: http://localhost:3000
- **Admin Password**: Set in `.env` file (default: `mkulima`)

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| POST | `/api/orders` | Submit order request |
| POST | `/api/contacts` | Submit contact message |

### Admin Endpoints (requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (returns token) |
| GET | `/api/admin/products` | Get all products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| PUT | `/api/admin/products/:id/stock` | Toggle stock status |
| GET | `/api/admin/orders` | Get all orders |
| PUT | `/api/admin/orders/:id` | Update order status |
| GET | `/api/admin/contacts` | Get all contacts |
| POST | `/api/admin/reset` | Reset database |
| GET | `/api/admin/farmers` | Get all farmers |
| POST | `/api/admin/farmers` | Create farmer |
| PUT | `/api/admin/farmers/:id` | Update farmer |
| DELETE | `/api/admin/farmers/:id` | Delete farmer |
| GET | `/api/admin/seedlings` | Get all seedlings |
| POST | `/api/admin/seedlings` | Create seedling (with photo upload) |
| PUT | `/api/admin/seedlings/:id` | Update seedling |
| DELETE | `/api/admin/seedlings/:id` | Delete seedling |
| GET | `/api/admin/distributions` | Get all distributions |
| POST | `/api/admin/distributions` | Create distribution |
| PUT | `/api/admin/distributions/:id` | Update distribution |
| DELETE | `/api/admin/distributions/:id` | Delete distribution |

## Database Schema

### Farmers
- `id` (UUID, primary key)
- `name` (string)
- `phone` (string)
- `email` (string)
- `location` (string)
- `county` (string)
- `farmSize` (string)
- `status` (active/inactive)

### Seedlings
- `id` (UUID, primary key)
- `farmerId` (UUID, foreign key)
- `name` (string)
- `category` (fruit/vegetable/forestry/ornamental/cash_crop/fodder)
- `variety` (string)
- `price` (decimal)
- `quantity` (integer)
- `image` (string)
- `status` (growing/ready/distributed/sold)

### Distributions
- `id` (UUID, primary key)
- `seedlingId` (UUID, foreign key)
- `farmerId` (UUID, foreign key)
- `quantity` (integer)
- `destination` (string)
- `county` (string)
- `status` (pending/in_transit/delivered/cancelled)

## Deployment

See [BACKEND_DEPLOYMENT_GUIDE.md](BACKEND_DEPLOYMENT_GUIDE.md) for deployment options:

- **Railway** - One-click deployment with PostgreSQL
- **Render** - Free tier available
- **DigitalOcean** - App Platform
- **Supabase** - Alternative backend (PostgreSQL)

## License

MIT License - MKULIMA Seedlings Ltd