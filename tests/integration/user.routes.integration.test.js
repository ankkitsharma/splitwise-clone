import {
  getTestContext,
  resetDatabase,
  registerUser,
} from "../helpers/testContext";

describe("user.routes", () => {
  let agent;

  beforeAll(async () => {
    ({ agent } = await getTestContext());
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe("POST /user", () => {
    it("creates a user without exposing password fields", async () => {
      const res = await agent
        .post("/user")
        .send({
          name: "Alice",
          email: "alice@example.com",
          password: "secret12",
          defaultCurrency: "usd",
        })
        .expect(200);

      expect(res.body.email).toBe("alice@example.com");
      expect(res.body.defaultCurrency).toBe("USD");
      expect(res.body.password).toBeUndefined();
      expect(res.body.password_hash).toBeUndefined();
    });

    it("returns 400 for invalid body", async () => {
      await agent
        .post("/user")
        .send({ name: "x", email: "not-email", password: "short" })
        .expect(400);
    });

    it("returns 400 when email already exists", async () => {
      await agent
        .post("/user")
        .send({
          name: "A",
          email: "dup@example.com",
          password: "secret12",
        })
        .expect(200);

      await agent
        .post("/user")
        .send({
          name: "B",
          email: "dup@example.com",
          password: "secret12",
        })
        .expect(400);
    });
  });

  describe("GET /user/me", () => {
    it("returns current user when X-User-Id is set", async () => {
      const u = await registerUser(agent, {
        name: "Bob",
        email: "bob@example.com",
      });

      const res = await agent
        .get("/user/me")
        .set("X-User-Id", String(u.id))
        .expect(200);

      expect(res.body.email).toBe("bob@example.com");
    });

    it("returns 401 without auth", async () => {
      await agent.get("/user/me").expect(401);
    });
  });

  describe("GET /user", () => {
    it("lists users", async () => {
      await registerUser(agent, { email: "l1@example.com" });
      await registerUser(agent, { email: "l2@example.com" });

      const res = await agent.get("/user").expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe("GET /user/:id", () => {
    it("returns a user by id", async () => {
      const u = await registerUser(agent, { email: "find@example.com" });

      const res = await agent.get(`/user/${u.id}`).expect(200);
      expect(res.body.id).toBe(u.id);
      expect(res.body.email).toBe("find@example.com");
    });

    it("returns 400 when user does not exist", async () => {
      await agent.get("/user/99999").expect(400);
    });
  });

  describe("PUT /user", () => {
    it("updates profile fields", async () => {
      const u = await registerUser(agent, { email: "upd@example.com" });

      const res = await agent
        .put("/user")
        .set("X-User-Id", String(u.id))
        .send({ name: "Updated Name", defaultCurrency: "eur" })
        .expect(200);

      expect(res.body.name).toBe("Updated Name");
      expect(res.body.defaultCurrency).toBe("EUR");
    });

    it("changes password when old password is correct", async () => {
      const u = await registerUser(agent, { email: "pwd@example.com" });

      await agent
        .put("/user")
        .set("X-User-Id", String(u.id))
        .send({
          oldPassword: "secret12",
          password: "newpass12",
          confirmPassword: "newpass12",
        })
        .expect(200);

      await agent
        .post("/login")
        .send({ email: "pwd@example.com", password: "newpass12" })
        .expect(200);
    });
  });

  describe("POST /user/address", () => {
    it("links an address to the user", async () => {
      const u = await registerUser(agent, { email: "addr@example.com" });

      const res = await agent
        .post("/user/address")
        .set("X-User-Id", String(u.id))
        .send({
          address: {
            city: "NYC",
            state: "NY",
            neighborhood: "SoHo",
            country: "USA",
          },
        })
        .expect(200);

      expect(res.body.id).toBe(u.id);
    });

    it("returns 400 for invalid address body", async () => {
      const u = await registerUser(agent, { email: "badaddr@example.com" });

      await agent
        .post("/user/address")
        .set("X-User-Id", String(u.id))
        .send({ address: { city: "x" } })
        .expect(400);
    });
  });

  describe("DELETE /user", () => {
    it("deletes user when no expenses exist", async () => {
      const u = await registerUser(agent, { email: "del@example.com" });

      await agent
        .delete("/user")
        .set("X-User-Id", String(u.id))
        .expect(200);

      await agent.get(`/user/${u.id}`).expect(400);
    });

    it("returns 400 when user has expense involvement", async () => {
      const a = await registerUser(agent, { email: "pa@example.com" });
      const b = await registerUser(agent, { email: "pb@example.com" });

      await agent
        .post("/expenses")
        .set("X-User-Id", String(a.id))
        .send({
          name: "Trip",
          value: 50,
          currency: "USD",
          date: "2026-05-01",
          memberIds: [a.id, b.id],
          paidByUserId: a.id,
        })
        .expect(201);

      await agent
        .delete("/user")
        .set("X-User-Id", String(a.id))
        .expect(400);
    });
  });
});
