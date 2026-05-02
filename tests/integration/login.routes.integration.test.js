import {
  getTestContext,
  resetDatabase,
  registerUser,
} from "../helpers/testContext";

describe("login.routes", () => {
  let agent;

  beforeAll(async () => {
    ({ agent } = await getTestContext());
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe("POST /login", () => {
    it("returns user and token for valid credentials", async () => {
      await registerUser(agent, {
        email: "login@example.com",
        password: "secret12",
      });

      const res = await agent
        .post("/login")
        .send({ email: "login@example.com", password: "secret12" })
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("login@example.com");
    });

    it("returns 401 for wrong password", async () => {
      await registerUser(agent, {
        email: "badpw@example.com",
        password: "secret12",
      });

      await agent
        .post("/login")
        .send({ email: "badpw@example.com", password: "wrongpass" })
        .expect(401);
    });

    it("returns 400 for unknown email", async () => {
      await agent
        .post("/login")
        .send({ email: "nobody@example.com", password: "secret12" })
        .expect(400);
    });

    it("returns 400 for invalid body", async () => {
      await agent.post("/login").send({ email: "x" }).expect(400);
    });
  });

  describe("GET /logout", () => {
    it("returns 200 when Authorization Bearer token is present", async () => {
      await registerUser(agent, { email: "out@example.com" });

      const loginRes = await agent
        .post("/login")
        .send({ email: "out@example.com", password: "secret12" })
        .expect(200);

      const token = loginRes.body.token;

      await agent
        .get("/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });
});
