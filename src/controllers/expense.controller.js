import * as Yup from "yup";
import { Op } from "sequelize";
import Expense from "../models/Expense";
import ExpenseSplit from "../models/ExpenseSplit";
import User from "../models/User";
import { equalSplit, round2 } from "../utils/expenseSplit";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/ApiError";

const expenseBodySchema = Yup.object().shape({
  name: Yup.string().required(),
  value: Yup.number().positive().required(),
  currency: Yup.string().min(3).max(8).required(),
  date: Yup.string().required(),
  memberIds: Yup.array()
    .of(Yup.number().integer().positive())
    .min(1)
    .required(),
  paidByUserId: Yup.number().integer().positive(),
});

async function loadExpenseForUser(expenseId, userId) {
  const exp = await Expense.findByPk(expenseId, {
    include: [
      {
        model: ExpenseSplit,
        as: "splits",
        include: [
          { model: User, as: "user", attributes: ["id", "name", "email"] },
        ],
      },
      {
        model: User,
        as: "payer",
        attributes: ["id", "name", "email"],
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "name", "email"],
      },
    ],
  });
  if (!exp) throw new NotFoundError("Expense not found");
  const participant = await ExpenseSplit.findOne({
    where: { expenseId, userId },
  });
  const isPayer = exp.paidByUserId === userId;
  if (!participant && !isPayer) throw new ForbiddenError();
  return exp;
}

