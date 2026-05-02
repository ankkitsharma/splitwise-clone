import { Router } from "express";
import balanceController from "../controllers/balance.controller";
import authMiddleware from "../middlewares/auth.middleware";

const balanceRoutes = Router();

balanceRoutes.get("/balances", authMiddleware, balanceController.list);

export { balanceRoutes };
