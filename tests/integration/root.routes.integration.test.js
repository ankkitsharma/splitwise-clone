import { getTestContext, resetDatabase } from "../helpers/testContext";

describe("root.routes", () => {
  let agent;

  beforeAll(async () => {
    ({ agent } = await getTestContext());
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("GET / returns welcome message with host", async () => {
    const res = await agent.get("/").expect(200);

    expect(res.type).toBe("text/plain");
    expect(res.text).toContain("Welcome to splitwise-clone running at:");
  });
});

