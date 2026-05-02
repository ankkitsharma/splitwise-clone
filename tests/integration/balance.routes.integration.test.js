import {
  getTestContext,
  resetDatabase,
  registerUser,
} from "../helpers/testContext";

describe("balance.routes", () => {
  let agent;

  beforeAll(async () => {
    ({ agent } = await getTestContext());
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe("GET /balances", () => {
    it("returns net balances per counterparty", async () => {
      const a = await registerUser(agent, { email: "payer@example.com" });
      const b = await registerUser(agent, { email: "other@example.com" });

      await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "Dinner",
          value: 100,
          currency: "USD",
          date: "2026-05-01",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      const res = await agent
        .get("/balances")
        .set("X-User-Id", String(a.id))
        .expect(200);

      const row = res.body.find((r) => r.counterpartyId === b.id);
      expect(row).toBeDefined();
      expect(row.currency).toBe("USD");
      expect(Number(row.balanceAmount)).toBe(50);
      expect(row.direction).toBe("they_owe_you");
    });

    it("returns 401 without auth", async () => {
      await agent.get("/balances").expect(401);
    });
  });
});
