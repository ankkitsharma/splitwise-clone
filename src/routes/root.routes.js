import { Router } from "express";

const rootRoutes = Router();

rootRoutes.get("/", (req, res) => {
  const host = req.get("host") || `localhost:${process.env.SERVER_PORT || ""}`;

  return res
    .status(200)
    .type("text/plain")
    .send(`Welcome to splitwise-clone running at: ${host}`);
});

export { rootRoutes };

