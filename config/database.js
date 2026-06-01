module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/mkulima_dev'
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/mkulima_test'
  },
  production: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL
  }
};