import * as Yup from "yup";
import Address from "../models/Address";
import Expense from "../models/Expense";
import ExpenseSplit from "../models/ExpenseSplit";
import User from "../models/User";
import {
  BadRequestError,
  UnauthorizedError,
  ValidationError,
} from "../utils/ApiError";

//Yup is a JavaScript schema builder for value parsing and validation.

let userController = {
  add: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string().required(),
        email: Yup.string().email().required(),
        password: Yup.string().required().min(6),
        defaultCurrency: Yup.string().min(3).max(8),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const { email } = req.body;

      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) throw new BadRequestError();

      const payload = {
        ...req.body,
        defaultCurrency: (req.body.defaultCurrency || "USD").toUpperCase(),
      };

      const user = await User.create(payload);

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  addAddress: async (req, res, next) => {
    try {
      const { body, userId } = req;

      const schema = Yup.object().shape({
        city: Yup.string().required(),
        state: Yup.string().required(),
        neighborhood: Yup.string().required(),
        country: Yup.string().required(),
      });

      if (!(await schema.isValid(body.address))) throw new ValidationError();

      const user = await User.findByPk(userId);

      let address = await Address.findOne({
        where: { ...body.address },
      });

      if (!address) {
        address = await Address.create(body.address);
      }

      await user.addAddress(address);

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const users = await User.findAll();

      return res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.userId);

      if (!user) throw new BadRequestError();

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  find: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) throw new BadRequestError();

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string(),
        email: Yup.string().email(),
        defaultCurrency: Yup.string().min(3).max(8),
        oldPassword: Yup.string().min(6),
        password: Yup.string()
          .min(6)
          .when("oldPassword", (oldPassword, field) => {
            if (oldPassword) {
              return field.required();
            } else {
              return field;
            }
          }),
        confirmPassword: Yup.string().when("password", (password, field) => {
          if (password) {
            return field.required().oneOf([Yup.ref("password")]);
          } else {
            return field;
          }
        }),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const { email, oldPassword } = req.body;

      const user = await User.unscoped().findByPk(req.userId);

      if (!user) throw new BadRequestError();

      if (email) {
        const userExists = await User.findOne({
          where: { email },
        });

        if (userExists && userExists.id !== user.id) throw new BadRequestError();
      }

      if (oldPassword && !(await user.checkPassword(oldPassword)))
        throw new UnauthorizedError();

      const updates = { ...req.body };
      if (updates.defaultCurrency)
        updates.defaultCurrency = updates.defaultCurrency.toUpperCase();

      await user.update(updates);

      const publicUser = await User.findByPk(req.userId);

      return res.status(200).json(publicUser);
    } catch (error) {
      next(error);
    }
  },

  deleteMe: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.userId);
      if (!user) throw new BadRequestError();

      const paidCount = await Expense.count({
        where: { paidByUserId: user.id },
      });
      const splitCount = await ExpenseSplit.count({
        where: { userId: user.id },
      });

      if (paidCount > 0 || splitCount > 0) {
        throw new BadRequestError(
          "Cannot delete account while associated expenses exist"
        );
      }

      await user.destroy();

      return res.status(200).json({ msg: "Deleted" });
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
