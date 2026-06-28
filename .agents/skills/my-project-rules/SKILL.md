---
name: vue-catchrewards-harness
description: Vue.js + Supabase를 사용한 용돈 관리 애플리케이션 개발을 위한 하네스 및 자동 검증 지침
---

## 1. 기술 스택 (Environment)

* **Framework**: Vue.js 3 (Vite, Composition API, `<script setup>`)
* **Backend**: Supabase (JS SDK, Realtime Enabled)
* **CSS**: Tailwind CSS

## 2. 코딩 철학 및 Superpowers 하네스 루프 (Testing & Verification)

* **비즈니스 가치 지향**: UI 컴포넌트 하나를 짜더라도 추후 유료 멤버십, 광고 확장, 결제 모듈 연동 등 상업적 확장성(BM)을 고려하여 설계한다.
* **TDD(테스트 주도) 필수**: 모든 기능(예: 미션 등록, 용돈 지급)을 개발하기 전, AI 너는 스스로 '성공/실패 시나리오'를 담은 테스트 검증 체크리스트를 먼저 작성하라.
* **자가 검증 루프**: 코드를 작성한 후, 스스로 작성한 체크리스트를 하나씩 대입하여 가상 시뮬레이션을 돌려라. 만약 '부모 모드'에서 승인했을 때 '자녀 모드'의 잔액 상태(State)가 즉시 갱신되지 않는 등의 엣지 케이스가 발견되면, 사용자에게 코드를 출력하기 전에 스스로 수정(Refactor) 루프를 최소 2회 이상 반복하라.
* **무결성 및 방어적 코딩**: 콘솔 에러(Console Error)나 Supabase 권한(RLS) 에러가 발생할 수 있는 포인트를 사전에 차단하는 방어적 코드(Defensive Programming)를 반드시 포함하라. 세션 및 유저 ID 검증을 철저히 수행한다.

## 3. 구현 및 출력 규칙 (Implementation Rules)

* **코드 생략 및 말줄임표(`// ...`) 절대 금지**: "기존 코드와 동일", "중략", "여기에 로직 구현" 등의 핑계로 코드를 일부만 출력하는 행위를 엄격히 금지한다. 전체 맥락을 파악하고 사용자가 파일에 바로 덮어쓸 수 있는(Copy & Paste) 완전한 전체 컴포넌트 코드(Full Code)만 제공한다.
* **수정 이력 명시**: 기존 코드를 수정하여 재출력할 때는, 코드 최상단 주석에 `[수정 원인]`과 `[해결 방안]`을 각각 단 한 줄씩 명확히 요약한 후 전체 코드를 전개한다.

