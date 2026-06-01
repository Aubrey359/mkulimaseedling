const { Sequelize } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Import models
const Farmer = require('./Farmer')(sequelize);
const Seedling = require('./Seedling')(sequelize);
const Distribution = require('./Distribution')(sequelize);
const Product = require('./Product')(sequelize);
const Order = require('./Order')(sequelize);
const Contact = require('./Contact')(sequelize);

// Define associations
Farmer.hasMany(Seedling, { foreignKey: 'farmerId', as: 'seedlings' });
Seedling.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });

Seedling.hasMany(Distribution, { foreignKey: 'seedlingId', as: 'distributions' });
Distribution.belongsTo(Seedling, { foreignKey: 'seedlingId', as: 'seedling' });

Product.hasMany(Order, { foreignKey: 'productId', as: 'orders' });
Order.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  Farmer,
  Seedling,
  Distribution,
  Product,
  Order,
  Contact
};