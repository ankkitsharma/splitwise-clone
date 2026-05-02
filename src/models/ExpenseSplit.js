import Sequelize, { Model } from "sequelize";

class ExpenseSplit extends Model {
  static init(sequelize) {
    super.init(
      {
        expenseId: {
          type: Sequelize.INTEGER,
          field: "expense_id",
        },
        userId: {
          type: Sequelize.INTEGER,
          field: "user_id",
        },
        shareAmount: {
          type: Sequelize.DECIMAL(14, 2),
          field: "share_amount",
        },
      },
      {
        sequelize,
        tableName: "ExpenseSplits",
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Expense, {
      foreignKey: "expenseId",
      as: "expense",
    });
    this.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  }
}

export default ExpenseSplit;
