import supertest from "supertest";
import sequelizeService from "../../src/services/sequelize.service";
import expressService from "../../src/services/express.service";

let cached;

/**
 * Single Sequelize + Express app for all integration tests (Model.init runs once per process).
 */
export async function getTestContext() {
  if (!cached) {
    await sequelizeService.init();
    const sequelize = sequelizeService.getSequelize();
    const app = await expressService.buildApp();
    cached = { sequelize, agent: supertest(app) };
  }
  return cached;
}

export async function resetDatabase() {
  const { sequelize } = await getTestContext();
  await sequelize.sync({ force: true });
}

export async function registerUser(agent, overrides = {}) {
  const payload = {
    name: "User",
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
    password: "secret12",
    ...overrides,
  };
  const res = await agent.post("/user").send(payload).expect(200);
  return res.body;
}
