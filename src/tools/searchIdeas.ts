import "server-only";
import { getSupabase } from "@/lib/supabase";

export type Idea = {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
};

export async function searchIdeas(query: string) {
  const { data, error } = await getSupabase()
    .from("ideas")
    .select("id, name, category, description, tags")
    .limit(50);
  if (error) throw new Error(`아이디어 조회에 실패했습니다: ${error.message}`);

  const terms = query.toLocaleLowerCase("ko").split(/\s+/).filter((term) => term.length > 1);
  const ranked = ((data ?? []) as Idea[]).map((idea) => {
    const haystack = [idea.name, idea.category, idea.description, ...idea.tags]
      .join(" ")
      .toLocaleLowerCase("ko");
    return { idea, score: terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0) };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

  return { query, count: ranked.length, ideas: ranked.map(({ idea }) => idea) };
}
