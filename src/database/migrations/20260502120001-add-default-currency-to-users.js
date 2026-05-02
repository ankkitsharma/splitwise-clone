"use strict";

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn("Users", "default_currency", {
      type: Sequelize.STRING(8),
      allowNull: false,
      defaultValue: "USD",
    }),

  down: (queryInterface) =>
    queryInterface.removeColumn("Users", "default_currency"),
};
