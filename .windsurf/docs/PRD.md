# PRD (Product Requirements Document)

## 프로젝트 개요
- **프로젝트명**: 똘똘이 용돈 미션 센터 (Catch Rewards)
- **목표**: 가족 맞춤형 미션·독서·포인트 관리 시스템을 통해 자녀의 자율적인 습관 형성과 가족 소통을 촉진
- **타겟 사용자**: 부모(훈남), 자녀(봄이, 여름이)

## 기술 스택
- **Frontend**: Vue.js 3 (Vite, Composition API, `<script setup>`)
- **Backend**: Supabase (JS SDK, Realtime Enabled)
- **CSS**: Tailwind CSS
- **인증**: Supabase Auth

## 핵심 기능 명세

### 1. 인증 시스템 (Authentication)

#### 1.1 로그인
- **계정 프리셋**: `accountPresets` 배열로 관리 (동적 리스트 표시)
  - 훈남 (부모): hunam@family.com
  - 봄이 (자녀): spring@family.com
  - 여름이 (자녀): summer@family.com
- **로그인 방식**: 이메일 + 비밀번호 (Supabase Auth)
- **UI**: 계정별 버튼 클릭 시 이메일 자동 입력, 비밀번호 수동 입력

#### 1.2 세션 관리
- **세션 유지**: `supabase.auth.onAuthStateChange`로 세션 상태 감지
- **자동 로그인**: 브라우저 새로고침 시 세션 유지
- **로그아웃**: 우측 상단 로그아웃 버튼

#### 1.3 비밀번호 변경
- **위치**: 설정 팝업 내
- **기능**: 현재 비밀번호 + 새 비밀번호 + 확인 비밀번호
- **API**: `supabase.auth.updateUser({ password: new_password })`

### 2. 메인 대시보드 (Home)

#### 2.1 사용자 정보 헤더
- **사용자 이름**: 현재 로그인한 사용자 표시
- **레벨/칭호**: 누적 포인트 기반 (브론즈 효도러 → 실버 용돈 장인 → 골드 가문의 영광)
- **잔액 표시**: 현금(원) + 포인트(P)
- **버튼**: 설정(⚙️), 로그아웃

#### 2.2 진행 중인 미션 스코어카드
- **위치**: 대시보드 상단
- **내용**: 진행 중인 미션 목록 (제목, 보상, 진행률)
- **빈 상태**: 미션이 없을 경우 감성 메시지 표시

#### 2.3 정산일 D-Day 스케줄러
- **표시**: 다음 정산일까지 남은 D-Day
- **정산 주기**: 매주 토요일 또는 매월 1일 (설정 가능)
- **예상 정산액**: 현재까지 획득한 총 보상

#### 2.4 가훈/가칙 섹션
- **토글 기능**: 펼치기/접기 버튼
- **내용**: 가훈, 가칙 리스트
- **오늘의 정직 서약**: 자녀 전용 버튼 (클릭 시 타임라인에 자동 게시)

### 3. 미션 관리 (Missions)

#### 3.1 미션 생성 (부모 전용)
- **입력 필드**: 제목, 설명, 보상 금액, 보상 유형(현금/포인트), 주기(일간/주간/월간)
- **주기 선택**: 일간/주간/월간 드롭다운
- **보상 유형**: 현금(원) 또는 포인트(P) 구분

#### 3.2 미션 제안 (자녀 전용)
- **역제안 폼**: 자녀가 원하는 미션 제안
- **승인/거절**: 부모가 제안 승인 또는 거절
- **상태**: 대기 중, 승인됨, 거절됨

#### 3.3 미션 완료
- **완료 버튼**: 자녀가 미션 완료 클릭
- **부모 승인**: 부모가 완료 승인 후 보상 지급
- **자동 타임라인**: 완료 시 타임라인에 자동 게시

### 4. 독서 미션 (Reading)

#### 4.1 위시리스트 도서
- **도서 목록**: 읽고 싶은 책 리스트
- **상태**: 읽기 전, 읽는 중, 완료

#### 4.2 완료 요청
- **필수 입력**: 한 줄 평(感想)
- **유효성 검증**: 한 줄 평 미입력 시 요청 불가
- **부모 승인**: 부모 승인 후 보상 지급

### 5. 종합 통계 (Statistics)

#### 5.1 일간 획득 현황
- **형태**: 리스트
- **내용**: 이번 달 완료된 미션 목록 (날짜, 제목, 보상)
- **빈 상태**: 완료된 미션이 없을 경우 메시지 표시

#### 5.2 주간 획득 현황
- **형태**: 막대 그래프
- **축**: 요일별 (월~일)
- **색상**: 블루 계열 그라데이션 (blue-100 ~ blue-700)
- **총계**: 주간 총 현금/포인트

