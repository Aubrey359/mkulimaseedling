const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Distribution = sequelize.define('Distribution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    seedlingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'seedlings',
        key: 'id'
      }
    },
    farmerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'farmers',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false
    },
    county: {
      type: DataTypes.STRING
    },
    distributedBy: {
      type: DataTypes.STRING,
      field: 'distributed_by'
    },
    distributionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'distribution_date'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_transit', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'distributions',
    timestamps: true
  });

  return Distribution;
};