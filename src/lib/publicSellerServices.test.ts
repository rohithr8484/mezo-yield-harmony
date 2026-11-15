import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), order: vi.fn(), range: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
import { loadPublicSellerServices } from "./publicSellerServices";

const row = (id: number, seller = "0xother") => ({
  id: String(id), listing_id: `${seller}:${id}`, seller_address: seller,
  template_id: "text-summarizer", title: `Service ${id}`, category: "AI",
  description: "Summary", endpoint: "/api/summarize", deployed_at: "2026-11-15T00:00:00Z",
});
beforeEach(() => {
  vi.resetAllMocks();
  const query = { select: mocks.select, order: mocks.order, range: mocks.range };
  mocks.from.mockReturnValue(query);
  mocks.select.mockReturnValue(query);
  mocks.order.mockReturnValue(query);
});
describe("public deployed services", () => {
  it("loads deployments from different sellers without needing a connected wallet or changing local listings", async () => {
    localStorage.setItem("developer_seller_services_v1", "[]");
    mocks.range.mockResolvedValue({ data: [row(1, "0xfirst"), row(2, "0xsecond")], error: null });
    const services = await loadPublicSellerServices();
    expect(services.map((service) => service.sellerAddress)).toEqual(["0xfirst", "0xsecond"]);
    expect(services.map((service) => service.deploymentId)).toEqual(["1", "2"]);
    expect(localStorage.getItem("developer_seller_services_v1")).toBe("[]");
  });
  it("reads beyond the first page so all deployed sellers are included", async () => {
    mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 100 }, (_, id) => row(id)), error: null })
      .mockResolvedValueOnce({ data: [row(100)], error: null });
    expect(await loadPublicSellerServices()).toHaveLength(101);
    expect(mocks.range).toHaveBeenNthCalledWith(2, 100, 199);
  });
  it("retains the existing hidden seller Analytics rule", async () => {
    mocks.range.mockResolvedValue({ data: [row(1), { ...row(2), template_id: "wallet-analytics" }], error: null });
    expect((await loadPublicSellerServices()).map((service) => service.id)).toEqual(["text-summarizer"]);
  });
  it("reports registry failures instead of presenting an empty successful listing", async () => {
    mocks.range.mockResolvedValue({ data: null, error: new Error("Unavailable") });
    await expect(loadPublicSellerServices()).rejects.toThrow("Unavailable");
  });
});