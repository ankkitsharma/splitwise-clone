import balanceService from "../services/balance.service";

const balanceController = {
  list: async (req, res, next) => {
    try {
      const rows = await balanceService.getBalancesForUser(req.userId);
      return res.status(200).json(rows);
    } catch (error) {
      next(error);
    }
  },
};

export default balanceController;
