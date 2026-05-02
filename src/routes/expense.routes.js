import { Router } from "express";
import expenseController from "../controllers/expense.controller";
import authMiddleware from "../middlewares/auth.middleware";

const expenseRoutes = Router();

expenseRoutes.post("/expenses", authMiddleware, expenseController.create);
expenseRoutes.get("/expenses", authMiddleware, expenseController.list);
expenseRoutes.get("/expenses/:id", authMiddleware, expenseController.find);
expenseRoutes.put("/expenses/:id", authMiddleware, expenseController.update);
expenseRoutes.delete("/expenses/:id", authMiddleware, expenseController.remove);

export { expenseRoutes };