const expenseController = {
  create: async (req, res, next) => {
    const t = await Expense.sequelize.transaction();
    try {
      if (!(await expenseBodySchema.isValid(req.body)))
        throw new ValidationError();

      const {
        name,
        value,
        currency,
        date,
        memberIds,
        paidByUserId: bodyPaidBy,
      } = req.body;

      const paidByUserId = bodyPaidBy ?? req.userId;
      const uniqueMembers = [...new Set(memberIds)];
      if (uniqueMembers.length !== memberIds.length)
        throw new ValidationError("Duplicate members");

      if (!uniqueMembers.includes(paidByUserId))
        throw new ValidationError("Payer must be included in members");

      const users = await User.findAll({
        where: { id: { [Op.in]: uniqueMembers } },
      });
      if (users.length !== uniqueMembers.length)
        throw new BadRequestError("Unknown user in members");

      const shares = equalSplit(uniqueMembers, value);

      const expense = await Expense.create(
        {
          name,
          value: round2(value),
          currency: currency.toUpperCase(),
          date,
          paidByUserId,
          createdByUserId: req.userId,
        },
        { transaction: t }
      );

      await ExpenseSplit.bulkCreate(
        shares.map((s) => ({
          expenseId: expense.id,
          userId: s.userId,
          shareAmount: s.shareAmount,
        })),
        { transaction: t }
      );

      await t.commit();

      const created = await Expense.findByPk(expense.id, {
        include: [
          { model: ExpenseSplit, as: "splits" },
          { model: User, as: "payer", attributes: ["id", "name", "email"] },
        ],
      });

      return res.status(201).json(created);
    } catch (error) {
      await t.rollback();
      next(error);
    }
  },

  list: async (req, res, next) => {
    try {
      const userId = req.userId;
      const splitRows = await ExpenseSplit.findAll({
        where: { userId },
        attributes: ["expenseId"],
        raw: true,
      });
      const fromSplits = [...new Set(splitRows.map((r) => r.expenseId))];

      const rows = await Expense.findAll({
        where: {
          [Op.or]: [{ paidByUserId: userId }, { id: { [Op.in]: fromSplits } }],
        },
        include: [
          {
            model: ExpenseSplit,
            as: "splits",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"],
              },
            ],
          },
          { model: User, as: "payer", attributes: ["id", "name", "email"] },
        ],
        order: [
          ["date", "DESC"],
          ["id", "DESC"],
        ],
      });

      return res.status(200).json(rows);
    } catch (error) {
      next(error);
    }
  },

  find: async (req, res, next) => {
    try {
      const exp = await loadExpenseForUser(
        Number(req.params.id),
        req.userId
      );
      return res.status(200).json(exp);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    const t = await Expense.sequelize.transaction();
    try {
      const expenseId = Number(req.params.id);
      const exp = await Expense.findByPk(expenseId, { transaction: t });
      if (!exp) throw new NotFoundError("Expense not found");
      if (
        exp.createdByUserId !== req.userId &&
        exp.paidByUserId !== req.userId
      )
        throw new ForbiddenError();

      const schema = Yup.object().shape({
        name: Yup.string(),
        value: Yup.number().positive(),
        currency: Yup.string().min(3).max(8),
        date: Yup.string(),
        memberIds: Yup.array()
          .of(Yup.number().integer().positive())
          .min(1),
        paidByUserId: Yup.number().integer().positive(),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const {
        name,
        value,
        currency,
        date,
        memberIds,
        paidByUserId: bodyPaidBy,
      } = req.body;

      let paidByUserId = exp.paidByUserId;
      if (bodyPaidBy !== undefined) paidByUserId = bodyPaidBy;

      if (memberIds) {
        const uniqueMembers = [...new Set(memberIds)];
        if (uniqueMembers.length !== memberIds.length)
          throw new ValidationError("Duplicate members");
        if (!uniqueMembers.includes(paidByUserId))
          throw new ValidationError("Payer must be included in members");

        const users = await User.findAll({
          where: { id: { [Op.in]: uniqueMembers } },
          transaction: t,
        });
        if (users.length !== uniqueMembers.length)
          throw new BadRequestError("Unknown user in members");

        const totalVal = value !== undefined ? value : Number(exp.value);
        const shares = equalSplit(uniqueMembers, totalVal);

        await ExpenseSplit.destroy({
          where: { expenseId },
          transaction: t,
        });
        await ExpenseSplit.bulkCreate(
          shares.map((s) => ({
            expenseId,
            userId: s.userId,
            shareAmount: s.shareAmount,
          })),
          { transaction: t }
        );
      } else if (value !== undefined || paidByUserId !== exp.paidByUserId) {
        const splits = await ExpenseSplit.findAll({
          where: { expenseId },
          transaction: t,
        });
        const memberIdsCurrent = splits.map((s) => s.userId);
        const totalVal = value !== undefined ? value : Number(exp.value);
        if (!memberIdsCurrent.includes(paidByUserId))
          throw new ValidationError("Payer must be among existing members");

        const shares = equalSplit(memberIdsCurrent, totalVal);
        await ExpenseSplit.destroy({ where: { expenseId }, transaction: t });
        await ExpenseSplit.bulkCreate(
          shares.map((s) => ({
            expenseId,
            userId: s.userId,
            shareAmount: s.shareAmount,
          })),
          { transaction: t }
        );
      }

      const nextValue =
        value !== undefined ? round2(value) : exp.value;
      const nextCurrency =
        currency !== undefined ? currency.toUpperCase() : exp.currency;
      const nextDate = date !== undefined ? date : exp.date;
      const nextName = name !== undefined ? name : exp.name;

      await exp.update(
        {
          name: nextName,
          value: nextValue,
          currency: nextCurrency,
          date: nextDate,
          paidByUserId,
        },
        { transaction: t }
      );

      await t.commit();

      const updated = await Expense.findByPk(expenseId, {
        include: [
          {
            model: ExpenseSplit,
            as: "splits",
            include: [
              { model: User, as: "user", attributes: ["id", "name", "email"] },
            ],
          },
          { model: User, as: "payer", attributes: ["id", "name", "email"] },
        ],
      });

      return res.status(200).json(updated);
    } catch (error) {
      await t.rollback();
      next(error);
    }
  },

  remove: async (req, res, next) => {
    const t = await Expense.sequelize.transaction();
    try {
      const expenseId = Number(req.params.id);
      const exp = await Expense.findByPk(expenseId, { transaction: t });
      if (!exp) throw new NotFoundError("Expense not found");
      if (
        exp.createdByUserId !== req.userId &&
        exp.paidByUserId !== req.userId
      )
        throw new ForbiddenError();

      await ExpenseSplit.destroy({ where: { expenseId }, transaction: t });
      await exp.destroy({ transaction: t });
      await t.commit();

      return res.status(200).json({ msg: "Deleted" });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  },
};

export default expenseController;
