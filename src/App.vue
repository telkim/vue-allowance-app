<!--
[수정 원인] 기존 화면은 초기 Mock 보드에 머물러 가족 프로필, 미션 제안, 독서, 통계, 포인트 몰 요구사항을 반영하지 못했습니다.
[해결 방안] Composition API 기반 단일 페이지 앱으로 부모/자녀 모드, LocalState 상호작용, Supabase 설정 상태를 완전한 화면으로 구현합니다.
-->
<script setup>
import { computed, reactive, ref } from 'vue'
import {
  approveProposal,
  calculateStats,
  createMission,
  createPointPurchase,
  createProposal,
  createReadingCompletionRequest,
  createRewardItem,
  familyProfile,
  initialFamilyState,
  recurrenceLabels,
  rejectProposal,
  rewardLabels,
  toggleHonestyPledge
} from './data/familyAllowance'
import { supabaseConfig } from './supabase'

const state = reactive({
  ...initialFamilyState,
  missions: [...initialFamilyState.missions],
  proposals: [...initialFamilyState.proposals],
  wishlistBooks: [...initialFamilyState.wishlistBooks],
  readingRequests: [...initialFamilyState.readingRequests],
  completedMissions: [...initialFamilyState.completedMissions],
  rewardItems: [...initialFamilyState.rewardItems],
  purchaseAlerts: [...initialFamilyState.purchaseAlerts]
})

const activeTab = ref('home')
const notice = ref('가족 맞춤형 용돈 보드를 준비했어요.')
const errorMessage = ref('')

const missionForm = reactive({
  title: '',
  recurrence: 'daily',
  rewardType: 'cash',
  rewardAmount: 1000
})

const proposalForm = reactive({
  title: '',
  rewardType: 'point',
  rewardAmount: 300
})

const readingForm = reactive({
  bookId: initialFamilyState.wishlistBooks[0]?.id || '',
  review: ''
})

const rewardForm = reactive({
  name: '',
  price: 500,
  image: '🎁'
})

const navigationTabs = [
  { id: 'home', label: '홈' },
  { id: 'missions', label: '미션' },
  { id: 'reading', label: '독서' },
  { id: 'stats', label: '통계' },
  { id: 'mall', label: '포인트 몰' }
]

const pendingProposals = computed(() => state.proposals.filter((proposal) => proposal.status === 'pending'))
const stats = computed(() => calculateStats(state.completedMissions))
const supabaseStatusText = computed(() =>
  supabaseConfig.isConfigured
    ? 'Supabase 실시간 연결 준비 완료'
    : 'Supabase 환경값 확인 필요: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY'
)

function applyState(nextState) {
  Object.assign(state, {
    ...nextState,
    missions: [...nextState.missions],
    proposals: [...nextState.proposals],
    wishlistBooks: [...nextState.wishlistBooks],
    readingRequests: [...nextState.readingRequests],
    completedMissions: [...nextState.completedMissions],
    rewardItems: [...nextState.rewardItems],
    purchaseAlerts: [...nextState.purchaseAlerts]
  })
}

function runAction(action, successMessage) {
  errorMessage.value = ''

  try {
    const result = action()
    if (result?.state) {
      applyState(result.state)
    } else if (result) {
      applyState(result)
    }
    notice.value = successMessage
  } catch (error) {
    errorMessage.value = error.message
  }
}

function switchMode(mode) {
  state.mode = mode
  notice.value = mode === 'parent' ? '부모 모드로 전환했어요.' : '자녀 모드로 전환했어요.'
}

function submitMission() {
  runAction(
    () => createMission(state, missionForm),
    `${missionForm.title || '새 미션'}을 등록했어요.`
  )
  missionForm.title = ''
}

function submitProposal() {
  runAction(
    () => createProposal(state, proposalForm),
    '부모님께 새 미션 제안을 보냈어요.'
  )
  proposalForm.title = ''
}

function submitReadingRequest() {
  runAction(
    () => createReadingCompletionRequest(state, readingForm),
    '독서 완료 승인 요청을 보냈어요.'
  )
  readingForm.review = ''
}

function submitRewardItem() {
  runAction(
    () => createRewardItem(state, rewardForm),
    `${rewardForm.name || '새 상품'}을 포인트 몰에 등록했어요.`
  )
  rewardForm.name = ''
  rewardForm.image = '🎁'
}

function approvePendingProposal(proposalId) {
  runAction(() => approveProposal(state, proposalId), '제안을 승인하고 미션으로 등록했어요.')
}

function rejectPendingProposal(proposalId) {
  runAction(() => rejectProposal(state, proposalId), '제안을 거절 처리했어요.')
}

function buyReward(rewardItemId) {
  runAction(() => createPointPurchase(state, rewardItemId), '포인트 구매가 완료되어 부모 알림에 추가됐어요.')
}

function pledgeToday() {
  applyState(toggleHonestyPledge(state))
  notice.value = state.honestyPledgeDone
    ? '오늘의 정직 서약을 완료했어요.'
    : '정직 서약을 다시 확인할 수 있어요.'
}

