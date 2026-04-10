import { DUMMY_COMPANIES } from "@/data/companies";
import type { Company } from "@/types/company";

export async function getCompanies(search?: string): Promise<Company[]> {
  let companies = [...DUMMY_COMPANIES];

  if (search) {
    const q = search.toLowerCase();
    companies = companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.sector && c.sector.toLowerCase().includes(q)) ||
        (c.domain && c.domain.toLowerCase().includes(q))
    );
  }

  return companies;
}
