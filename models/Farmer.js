const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Farmer = sequelize.define('Farmer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    county: {
      type: DataTypes.STRING
    },
    farmSize: {
      type: DataTypes.STRING
    },
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'farmers',
    timestamps: true
  });

  return Farmer;
};