#### 5.3 월간 획득 현황
- **형태**: 막대 그래프
- **축**: 주별 (1주~4주)
- **색상**: 인디고 계열 그라데이션 (indigo-100 ~ indigo-400)
- **총계**: 월간 총 현금/포인트

### 6. 포인트 몰 (Point Mall)

#### 6.1 보상 아이템 등록 (부모 전용)
- **입력 필드**: 아이템명, 이모지, 필요 포인트
- **등록**: 포인트 몰에 아이템 추가

#### 6.2 아이템 구매 (자녀 전용)
- **목록 표시**: 등록된 아이템 리스트
- **구매 버튼**: 클릭 시 포인트 차감
- **실시간 차감**: 구매 즉시 포인트 감소

#### 6.3 구매 알림 (부모 전용)
- **알림**: 자녀가 아이템 구매 시 부모에게 알림
- **내용**: 구매 아이템, 구매자, 구매 시간

### 7. 가족 타임라인 (Family Timeline)

#### 7.1 실시간 피드
- **위치**: 화면 하단
- **기능**: 가족 구성원이 한 줄 메시지/이모지 게시
- **자동 게시**: 미션 완료, 정직 서약 등 이벤트 자동 게시

#### 7.2 Supabase Realtime
- **실시간 동기화**: 타임라인 업데이트 즉시 반영
- **채널 구독**: `subscribeToRealtimeUpdates`로 실시간 감지

### 8. 비주얼 가이드라인 (Visual Guidelines)

#### 8.1 색상 팔레트
- **배경**: 화이트, 라이트 그레이 (`bg-gray-50`)
- **포인트 컬러**: 딥 블루 (`text-blue-600`, `bg-blue-600`)
- **텍스트**: 슬레이트 그레이 (`text-slate-900`)

#### 8.2 레이아웃
- **카드**: `rounded-2xl`, `shadow-sm`
- **패딩**: `p-5`, `p-6`
- **텍스트 처리**: `flex-shrink-0`, `white-space-nowrap` (한글 짤림 방지)

#### 8.3 디자인 스타일
- **참조**: 토스, 카카오뱅크 스타일
- **모바일 우선**: 카드 레이아웃, 둥근 모서리, 부드러운 그림자

### 9. Supabase Realtime 연동

#### 9.1 상태 동기화
- **함수**: `syncStateWithSupabase(state, tableName)`
- **기능**: 로컬 상태와 Supabase DB 동기화

#### 9.2 무결성 검증
- **함수**: `validateStateIntegrity(localState, tableName)`
- **기능**: 화면 전환 시 상태 무결성 체크
- **오류 처리**: 불일치 시 사용자 알림

#### 9.3 실시간 구독
- **함수**: `subscribeToRealtimeUpdates(tableName, onInsert, onUpdate, onDelete)`
- **이벤트**: INSERT, UPDATE, DELETE 감지
- **해지**: `unsubscribeFromRealtime()`로 컴포넌트 언마운트 시 해지

## 데이터 모델 (Data Model)

### 계정 (Accounts)
- email: string (고유)
- name: string
- role: 'parent' | 'child'

### 미션 (Missions)
- id: string (고유)
- title: string
- description: string
- rewardAmount: number
- rewardType: 'cash' | 'points'
- recurrence: 'daily' | 'weekly' | 'monthly'
- status: 'pending' | 'in_progress' | 'completed'
- createdBy: string (부모 email)
- assignedTo: string (자녀 email)

### 제안 (Proposals)
- id: string (고유)
- title: string
- description: string
- rewardAmount: number
- rewardType: 'cash' | 'points'
- status: 'pending' | 'approved' | 'rejected'
- proposedBy: string (자녀 email)
- reviewedBy: string (부모 email)

### 독서 (Reading)
- id: string (고유)
- title: string
- author: string
- status: 'wishlist' | 'reading' | 'completed'
- review: string (한 줄 평)
- completedBy: string (자녀 email)

### 보상 아이템 (Reward Items)
- id: string (고유)
- name: string
- emoji: string
- requiredPoints: number
- createdBy: string (부모 email)

### 구매 내역 (Purchases)
- id: string (고유)
- itemId: string
- purchasedBy: string (자녀 email)
- purchasedAt: timestamp

### 타임라인 (Timeline)
- id: string (고유)
- content: string
- author: string
- createdAt: timestamp
- type: 'manual' | 'auto' (자동 게시 여부)

## 향후 개발 계획 (Future Roadmap)

### Phase 2
- 유료 멤버십 기능
- 광고 모듈 연동
- 결제 시스템 통합

### Phase 3
- 여러 가족 그룹 지원
- 미션 템플릿 마켓
- AI 기반 미션 추천
