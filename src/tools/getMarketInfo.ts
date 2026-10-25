import "server-only";
import { getSupabase } from "@/lib/supabase";

export async function getMarketInfo(category: string) {
  const { data, error } = await getSupabase()
    .from("market_signals")
    .select("category, title, insight, source_label, sample_as_of")
    .limit(30);
  if (error) throw new Error(`시장 참고자료 조회에 실패했습니다: ${error.message}`);

  const term = category.toLocaleLowerCase("ko").replaceAll(" ", "");
  const signals = (data ?? []).filter((item) =>
    `${item.category} ${item.title} ${item.insight}`.toLocaleLowerCase("ko").replaceAll(" ", "").includes(term)
      || term.includes(item.category.toLocaleLowerCase("ko").replaceAll(" ", "")),
  );
  return { category, isSeedData: true, count: signals.length, signals };
}
