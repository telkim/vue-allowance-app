---
name: vue-allowance-harness
description: ALWAYS active for the Vue.js + Supabase allowance application to enforce automated testing and error-free code generation.
---
# 하네스 구동 및 자동 검증 지침

## 1. 기술 스택 (Environment)
- Framework: Vue.js 3 (Vite, Composition API, `<script setup>`)
- Backend: Supabase (JS SDK, Realtime Enabled)
- CSS: Tailwind CSS

## 2. Superpowers 하네스 루프 (Testing & Verification)
- **TDD(테스트 주도) 필수**: 모든 기능(예: 미션 등록, 용돈 지급)을 개발하기 전, AI 너는 스스로 '성공/실패 시나리오'를 담은 테스트 검증 체크리스트를 먼저 작성하라.
- **자가 검증 루프**: 코드를 작성한 후, 스스로 작성한 체크리스트를 하나씩 대입하여 가상 시뮬레이션을 돌려라. 만약 '부모 모드'에서 승인했을 때 '자녀 모드'의 잔액 상태(State)가 즉시 갱신되지 않는 등의 엣지 케이스가 발견되면, 사용자에게 코드를 출력하기 전에 스스로 수정(Refactor) 루프를 최소 2회 이상 반복하라.
- **무결성 검증**: 콘솔 에러(Console Error)나 Supabase 권한(RLS) 에러가 발생할 수 있는 포인트를 사전에 차단하는 방어적 코드(Defensive Programming)를 반드시 포함하라.

## 3. 출력 규칙 (Output Rules)
- 코드 생략(예: `// 기존 코드와 동일`)은 절대 금지한다. 전체 맥락을 파악하고 바로 파일에 덮어쓸 수 있는 **완전한 컴포넌트 코드**만 제공하라.
- 수정 사항이 생기면 코드 상단 주석에 `[수정 원인]`과 `[해결 방안]`을 단 두 줄로 요약한 후 코드를 작성하라.