import {
  getTestContext,
  resetDatabase,
} from "../helpers/testContext";

describe("address.routes", () => {
  let agent;

  beforeAll(async () => {
    ({ agent } = await getTestContext());
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe("POST /address", () => {
    it("creates a standalone address", async () => {
      const res = await agent
        .post("/address")
        .send({
          city: "Seattle",
          state: "WA",
          neighborhood: "Capitol Hill",
          country: "USA",
        })
        .expect(200);

      expect(res.body.city).toBe("Seattle");
      expect(res.body.id).toBeDefined();
    });

    it("returns 400 when address already exists", async () => {
      const body = {
        city: "Portland",
        state: "OR",
        neighborhood: "Pearl",
        country: "USA",
      };

      await agent.post("/address").send(body).expect(200);

      await agent.post("/address").send(body).expect(400);
    });

    it("returns 400 for invalid body", async () => {
      await agent
        .post("/address")
        .send({ city: "x", state: "y" })
        .expect(400);
    });
  });
});
