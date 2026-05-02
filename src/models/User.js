import Sequelize, { Model } from "sequelize";
import bcrypt from "bcryptjs";

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL, //When it is VIRTUAL it does not exist in the database
        password_hash: Sequelize.STRING,
        defaultCurrency: {
          type: Sequelize.STRING(8),
          allowNull: false,
          defaultValue: "USD",
          field: "default_currency",
        },
      },
      {
        sequelize,
        defaultScope: {
          attributes: { exclude: ["password_hash"] },
        },
        scopes: {
          withPassword: {
            attributes: { include: ["password_hash"] },
          },
        },
        timestamps: true, //If it's false do not add the attributes (updatedAt, createdAt).
        //paranoid: true, //If it's true, it does not allow deleting from the bank, but inserts column deletedAt. Timestamps need be true.
        //underscored: true, //If it's true, does not add camelcase for automatically generated attributes, so if we define updatedAt it will be created as updated_at.
        //freezeTableName: false, //If it's false, it will use the table name in the plural. Ex: Users
        //tableName: 'Users' //Define table name
      }
    );

    this.addHook("beforeSave", async (user) => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this;
  }

  static associate(models) {
    this.belongsToMany(models.Address, {
      through: "UserAddress",
      foreignKey: "userId",
    });
    this.hasMany(models.Expense, {
      foreignKey: "paidByUserId",
      as: "paidExpenses",
    });
    this.hasMany(models.Expense, {
      foreignKey: "createdByUserId",
      as: "createdExpenses",
    });
    this.hasMany(models.ExpenseSplit, {
      foreignKey: "userId",
      as: "expenseSplits",
    });
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;
