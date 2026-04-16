import { request } from "@/services/api";
import { mapCompany, type ApiCompany } from "@/services/mappers";
import type { Company } from "@/types/company";

export async function getCompanies(search?: string): Promise<Company[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const rows = await request<ApiCompany[]>(`/companies/${query}`);
  return rows.map(mapCompany);
}
