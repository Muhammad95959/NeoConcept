import router from "./studentRequests.routes";

describe("studentRequests routes", () => {
  it("registers all expected endpoints", () => {
    const routes = (router as any).stack.filter((layer: any) => layer.route);

    expect(routes).toHaveLength(5);
    expect(routes.map((layer: any) => [Object.keys(layer.route.methods)[0], layer.route.path])).toEqual([
      ["get", "/"],
      ["get", "/:id"],
      ["post", "/"],
      ["patch", "/:id/answer"],
      ["delete", "/:id"],
    ]);
  });

  it("wires middleware and handler per route", () => {
    const routes = (router as any).stack.filter((layer: any) => layer.route);

    for (const layer of routes) {
      expect(layer.route.stack.length).toBeGreaterThanOrEqual(3);
      expect(typeof layer.route.stack[layer.route.stack.length - 1].handle).toBe("function");
    }
  });
});
