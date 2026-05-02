import { Op } from "sequelize";
import Expense from "../models/Expense";
import ExpenseSplit from "../models/ExpenseSplit";
import User from "../models/User";

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Net amounts per counterparty and currency.
 * Positive balanceAmount means counterparty owes the current user.
 */
async function getBalancesForUser(userId) {
  const splitRows = await ExpenseSplit.findAll({
    where: { userId },
    attributes: ["expenseId"],
    raw: true,
  });
  const fromSplits = [...new Set(splitRows.map((r) => r.expenseId))];

  const expenses = await Expense.findAll({
    where: {
      [Op.or]: [{ paidByUserId: userId }, { id: { [Op.in]: fromSplits } }],
    },
    include: [
      {
        model: ExpenseSplit,
        as: "splits",
        required: false,
      },
    ],
  });

  /** @type {Record<string, number>} */
  const aggregate = {};

  for (const exp of expenses) {
    const P = exp.paidByUserId;
    const cur = exp.currency;
    const splits = exp.splits || [];

    if (P === userId) {
      for (const s of splits) {
        if (s.userId === userId) continue;
        const key = `${s.userId}|${cur}`;
        aggregate[key] = round2((aggregate[key] || 0) + Number(s.shareAmount));
      }
    } else {
      const mine = splits.find((s) => s.userId === userId);
      if (mine) {
        const key = `${P}|${cur}`;
        aggregate[key] = round2((aggregate[key] || 0) - Number(mine.shareAmount));
      }
    }
  }

  const counterpartyIds = [
    ...new Set(Object.keys(aggregate).map((k) => Number(k.split("|")[0]))),
  ];

  const users = await User.findAll({
    where: { id: { [Op.in]: counterpartyIds } },
    attributes: ["id", "name", "email", "defaultCurrency"],
  });
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  return Object.entries(aggregate).map(([key, balanceAmount]) => {
    const [otherId, currency] = key.split("|");
    const counterparty = userById[Number(otherId)];
    return {
      counterpartyId: Number(otherId),
      counterpartyName: counterparty ? counterparty.name : null,
      counterpartyEmail: counterparty ? counterparty.email : null,
      currency,
      balanceAmount,
      direction:
        balanceAmount > 0
          ? "they_owe_you"
          : balanceAmount < 0
            ? "you_owe_them"
            : "settled",
    };
  });
}

export default { getBalancesForUser, round2 };
