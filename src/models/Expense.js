import Sequelize, { Model } from "sequelize";

class Expense extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        value: Sequelize.DECIMAL(14, 2),
        currency: Sequelize.STRING(8),
        date: Sequelize.DATEONLY,
        paidByUserId: {
          type: Sequelize.INTEGER,
          field: "paid_by_user_id",
        },
        createdByUserId: {
          type: Sequelize.INTEGER,
          field: "created_by_user_id",
        },
      },
      {
        sequelize,
        tableName: "Expenses",
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: "paidByUserId",
      as: "payer",
    });
    this.belongsTo(models.User, {
      foreignKey: "createdByUserId",
      as: "creator",
    });
    this.hasMany(models.ExpenseSplit, {
      foreignKey: "expenseId",
      as: "splits",
    });
  }
}

export default Expense;
