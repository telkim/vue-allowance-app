<!--
[수정 원인] 인증 시스템, 비주얼 가이드라인, 가족 인터랙션 기능을 반영한 완전한 리팩토링 필요
[해결 방안] Supabase Auth, 토스/카카오뱅크 스타일 UI, 타임라인, 레벨 시스템, 정산일 디데이를 포함한 완전한 단일 페이지 앱 구현
-->
<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  accountPresets,
  addTimelineEntry,
  approveProposal,
  calculateDDay,
  calculateStats,
  createMission,
  createPointPurchase,
  createProposal,
  createReadingCompletionRequest,
  createRewardItem,
  familyProfile,
  getUserLevel,
  initialFamilyState,
  logout,
  recurrenceLabels,
  rejectProposal,
  rewardLabels,
  settlementSchedule,
  setUser,
  toggleHonestyPledge,
  toggleMottoes,
  toggleSettings
} from './data/familyAllowance'
import { 
  subscribeToRealtimeUpdates, 
  unsubscribeFromRealtime, 
  validateStateIntegrity,
  supabase, 
  supabaseConfig 
} from './supabase'

const state = reactive({
  ...initialFamilyState,
  missions: [...initialFamilyState.missions],
  proposals: [...initialFamilyState.proposals],
  wishlistBooks: [...initialFamilyState.wishlistBooks],
  readingRequests: [...initialFamilyState.readingRequests],
  completedMissions: [...initialFamilyState.completedMissions],
  rewardItems: [...initialFamilyState.rewardItems],
  purchaseAlerts: [...initialFamilyState.purchaseAlerts],
  timeline: [...initialFamilyState.timeline]
})

const activeTab = ref('home')
const notice = ref('가족 맞춤형 용돈 보드를 준비했어요.')
const errorMessage = ref('')

const loginForm = reactive({
  email: '',
  password: ''
})

const passwordChangeForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const timelineForm = reactive({
  content: ''
})

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
const userLevel = computed(() => getUserLevel(state.pointBalance))
const dDay = computed(() => calculateDDay(settlementSchedule.nextSettlementDate))
const inProgressMissions = computed(() => 
  state.missions.filter(m => m.status === 'active' || m.status === 'in_progress')
)
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
    purchaseAlerts: [...nextState.purchaseAlerts],
    timeline: [...nextState.timeline]
  })
}

async function handleLogin() {
  errorMessage.value = ''
  try {
    if (!supabase) {
      throw new Error('Supabase가 설정되지 않았습니다.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password
    })

    if (error) throw error

    applyState(setUser(state, data.user))
    notice.value = `${data.user?.user_metadata?.name || '사용자'}님 환영합니다!`
    loginForm.email = ''
    loginForm.password = ''
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function handleLogout() {
  errorMessage.value = ''
  try {
    if (supabase) {
      await supabase.auth.signOut()
    }
    applyState(logout(state))
    notice.value = '로그아웃되었습니다.'
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function handleChangePassword() {
  errorMessage.value = ''
  try {
    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
      throw new Error('새 비밀번호가 일치하지 않습니다.')
    }

    if (!supabase) {
      throw new Error('Supabase가 설정되지 않았습니다.')
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordChangeForm.newPassword
    })

    if (error) throw error

    notice.value = '비밀번호가 변경되었습니다.'
    passwordChangeForm.currentPassword = ''
    passwordChangeForm.newPassword = ''
    passwordChangeForm.confirmPassword = ''
    applyState(toggleSettings(state))
  } catch (error) {
    errorMessage.value = error.message
  }
}

function selectPresetAccount(account) {
  loginForm.email = account.email
  loginForm.password = ''
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

function submitTimelineEntry() {
  errorMessage.value = ''
  if (!timelineForm.content.trim()) {
    errorMessage.value = '내용을 입력해주세요.'
    return
  }

  const author = state.user?.user_metadata?.name || (state.mode === 'parent' ? '부모' : '똘똘이')
  applyState(addTimelineEntry(state, {
    author,
    content: timelineForm.content.trim(),
    type: 'user_post'
  }))
  timelineForm.content = ''
  notice.value = '타임라인에 등록되었습니다.'
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

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR')
}

onMounted(() => {
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        applyState(setUser(state, session.user))
        notice.value = `${session.user?.user_metadata?.name || '사용자'}님 환영합니다!`
      } else if (event === 'SIGNED_OUT') {
        applyState(logout(state))
      }
    })
  }

  if (supabase && state.isAuthenticated) {
    subscribeToRealtimeUpdates(
      'missions',
      (newMission) => {
        state.missions.push(newMission)
        notice.value = '새 미션이 추가되었습니다.'
      },
      (updatedMission) => {
        const index = state.missions.findIndex(m => m.id === updatedMission.id)
        if (index !== -1) {
          state.missions[index] = updatedMission
        }
      },
      (deletedMission) => {
        state.missions = state.missions.filter(m => m.id !== deletedMission.id)
      }
    )
  }
})

