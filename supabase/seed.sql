-- 모든 자료는 워크숍 플로우를 보여주기 위한 가상 시드 데이터입니다.
-- 실제 시장 규모나 외부 조사 결과로 인용하지 마세요.
insert into public.ideas (id, name, category, description, tags) values
  ('idea-pet-health', '반려동물 AI 건강일지', '반려동물 AI', '보호자가 증상과 식사·활동 기록을 남기면 패턴을 요약해 주는 앱 아이디어입니다.', array['AI', '반려동물', '건강', '기록']),
  ('idea-walk-mate', '산책 루틴 메이커', '반려동물', '반려동물의 컨디션과 날씨에 맞춰 산책 루틴을 제안하는 앱 아이디어입니다.', array['산책', '반려동물', '루틴']),
  ('idea-pet-community', '펫 케어 경험 노트', '반려동물', '보호자가 돌봄 경험과 병원 방문 메모를 정리하고 가족과 공유하는 앱 아이디어입니다.', array['반려동물', '커뮤니티', '기록'])
on conflict (id) do update set name = excluded.name, category = excluded.category, description = excluded.description, tags = excluded.tags;

insert into public.market_signals (id, category, title, insight, source_label, sample_as_of) values
  ('signal-health-records', '반려동물', '건강 기록 관리', '진료·증상 기록을 한곳에서 다시 확인하는 사용자 흐름을 검토하는 가설입니다.', '워크숍 가상 시드', date '2026-10-01'),
  ('signal-walk-activity', '반려동물', '산책과 활동 기록', '산책 이력을 주간 요약으로 보여주는 기능을 검토하는 가설입니다.', '워크숍 가상 시드', date '2026-10-01'),
  ('signal-owner-sharing', '반려동물', '가족 간 돌봄 공유', '여러 보호자가 돌봄 메모를 이어 쓰는 흐름을 검토하는 가설입니다.', '워크숍 가상 시드', date '2026-10-01')
on conflict (id) do update set category = excluded.category, title = excluded.title, insight = excluded.insight, source_label = excluded.source_label, sample_as_of = excluded.sample_as_of;