function formatWon(value) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}원`
}

function formatPoint(value) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}P`
}
</script>

<template>
  <main class="min-h-screen bg-[#f7faf8] px-4 py-5 text-slate-900 sm:px-6">
    <section class="mx-auto flex max-w-6xl flex-col gap-5">
      <header class="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-2">
          <p class="text-sm font-semibold text-emerald-700">우리 집 약속</p>
          <h1 class="text-2xl font-bold sm:text-3xl">똘똘이 용돈 미션 센터</h1>
          <p class="text-sm leading-6 text-slate-600">
            훈남, 봄꽃, 구피, 똘똘이가 함께 쓰는 미션·독서·포인트 관리 화면입니다.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            class="rounded-md px-3 py-3 text-sm font-bold transition"
            :class="state.mode === 'parent' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'"
            @click="switchMode('parent')"
          >
            {{ familyProfile.modeLabels.parent }}
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-3 text-sm font-bold transition"
            :class="state.mode === 'child' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'"
            @click="switchMode('child')"
          >
            {{ familyProfile.modeLabels.child }}
          </button>
        </div>

        <nav class="grid grid-cols-5 gap-1 overflow-hidden rounded-lg border border-slate-200 bg-white text-xs font-bold sm:text-sm">
          <button
            v-for="tab in navigationTabs"
            :key="tab.id"
            type="button"
            class="px-2 py-3"
            :class="activeTab === tab.id ? 'bg-emerald-700 text-white' : 'text-slate-600'"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </header>

      <section class="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
        <p class="font-semibold text-emerald-800">{{ notice }}</p>
        <p v-if="errorMessage" class="mt-1 font-semibold text-rose-600">{{ errorMessage }}</p>
        <p class="mt-1 text-slate-500">{{ supabaseStatusText }}</p>
      </section>

      <section v-if="activeTab === 'home'" class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">가훈</h2>
          <ol class="mt-4 flex flex-col gap-3">
            <li
              v-for="(motto, index) in familyProfile.mottoes"
              :key="motto"
              class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-lg font-bold"
            >
              {{ index + 1 }}. {{ motto }}
            </li>
          </ol>
          <button
            type="button"
            class="mt-5 w-full rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white"
            @click="pledgeToday"
          >
            오늘의 정직 서약
          </button>
        </article>

        <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">가칙</h2>
          <ul class="mt-4 flex flex-col gap-3">
            <li v-for="rule in familyProfile.rules" :key="rule" class="rounded-md bg-amber-50 p-3 text-sm font-semibold">
              {{ rule }}
            </li>
          </ul>
          <p class="mt-5 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            서약 상태: {{ state.honestyPledgeDone ? '완료' : '아직 안 함' }}
          </p>
        </article>
      </section>

      <section v-if="activeTab === 'missions'" class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article v-if="state.mode === 'parent'" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">반복 미션 등록</h2>
          <form class="mt-4 flex flex-col gap-3" @submit.prevent="submitMission">
            <input v-model="missionForm.title" class="rounded-md border border-slate-300 px-3 py-3" placeholder="미션 제목" />
            <div class="grid grid-cols-3 gap-2">
              <label v-for="label, key in recurrenceLabels" :key="key" class="rounded-md border border-slate-200 p-3 text-center text-sm font-bold">
                <input v-model="missionForm.recurrence" class="sr-only" type="radio" :value="key" />
                <span :class="missionForm.recurrence === key ? 'text-emerald-700' : 'text-slate-500'">{{ label }}</span>
              </label>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <label v-for="label, key in rewardLabels" :key="key" class="rounded-md border border-slate-200 p-3 text-sm font-bold">
                <input v-model="missionForm.rewardType" type="radio" :value="key" />
                {{ label }}
              </label>
            </div>
            <input v-model.number="missionForm.rewardAmount" class="rounded-md border border-slate-300 px-3 py-3" min="1" type="number" />
            <button class="rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white" type="submit">미션 등록</button>
          </form>
        </article>

        <article v-else class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">똘똘이의 역제안</h2>
          <form class="mt-4 flex flex-col gap-3" @submit.prevent="submitProposal">
            <input v-model="proposalForm.title" class="rounded-md border border-slate-300 px-3 py-3" placeholder="하고 싶은 미션" />
            <div class="grid grid-cols-2 gap-2">
              <label v-for="label, key in rewardLabels" :key="key" class="rounded-md border border-slate-200 p-3 text-sm font-bold">
                <input v-model="proposalForm.rewardType" type="radio" :value="key" />
                {{ label }}
              </label>
            </div>
            <input v-model.number="proposalForm.rewardAmount" class="rounded-md border border-slate-300 px-3 py-3" min="1" type="number" />
            <button class="rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white" type="submit">부모님께 제안</button>
          </form>
        </article>

        <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">미션 목록</h2>
          <ul class="mt-4 flex flex-col gap-3">
            <li v-for="mission in state.missions" :key="mission.id" class="rounded-lg border border-slate-200 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-bold">{{ mission.title }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ recurrenceLabels[mission.recurrence] }} · {{ mission.owner }}</p>
                </div>
                <span class="rounded-md bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">{{ mission.rewardLabel }}</span>
              </div>
            </li>
          </ul>

          <section v-if="state.mode === 'parent'" class="mt-5">
            <h3 class="font-bold">제안 승인 대기</h3>
            <ul class="mt-3 flex flex-col gap-3">
              <li v-for="proposal in pendingProposals" :key="proposal.id" class="rounded-lg bg-slate-50 p-3">
                <p class="font-semibold">{{ proposal.title }} · {{ proposal.rewardLabel }}</p>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  <button class="rounded-md bg-emerald-700 py-2 text-sm font-bold text-white" @click="approvePendingProposal(proposal.id)">수락</button>
                  <button class="rounded-md bg-slate-700 py-2 text-sm font-bold text-white" @click="rejectPendingProposal(proposal.id)">거절</button>
                </div>
              </li>
            </ul>
          </section>
        </article>
      </section>

      <section v-if="activeTab === 'reading'" class="grid gap-4 lg:grid-cols-2">
        <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">독서 미션 특별관</h2>
          <h3 class="mt-4 font-bold">위시리스트 도서 목록</h3>
          <ul class="mt-3 flex flex-col gap-3">
            <li v-for="book in state.wishlistBooks" :key="book.id" class="rounded-lg bg-slate-50 p-3">
              <p class="font-semibold">{{ book.title }}</p>
              <p class="text-sm text-slate-500">{{ book.status }}</p>
            </li>
          </ul>
        </article>

        <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">읽기 완료 요청</h2>
          <form class="mt-4 flex flex-col gap-3" @submit.prevent="submitReadingRequest">
            <select v-model="readingForm.bookId" class="rounded-md border border-slate-300 px-3 py-3">
              <option v-for="book in state.wishlistBooks" :key="book.id" :value="book.id">{{ book.title }}</option>
            </select>
            <textarea v-model="readingForm.review" class="min-h-28 rounded-md border border-slate-300 px-3 py-3" placeholder="한 줄 평(필수)"></textarea>
            <button class="rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white" type="submit">부모 승인 요청</button>
          </form>
        </article>
      </section>

      <section v-if="activeTab === 'stats'" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-xl font-bold">종합 통계</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <article v-for="label, key in { daily: '일간', weekly: '주간', monthly: '월간' }" :key="key" class="rounded-lg border border-slate-200 p-4">
            <p class="font-bold">{{ label }} 획득 현황</p>
            <p class="mt-3 text-2xl font-black text-emerald-800">{{ formatWon(stats[key].cash) }}</p>
            <p class="mt-1 text-lg font-bold text-amber-700">{{ formatPoint(stats[key].points) }}</p>
          </article>
        </div>
      </section>

      <section v-if="activeTab === 'mall'" class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">포인트 몰</h2>
          <p class="mt-2 text-sm font-semibold text-emerald-800">똘똘이 누적 포인트: {{ formatPoint(state.pointBalance) }}</p>

          <form v-if="state.mode === 'parent'" class="mt-4 flex flex-col gap-3" @submit.prevent="submitRewardItem">
            <input v-model="rewardForm.name" class="rounded-md border border-slate-300 px-3 py-3" placeholder="상품명" />
            <input v-model.number="rewardForm.price" class="rounded-md border border-slate-300 px-3 py-3" min="1" type="number" />
            <input v-model="rewardForm.image" class="rounded-md border border-slate-300 px-3 py-3" placeholder="이미지 URL 또는 이모지" />
            <button class="rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white" type="submit">상품 등록</button>
          </form>

          <section v-if="state.mode === 'parent'" class="mt-5">
            <h3 class="font-bold">상품 구매 알림</h3>
            <p v-if="state.purchaseAlerts.length === 0" class="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-500">아직 구매 알림이 없습니다.</p>
            <ul class="mt-3 flex flex-col gap-2">
              <li v-for="alert in state.purchaseAlerts" :key="alert.id" class="rounded-md bg-amber-50 p-3 text-sm font-semibold">
                {{ alert.message }}
              </li>
            </ul>
          </section>
        </article>

        <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-bold">상품 목록</h2>
          <ul class="mt-4 grid gap-3 sm:grid-cols-2">
            <li v-for="item in state.rewardItems" :key="item.id" class="rounded-lg border border-slate-200 p-4">
              <div class="text-3xl">{{ item.image }}</div>
              <p class="mt-3 font-bold">{{ item.name }}</p>
              <p class="mt-1 text-sm font-semibold text-amber-700">{{ formatPoint(item.price) }}</p>
              <button
                class="mt-3 w-full rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300"
                :disabled="state.mode !== 'child'"
                @click="buyReward(item.id)"
              >
                구매하기
              </button>
            </li>
          </ul>
        </article>
      </section>
    </section>
  </main>
</template>
