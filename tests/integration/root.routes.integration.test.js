import { getTestContext, resetDatabase } from "../helpers/testContext";

describe("root.routes", () => {
  let agent;

  beforeAll(async () => {
    ({ agent } = await getTestContext());
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("GET / returns running host and port", async () => {
    const res = await agent.get("/").expect(200);

    expect(res.body.host).toBeTruthy();
  });
});

