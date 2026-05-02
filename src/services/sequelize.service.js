import { Sequelize } from "sequelize";
import databaseConfig from "../config/database";
import fs from "fs";

const modelFiles = fs
  .readdirSync(__dirname + "/../models/")
  .filter((file) => file.endsWith(".js"));

let sequelizeInstance = null;

const sequelizeService = {
  getSequelize: () => sequelizeInstance,

  init: async () => {
    try {
      sequelizeInstance = new Sequelize(databaseConfig);

      for (const file of modelFiles) {
        const model = await import(`../models/${file}`);
        model.default.init(sequelizeInstance);
      }

      for (const file of modelFiles) {
        const model = await import(`../models/${file}`);
        if (model.default.associate) {
          model.default.associate(sequelizeInstance.models);
        }
      }

      console.log("[SEQUELIZE] Database service initialized");
    } catch (error) {
      console.log("[SEQUELIZE] Error during database service initialization");
      throw error;
    }
  },
};

export default sequelizeService;
