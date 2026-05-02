import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import globalErrorHandler from "../middlewares/errorHandler.middleware";
/*
  body-parser: Parse incoming request bodies in a middleware before your handlers, 
  available under the req.body property.
*/

const routeFiles = fs
  .readdirSync(__dirname + "/../routes/")
  .filter((file) => file.endsWith(".js"));

async function buildApp() {
  const routes = [];
  for (const file of routeFiles) {
    const route = await import(`../routes/${file}`);
    const routeName = Object.keys(route)[0];
    routes.push(route[routeName]);
  }

  const app = express();
  app.use(bodyParser.json());
  app.use(routes);
  app.use(globalErrorHandler);
  return app;
}

const expressService = {
  buildApp,

  init: async () => {
    try {
      const app = await buildApp();
      app.listen(process.env.SERVER_PORT);
      console.log("[EXPRESS] Express initialized");
    } catch (error) {
      console.log("[EXPRESS] Error during express service initialization");
      throw error;
    }
  },
};

export default expressService;
