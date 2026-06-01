const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Seedling = sequelize.define('Seedling', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    farmerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'farmers',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('fruit', 'vegetable', 'forestry', 'ornamental', 'cash_crop', 'fodder'),
      allowNull: false
    },
    variety: {
      type: DataTypes.STRING
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      defaultValue: 'seedling'
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT
    },
    image: {
      type: DataTypes.STRING
    },
    inStock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'in_stock'
    },
    datePlanted: {
      type: DataTypes.DATE,
      field: 'date_planted'
    },
    expectedHarvest: {
      type: DataTypes.DATE,
      field: 'expected_harvest'
    },
    status: {
      type: DataTypes.ENUM('growing', 'ready', 'distributed', 'sold'),
      defaultValue: 'growing'
    }
  }, {
    tableName: 'seedlings',
    timestamps: true
  });

  return Seedling;
};