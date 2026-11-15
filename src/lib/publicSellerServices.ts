import { supabase } from "@/integrations/supabase/client";
import { mergeDeployedServices, type DeployedSellerRow, type SellerService } from "./sellerServices";

export type PublicSellerService = SellerService & { deploymentId: string; deployedAt: string };

/** Public registry reads never merge other sellers' listings into browser-owned services. */
export async function loadPublicSellerServices(): Promise<PublicSellerService[]> {
  const rows: (DeployedSellerRow & { id: string })[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("seller_services")
      .select("id, listing_id, deployed_at, seller_address, template_id, title, category, description, endpoint")
      .order("deployed_at", { ascending: false }).order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows.filter((row) => row.template_id !== "wallet-analytics").map((row) => ({
    ...mergeDeployedServices([], [row])[0],
    deploymentId: row.id,
    deployedAt: row.deployed_at,
  }));
}