onUnmounted(() => {
  unsubscribeFromRealtime()
})

watch(activeTab, async (newTab, oldTab) => {
  if (supabase && state.isAuthenticated) {
    const integrityCheck = await validateStateIntegrity(state.missions, 'missions')
    if (!integrityCheck.isValid) {
      console.warn('State integrity check failed:', integrityCheck.reason)
      notice.value = '데이터 동기화가 필요합니다. 페이지를 새로고침하세요.'
    }
  }
})
</script>

<template>
  <main class="min-h-screen bg-gray-50 px-4 py-5 text-slate-900 sm:px-6">
    <section class="mx-auto flex max-w-6xl flex-col gap-5">
      <!-- 로그인 화면 -->
      <div v-if="!state.isAuthenticated" class="mx-auto w-full max-w-md">
        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 class="mb-2 text-2xl font-bold text-blue-600">똘똘이 용돈 미션 센터</h1>
          <p class="mb-6 text-sm text-gray-600">가족 맞춤형 미션·독서·포인트 관리</p>
          
          <div class="mb-6 grid grid-cols-1 gap-3">
            <button
              v-for="account in accountPresets"
              :key="account.email"
              type="button"
              class="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-sm font-bold transition hover:border-blue-600 hover:bg-blue-50 text-left"
              @click="selectPresetAccount(account)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-lg">{{ account.role === 'parent' ? '👨‍👩' : '👧' }}</span>
                  <span class="ml-2">{{ account.name }}</span>
                  <span class="ml-2 text-xs font-normal text-gray-500">({{ account.role === 'parent' ? '부모' : '자녀' }})</span>
                </div>
                <span class="text-xs text-gray-400">{{ account.email }}</span>
              </div>
            </button>
          </div>

          <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">이메일</label>
              <input
                v-model="loginForm.email"
                type="email"
                class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="이메일 입력"
                required
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">비밀번호</label>
              <input
                v-model="loginForm.password"
                type="password"
                class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="비밀번호 입력"
                required
              />
            </div>
            <button
              type="submit"
              class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              로그인
            </button>
          </form>

          <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- 메인 대시보드 -->
      <template v-else>
        <header class="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-blue-600">똘똘이 용돈 미션 센터</h1>
              <p class="mt-1 text-sm text-gray-600">
                {{ state.user?.user_metadata?.name || '사용자' }}님, 오늘도 화이팅! 💪
              </p>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
                <span class="text-2xl">{{ userLevel.badge }}</span>
                <div>
                  <p class="text-xs font-semibold text-gray-500">등급</p>
                  <p class="text-sm font-bold text-blue-600">{{ userLevel.name }}</p>
                </div>
              </div>
              <button
                type="button"
                class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold transition hover:bg-gray-100"
                @click="applyState(toggleSettings(state))"
              >
                ⚙️ 설정
              </button>
              <button
                type="button"
                class="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold transition hover:bg-gray-200"
                @click="handleLogout"
              >
                로그아웃
              </button>
            </div>
          </div>

          <nav class="grid grid-cols-5 gap-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold sm:text-sm">
            <button
              v-for="tab in navigationTabs"
              :key="tab.id"
              type="button"
              class="rounded-lg px-3 py-3 transition"
              :class="activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </nav>
        </header>

        <!-- 알림 메시지 -->
        <section class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
          <p class="font-semibold text-blue-600">{{ notice }}</p>
          <p v-if="errorMessage" class="mt-1 font-semibold text-red-600">{{ errorMessage }}</p>
        </section>

        <!-- 설정 팝업 -->
        <div v-if="state.showSettings" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 class="mb-4 text-xl font-bold text-gray-900">설정</h2>
            
            <div class="mb-6">
              <h3 class="mb-3 text-sm font-semibold text-gray-700">비밀번호 변경</h3>
              <form class="flex flex-col gap-3" @submit.prevent="handleChangePassword">
                <input
                  v-model="passwordChangeForm.currentPassword"
                  type="password"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="현재 비밀번호"
                />
                <input
                  v-model="passwordChangeForm.newPassword"
                  type="password"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="새 비밀번호"
                  required
                />
                <input
                  v-model="passwordChangeForm.confirmPassword"
                  type="password"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="새 비밀번호 확인"
                  required
                />
                <div class="flex gap-2">
                  <button
                    type="submit"
                    class="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    변경하기
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold transition hover:bg-gray-50"
                    @click="applyState(toggleSettings(state))"
                  >
                    닫기
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- 홈 탭 -->
        <section v-if="activeTab === 'home'" class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <!-- 진행 중인 미션 스코어카드 -->
          <article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-bold text-gray-900">진행 중인 미션</h2>
            <div v-if="inProgressMissions.length === 0" class="rounded-xl bg-gray-50 p-6 text-center">
              <p class="text-gray-600">🎯 진행 중인 미션이 없어요.</p>
              <p class="mt-2 text-sm text-gray-500">새로운 미션을 시작해 볼까요?</p>
            </div>
            <div v-else class="grid gap-3">
              <div
                v-for="mission in inProgressMissions"
                :key="mission.id"
                class="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <p class="font-bold text-gray-900">{{ mission.title }}</p>
                    <p class="mt-1 text-sm text-gray-500">{{ recurrenceLabels[mission.recurrence] }} · {{ mission.owner }}</p>
                  </div>
                  <span class="flex-shrink-0 rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600 whitespace-nowrap">
                    {{ mission.rewardLabel }}
                  </span>
                </div>
              </div>
            </div>
          </article>

          <!-- 정산일 디데이 & 잔액 -->
          <article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-bold text-gray-900">정산 정보</h2>
            <div class="rounded-xl bg-blue-50 p-4">
              <p class="text-sm font-semibold text-gray-600">다음 정산일까지</p>
              <p class="mt-2 text-3xl font-black text-blue-600">D-{{ dDay }}</p>
              <p class="mt-1 text-sm text-gray-600">{{ settlementSchedule.nextSettlementDate }}</p>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-gray-50 p-4 text-center">
                <p class="text-xs font-semibold text-gray-500">누적 현금</p>
                <p class="mt-2 text-xl font-black text-gray-900">{{ formatWon(state.cashBalance) }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-4 text-center">
                <p class="text-xs font-semibold text-gray-500">누적 포인트</p>
                <p class="mt-2 text-xl font-black text-blue-600">{{ formatPoint(state.pointBalance) }}</p>
              </div>
            </div>
          </article>

          <!-- 가훈 & 가칙 (토글) -->
          <article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-gray-900">가훈 & 가칙</h2>
              <button
                type="button"
                class="rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold transition hover:bg-gray-200"
                @click="applyState(toggleMottoes(state))"
              >
                {{ state.showMottoes ? '접기' : '펼치기' }}
              </button>
            </div>
            
            <div v-if="state.showMottoes" class="mt-4 space-y-4">
              <div>
                <h3 class="mb-3 text-sm font-semibold text-gray-600">가훈</h3>
                <ol class="space-y-2">
                  <li
                    v-for="(motto, index) in familyProfile.mottoes"
                    :key="motto"
                    class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-base font-bold"
                  >
                    {{ index + 1 }}. {{ motto }}
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 class="mb-3 text-sm font-semibold text-gray-600">가칙</h3>
                <ul class="space-y-2">
                  <li v-for="rule in familyProfile.rules" :key="rule" class="rounded-lg bg-amber-50 p-3 text-sm font-semibold">
                    {{ rule }}
                  </li>
                </ul>
              </div>

              <button
                v-if="state.mode === 'child'"
                type="button"
                class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                @click="pledgeToday"
              >
                오늘의 정직 서약 ✨
              </button>
              
              <div v-if="state.honestyPledgeDone" class="rounded-lg bg-green-50 p-3 text-center text-sm font-semibold text-green-700">
                서약 완료! 정직한 하루 되세요 🌟
              </div>
            </div>
          </article>
        </section>

        <!-- 미션 탭 -->
        <section v-if="activeTab === 'missions'" class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article v-if="state.mode === 'parent'" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-bold text-gray-900">반복 미션 등록</h2>
            <form class="flex flex-col gap-4" @submit.prevent="submitMission">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">미션 제목</label>
                <input
                  v-model="missionForm.title"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="미션 제목 입력"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">반복 주기</label>
                <div class="grid grid-cols-3 gap-2">
                  <label
                    v-for="label, key in recurrenceLabels"
                    :key="key"
                    class="cursor-pointer rounded-xl border-2 border-gray-200 p-3 text-center text-sm font-bold transition"
                    :class="missionForm.recurrence === key ? 'border-blue-600 bg-blue-50 text-blue-600' : 'hover:border-gray-300'"
                  >
                    <input v-model="missionForm.recurrence" class="sr-only" type="radio" :value="key" />
                    {{ label }}
                  </label>
                </div>
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">보상 종류</label>
                <div class="grid grid-cols-2 gap-2">
                  <label
                    v-for="label, key in rewardLabels"
                    :key="key"
                    class="cursor-pointer rounded-xl border-2 border-gray-200 p-3 text-sm font-bold transition"
                    :class="missionForm.rewardType === key ? 'border-blue-600 bg-blue-50 text-blue-600' : 'hover:border-gray-300'"
                  >
                    <input v-model="missionForm.rewardType" type="radio" :value="key" />
                    {{ label }}
                  </label>
                </div>
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">보상 금액</label>
                <input
                  v-model.number="missionForm.rewardAmount"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  min="1"
                  type="number"
                />
              </div>
              <button
                class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                type="submit"
              >
                미션 등록
              </button>
            </form>
          </article>

          <article v-else class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-bold text-gray-900">똘똘이의 역제안</h2>
            <form class="flex flex-col gap-4" @submit.prevent="submitProposal">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">하고 싶은 미션</label>
                <input
                  v-model="proposalForm.title"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="하고 싶은 미션 입력"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">보상 종류</label>
                <div class="grid grid-cols-2 gap-2">
                  <label
                    v-for="label, key in rewardLabels"
                    :key="key"
                    class="cursor-pointer rounded-xl border-2 border-gray-200 p-3 text-sm font-bold transition"
                    :class="proposalForm.rewardType === key ? 'border-blue-600 bg-blue-50 text-blue-600' : 'hover:border-gray-300'"
                  >
                    <input v-model="proposalForm.rewardType" type="radio" :value="key" />
                    {{ label }}
                  </label>
                </div>
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">희망 보상 금액</label>
                <input
                  v-model.number="proposalForm.rewardAmount"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  min="1"
                  type="number"
                />
              </div>
              <button
                class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                type="submit"
              >
                부모님께 제안
              </button>
            </form>
          </article>

          <article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-bold text-gray-900">미션 목록</h2>
            <ul class="space-y-3">
              <li v-for="mission in state.missions" :key="mission.id" class="rounded-xl border border-gray-200 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <p class="font-bold text-gray-900">{{ mission.title }}</p>
                    <p class="mt-1 text-sm text-gray-500">{{ recurrenceLabels[mission.recurrence] }} · {{ mission.owner }}</p>
                  </div>
                  <span class="flex-shrink-0 rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600 whitespace-nowrap">
                    {{ mission.rewardLabel }}
                  </span>
                </div>
              </li>
            </ul>

            <section v-if="state.mode === 'parent'" class="mt-6">
              <h3 class="mb-3 font-bold text-gray-900">제안 승인 대기</h3>
              <ul v-if="pendingProposals.length > 0" class="space-y-3">
                <li v-for="proposal in pendingProposals" :key="proposal.id" class="rounded-xl bg-gray-50 p-4">
                  <p class="font-semibold text-gray-900">{{ proposal.title }} · {{ proposal.rewardLabel }}</p>
                  <div class="mt-3 grid grid-cols-2 gap-2">
                    <button
                      class="rounded-xl bg-blue-600 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                      @click="approvePendingProposal(proposal.id)"
                    >
                      수락
                    </button>
                    <button
                      class="rounded-xl bg-gray-700 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
                      @click="rejectPendingProposal(proposal.id)"
                    >
                      거절
                    </button>
                  </div>
                </li>
              </ul>
              <p v-else class="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">승인 대기 중인 제안이 없어요.</p>
            </section>
          </article>
        </section>

        <!-- 독서 탭 -->
        <section v-if="activeTab === 'reading'" class="grid gap-4 lg:grid-cols-2">
          <article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-bold text-gray-900">독서 미션 특별관</h2>
            <h3 class="mb-3 text-sm font-semibold text-gray-600">위시리스트 도서 목록</h3>
            <ul class="space-y-3">
              <li v-for="book in state.wishlistBooks" :key="book.id" class="rounded-xl bg-gray-50 p-4">
                <p class="font-semibold text-gray-900">{{ book.title }}</p>
                <p class="mt-1 text-sm text-gray-500">{{ book.status }}</p>
              </li>
            </ul>
          </article>

          <article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-bold text-gray-900">읽기 완료 요청</h2>
            <form class="flex flex-col gap-4" @submit.prevent="submitReadingRequest">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">도서 선택</label>
                <select
                  v-model="readingForm.bookId"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                >
                  <option v-for="book in state.wishlistBooks" :key="book.id" :value="book.id">
                    {{ book.title }}
                  </option>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">한 줄 평 (필수)</label>
                <textarea
                  v-model="readingForm.review"
                  class="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="이 책을 읽고 느낀 점을 적어주세요"
                  required
                ></textarea>
              </div>
              <button
                class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                type="submit"
              >
                부모 승인 요청
              </button>
            </form>
          </article>
        </section>

        <!-- 통계 탭 -->
        <section v-if="activeTab === 'stats'" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-xl font-bold text-gray-900">종합 통계</h2>
          
          <!-- 일간: 리스트 형태 -->
          <article class="mb-6 rounded-xl border border-gray-200 p-5">
            <h3 class="mb-3 font-bold text-gray-900">일간 획득 현황 (이번 달)</h3>
            <div v-if="state.completedMissions.length === 0" class="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
              이번 달 완료된 미션이 없어요.
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="mission in state.completedMissions"
                :key="mission.id"
                class="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div>
                  <p class="font-semibold text-gray-900">{{ mission.title }}</p>
                  <p class="text-xs text-gray-500">{{ new Date(mission.completedAt).toLocaleDateString('ko-KR') }}</p>
                </div>
                <span class="font-bold text-blue-600">
                  {{ mission.rewardType === 'cash' ? formatWon(mission.rewardAmount) : formatPoint(mission.rewardAmount) }}
                </span>
              </li>
            </ul>
          </article>

          <!-- 주간: 그래프 형태 -->
          <article class="mb-6 rounded-xl border border-gray-200 p-5">
            <h3 class="mb-3 font-bold text-gray-900">주간 획득 현황</h3>
            <div class="flex items-end gap-2 h-32">
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-blue-100 rounded-t" :style="{ height: '60%' }"></div>
                <p class="mt-2 text-xs text-gray-600">월</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-blue-200 rounded-t" :style="{ height: '80%' }"></div>
                <p class="mt-2 text-xs text-gray-600">화</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-blue-300 rounded-t" :style="{ height: '40%' }"></div>
                <p class="mt-2 text-xs text-gray-600">수</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-blue-400 rounded-t" :style="{ height: '90%' }"></div>
                <p class="mt-2 text-xs text-gray-600">목</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-blue-500 rounded-t" :style="{ height: '70%' }"></div>
                <p class="mt-2 text-xs text-gray-600">금</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-blue-600 rounded-t" :style="{ height: '100%' }"></div>
                <p class="mt-2 text-xs text-gray-600">토</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-blue-700 rounded-t" :style="{ height: '50%' }"></div>
                <p class="mt-2 text-xs text-gray-600">일</p>
              </div>
            </div>
            <div class="mt-4 flex justify-between text-sm">
              <span class="font-semibold text-gray-900">주간 총계</span>
              <span class="font-bold text-blue-600">{{ formatWon(stats.weekly.cash) }} / {{ formatPoint(stats.weekly.points) }}</span>
            </div>
          </article>

          <!-- 월간: 그래프 형태 -->
          <article class="rounded-xl border border-gray-200 p-5">
            <h3 class="mb-3 font-bold text-gray-900">월간 획득 현황</h3>
            <div class="flex items-end gap-2 h-32">
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-indigo-100 rounded-t" :style="{ height: '45%' }"></div>
                <p class="mt-2 text-xs text-gray-600">1주</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-indigo-200 rounded-t" :style="{ height: '65%' }"></div>
                <p class="mt-2 text-xs text-gray-600">2주</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-indigo-300 rounded-t" :style="{ height: '80%' }"></div>
                <p class="mt-2 text-xs text-gray-600">3주</p>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <div class="w-full bg-indigo-400 rounded-t" :style="{ height: '55%' }"></div>
                <p class="mt-2 text-xs text-gray-600">4주</p>
              </div>
            </div>
            <div class="mt-4 flex justify-between text-sm">
              <span class="font-semibold text-gray-900">월간 총계</span>
              <span class="font-bold text-blue-600">{{ formatWon(stats.monthly.cash) }} / {{ formatPoint(stats.monthly.points) }}</span>
            </div>
          </article>
        </section>

        <!-- 포인트 몰 탭 -->
        <section v-if="activeTab === 'mall'" class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-2 text-xl font-bold text-gray-900">포인트 몰</h2>
            <p class="mb-4 text-sm font-semibold text-blue-600">
              똘똘이 누적 포인트: {{ formatPoint(state.pointBalance) }}
            </p>

            <form v-if="state.mode === 'parent'" class="flex flex-col gap-4" @submit.prevent="submitRewardItem">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">상품명</label>
                <input
                  v-model="rewardForm.name"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="상품명 입력"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">포인트 가격</label>
                <input
                  v-model.number="rewardForm.price"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  min="1"
                  type="number"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700">이모지</label>
                <input
                  v-model="rewardForm.image"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="이모지 입력 (예: 🎮)"
                />
              </div>
              <button
                class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                type="submit"
              >
                상품 등록
              </button>
            </form>

            <section v-if="state.mode === 'parent'" class="mt-6">
              <h3 class="mb-3 font-bold text-gray-900">상품 구매 알림</h3>
              <div v-if="state.purchaseAlerts.length === 0" class="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                아직 구매 알림이 없어요.
              </div>
              <ul v-else class="space-y-2">
                <li v-for="alert in state.purchaseAlerts" :key="alert.id" class="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-gray-900">
                  {{ alert.message }}
                </li>
              </ul>
            </section>
          </article>

          <article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-bold text-gray-900">상품 목록</h2>
            <ul class="grid gap-4 sm:grid-cols-2">
              <li v-for="item in state.rewardItems" :key="item.id" class="rounded-xl border border-gray-200 p-4">
                <div class="text-3xl">{{ item.image }}</div>
                <p class="mt-3 font-bold text-gray-900">{{ item.name }}</p>
                <p class="mt-1 text-sm font-semibold text-blue-600">{{ formatPoint(item.price) }}</p>
                <button
                  class="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
                  :disabled="state.mode !== 'child' || state.pointBalance < item.price"
                  @click="buyReward(item.id)"
                >
                  {{ state.pointBalance < item.price ? '포인트 부족' : '구매하기' }}
                </button>
              </li>
            </ul>
          </article>
        </section>

        <!-- 가족 타임라인 피드 (모든 탭 하단) -->
        <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-xl font-bold text-gray-900">가족 타임라인</h2>
          
          <form class="mb-6 flex gap-3" @submit.prevent="submitTimelineEntry">
            <input
              v-model="timelineForm.content"
              class="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
              placeholder="가족에게 전할 메시지를 입력하세요..."
            />
            <button
              type="submit"
              class="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              등록
            </button>
          </form>

          <ul class="space-y-3">
            <li v-for="entry in state.timeline" :key="entry.id" class="rounded-xl bg-gray-50 p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <p class="font-semibold text-gray-900">{{ entry.author }}</p>
                  <p class="mt-1 text-sm text-gray-700">{{ entry.content }}</p>
                </div>
                <span class="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">{{ formatTime(entry.timestamp) }}</span>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </section>
  </main>
</template>
