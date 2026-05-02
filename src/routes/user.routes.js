import { Router } from "express";
import userController from "../controllers/user.controller";
import authMiddleware from "../middlewares/auth.middleware";

const userRoutes = Router();
userRoutes.post("/user", userController.add);
userRoutes.get("/user/me", authMiddleware, userController.me);
userRoutes.put("/user", authMiddleware, userController.update);
userRoutes.delete("/user", authMiddleware, userController.deleteMe);
userRoutes.post("/user/address", authMiddleware, userController.addAddress);
userRoutes.get("/user", userController.get);
userRoutes.get("/user/:id", userController.find);

export { userRoutes };
