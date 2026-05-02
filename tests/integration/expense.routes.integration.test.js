import {
  getTestContext,
  resetDatabase,
  registerUser,
} from "../helpers/testContext";

describe("expense.routes", () => {
  let agent;

  beforeAll(async () => {
    ({ agent } = await getTestContext());
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  async function twoUsers() {
    const a = await registerUser(agent, { email: "pa@example.com" });
    const b = await registerUser(agent, { email: "pb@example.com" });
    return { a, b };
  }

  describe("POST /expenses", () => {
    it("creates an expense with equal split", async () => {
      const { a, b } = await twoUsers();

      const res = await agent
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

      expect(res.body.name).toBe("Dinner");
      expect(res.body.splits.length).toBe(2);
    });

    it("returns 400 for invalid body", async () => {
      const { a, b } = await twoUsers();

      await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "",
          value: -1,
          currency: "US",
          date: "2026-05-01",
          memberIds: [a.id, b.id],
        })
        .expect(400);
    });

    it("returns 400 for duplicate members", async () => {
      const { a, b } = await twoUsers();

      await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "X",
          value: 10,
          currency: "USD",
          date: "2026-05-01",
          memberIds: [a.id, b.id, a.id],
          paidByUserId: a.id,
        })
        .expect(400);
    });

    it("returns 400 when payer is not in members", async () => {
      const { a, b } = await twoUsers();
      const c = await registerUser(agent, { email: "pc@example.com" });

      await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "X",
          value: 10,
          currency: "USD",
          date: "2026-05-01",
          memberIds: [a.id, b.id],
          paidByUserId: c.id,
        })
        .expect(400);
    });

    it("returns 400 for unknown member id", async () => {
      const { a, b } = await twoUsers();

      await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "X",
          value: 10,
          currency: "USD",
          date: "2026-05-01",
          memberIds: [a.id, b.id, 999999],
          paidByUserId: a.id,
        })
        .expect(400);
    });
  });

  describe("GET /expenses", () => {
    it("lists expenses for the current user", async () => {
      const { a, b } = await twoUsers();

      await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "Lunch",
          value: 40,
          currency: "USD",
          date: "2026-05-02",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      const res = await agent
        .get("/expenses")
        .set("X-User-Id", String(a.id))
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Lunch");
    });
  });

  describe("GET /expenses/:id", () => {
    it("returns expense detail for a participant", async () => {
      const { a, b } = await twoUsers();

      const created = await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "Trip",
          value: 60,
          currency: "USD",
          date: "2026-05-03",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      const res = await agent
        .get(`/expenses/${created.body.id}`)
        .set("X-User-Id", String(b.id))
        .expect(200);

      expect(res.body.name).toBe("Trip");
    });

    it("returns 404 when expense does not exist", async () => {
      const u = await registerUser(agent, { email: "solo@example.com" });

      await agent
        .get("/expenses/99999")
        .set("X-User-Id", String(u.id))
        .expect(404);
    });

    it("returns 403 when user is not involved", async () => {
      const { a, b } = await twoUsers();
      const c = await registerUser(agent, { email: "outsider@example.com" });

      const created = await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "Private",
          value: 20,
          currency: "USD",
          date: "2026-05-04",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      await agent
        .get(`/expenses/${created.body.id}`)
        .set("X-User-Id", String(c.id))
        .expect(403);
    });
  });

  describe("PUT /expenses/:id", () => {
    it("updates expense when caller is creator or payer", async () => {
      const { a, b } = await twoUsers();

      const created = await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "Old",
          value: 100,
          currency: "USD",
          date: "2026-05-05",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      const res = await agent
        .put(`/expenses/${created.body.id}`)
        .set("X-User-Id", String(a.id))
        .send({ name: "New title", value: 200 })
        .expect(200);

      expect(res.body.name).toBe("New title");
      expect(Number(res.body.value)).toBe(200);
    });

    it("returns 403 when caller is not creator or payer", async () => {
      const { a, b } = await twoUsers();
      const c = await registerUser(agent, { email: "noc@example.com" });

      const created = await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "X",
          value: 30,
          currency: "USD",
          date: "2026-05-06",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      await agent
        .put(`/expenses/${created.body.id}`)
        .set("X-User-Id", String(c.id))
        .send({ name: "Hack" })
        .expect(403);
    });
  });

  describe("DELETE /expenses/:id", () => {
    it("deletes expense when caller is creator or payer", async () => {
      const { a, b } = await twoUsers();

      const created = await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "Temp",
          value: 25,
          currency: "USD",
          date: "2026-05-07",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      await agent
        .delete(`/expenses/${created.body.id}`)
        .set("X-User-Id", String(a.id))
        .expect(200);

      await agent
        .get(`/expenses/${created.body.id}`)
        .set("X-User-Id", String(a.id))
        .expect(404);
    });

    it("returns 403 when caller is not creator or payer", async () => {
      const { a, b } = await twoUsers();
      const c = await registerUser(agent, { email: "no-del@example.com" });

      const created = await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "Y",
          value: 15,
          currency: "USD",
          date: "2026-05-08",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      await agent
        .delete(`/expenses/${created.body.id}`)
        .set("X-User-Id", String(c.id))
        .expect(403);
    });
  });
});
