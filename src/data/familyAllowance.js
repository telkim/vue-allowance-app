// [수정 원인] 가족 맞춤형 미션, 독서, 통계, 포인트 몰 상태를 일관되게 다룰 도메인 계층이 없었습니다.
// [해결 방안] Vue 화면과 테스트가 공유할 순수 함수 기반 LocalState 모델을 구성하고 Supabase Realtime 확장 지점을 분리합니다.
export const familyProfile = Object.freeze({
  children: ['구피', '똘똘이'],
  activeChild: '똘똘이',
  parents: ['훈남', '봄꽃'],
  modeLabels: {
    parent: '부모 모드(훈남/봄꽃)',
    child: '자녀 모드(똘똘이)'
  },
  mottoes: ['정직해라.', '1번을 절대 어기지 말라.', '가칙을 준수하라.'],
  rules: ['약속한 미션은 스스로 확인한다.', '보상보다 정직을 먼저 생각한다.', '제안은 구체적으로 적는다.']
})

export const accountPresets = Object.freeze([
  {
    email: 'hunam@family.com',
    name: '훈남',
    role: 'parent'
  },
  {
    email: 'spring@family.com',
    name: '봄이',
    role: 'child'
  },
  {
    email: 'summer@family.com',
    name: '여름이',
    role: 'child'
  }
])

export const levelSystem = Object.freeze({
  bronze: { name: '브론즈 효도러', minPoints: 0, badge: '🥉' },
  silver: { name: '실버 용돈 장인', minPoints: 3000, badge: '🥈' },
  gold: { name: '골드 가문의 영광', minPoints: 10000, badge: '🥇' }
})

export function getUserLevel(totalPoints) {
  let currentLevel = levelSystem.bronze
  for (const [key, level] of Object.entries(levelSystem)) {
    if (totalPoints >= level.minPoints) {
      currentLevel = level
    }
  }
  return currentLevel
}

export const rewardTypes = Object.freeze({
  CASH: 'cash',
  POINT: 'point'
})

export const recurrenceTypes = Object.freeze({
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
})

export const recurrenceLabels = Object.freeze({
  daily: '일간',
  weekly: '주간',
  monthly: '월간'
})

export const rewardLabels = Object.freeze({
  cash: '현금(원)',
  point: '포인트(P)'
})

const today = '2026-06-27'

export const settlementSchedule = Object.freeze({
  type: 'weekly',
  dayOfWeek: 6,
  nextSettlementDate: '2026-07-05'
})

export function calculateDDay(targetDate) {
  const todayDate = new Date(today)
  const target = new Date(targetDate)
  const diffTime = target - todayDate
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export const initialFamilyState = Object.freeze({
  mode: 'parent',
  honestyPledgeDone: false,
  cashBalance: 14000,
  pointBalance: 2200,
  user: null,
  isAuthenticated: false,
  showSettings: false,
  showMottoes: true,
  timeline: Object.freeze([
    {
      id: 'timeline-001',
      author: '시스템',
      content: '똘똘이가 방 청소 미션을 완료했어요! 칭찬해 주세요! 🎉',
      timestamp: `${today}T10:30:00.000Z`,
      type: 'mission_complete'
    }
  ]),
  missions: Object.freeze([
    {
      id: 'mission-daily-honesty',
      title: '정직 일기 한 줄 쓰기',
      recurrence: recurrenceTypes.DAILY,
      rewardType: rewardTypes.POINT,
      rewardAmount: 100,
      rewardLabel: '100P',
      status: 'active',
      owner: '똘똘이',
      createdAt: `${today}T00:00:00.000Z`
    },
    {
      id: 'mission-weekly-clean',
      title: '책상과 가방 정리',
      recurrence: recurrenceTypes.WEEKLY,
      rewardType: rewardTypes.CASH,
      rewardAmount: 2000,
      rewardLabel: '2,000원',
      status: 'active',
      owner: '똘똘이',
      createdAt: `${today}T00:10:00.000Z`
    }
  ]),
  proposals: Object.freeze([
    {
      id: 'proposal-bike',
      title: '자전거 헬멧 정리',
      rewardType: rewardTypes.POINT,
      rewardAmount: 300,
      rewardLabel: '300P',
      status: 'pending',
      requestedBy: '똘똘이'
    }
  ]),
  wishlistBooks: Object.freeze([
    {
      id: 'book-001',
      title: '정직한 아이의 모험',
      status: 'wishlist'
    },
    {
      id: 'book-002',
      title: '용돈을 지키는 습관',
      status: 'wishlist'
    }
  ]),
  readingRequests: Object.freeze([]),
  completedMissions: Object.freeze([
    {
      id: 'done-day-cash',
      title: '분리수거 돕기',
      completedAt: `${today}T03:00:00.000Z`,
      rewardType: rewardTypes.CASH,
      rewardAmount: 2000
    },
    {
      id: 'done-week-point',
      title: '독서 20분',
      completedAt: '2026-06-25T09:00:00.000Z',
      rewardType: rewardTypes.POINT,
      rewardAmount: 700
    },
    {
      id: 'done-month-cash',
      title: '한 달 약속 지키기',
      completedAt: '2026-06-10T09:00:00.000Z',
      rewardType: rewardTypes.CASH,
      rewardAmount: 12000
    },
    {
      id: 'done-month-point',
      title: '가훈 암송',
      completedAt: '2026-06-12T09:00:00.000Z',
      rewardType: rewardTypes.POINT,
      rewardAmount: 1500
    }
  ]),
  rewardItems: Object.freeze([
    {
      id: 'reward-game-30',
      name: '게임 30분 이용권',
      price: 500,
      image: '🎮'
    },
    {
      id: 'reward-chicken-weekend',
      name: '주말 치킨 쿠폰',
      price: 2000,
      image: '🍗'
    }
  ]),
  purchaseAlerts: Object.freeze([])
})

function assertText(value, label) {
  if (!String(value || '').trim()) {
    throw new Error(`${label}을 입력해야 합니다.`)
  }
}

function assertPositiveNumber(value, label) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    throw new Error(`${label}은 0보다 커야 합니다.`)
  }
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export function formatReward(type, amount) {
  return type === rewardTypes.CASH
    ? `${new Intl.NumberFormat('ko-KR').format(Number(amount))}원`
    : `${new Intl.NumberFormat('ko-KR').format(Number(amount))}P`
}

export function createMission(state, payload) {
  assertText(payload.title, '미션 제목')
  assertPositiveNumber(payload.rewardAmount, '보상 금액')

  const rewardType = payload.rewardType || rewardTypes.CASH
  const mission = {
    id: createId('mission'),
    title: payload.title.trim(),
    recurrence: payload.recurrence || recurrenceTypes.DAILY,
    rewardType,
    rewardAmount: Number(payload.rewardAmount),
    rewardLabel: formatReward(rewardType, payload.rewardAmount),
    status: 'active',
    owner: familyProfile.activeChild,
    sourceProposalId: payload.sourceProposalId || null,
    createdAt: new Date().toISOString()
  }

  return {
    mission,
    state: {
      ...state,
      missions: [...state.missions, mission]
    }
  }
}

export function createProposal(state, payload) {
  assertText(payload.title, '제안 미션')
  assertPositiveNumber(payload.rewardAmount, '제안 보상')

  const rewardType = payload.rewardType || rewardTypes.POINT
  const proposal = {
    id: createId('proposal'),
    title: payload.title.trim(),
    rewardType,
    rewardAmount: Number(payload.rewardAmount),
    rewardLabel: formatReward(rewardType, payload.rewardAmount),
    status: 'pending',
    requestedBy: familyProfile.activeChild
  }

  return {
    proposal,
    state: {
      ...state,
      proposals: [proposal, ...state.proposals]
    }
  }
}

export function approveProposal(state, proposalId) {
  const proposal = state.proposals.find((item) => item.id === proposalId)

  if (!proposal) {
    throw new Error('제안을 찾을 수 없습니다.')
  }

  const updatedProposals = state.proposals.map((item) =>
    item.id === proposalId ? { ...item, status: 'approved' } : item
  )
  const missionResult = createMission(
    {
      ...state,
      proposals: updatedProposals
    },
    {
      title: proposal.title,
      recurrence: recurrenceTypes.DAILY,
      rewardType: proposal.rewardType,
      rewardAmount: proposal.rewardAmount,
      sourceProposalId: proposal.id
    }
  )

  return {
    state: missionResult.state
  }
}

export function rejectProposal(state, proposalId) {
  return {
    state: {
      ...state,
      proposals: state.proposals.map((item) =>
        item.id === proposalId ? { ...item, status: 'rejected' } : item
      )
    }
  }
}

export function createReadingCompletionRequest(state, payload) {
  assertText(payload.review, '한 줄 평')

  const book = state.wishlistBooks.find((item) => item.id === payload.bookId)

  if (!book) {
    throw new Error('도서를 찾을 수 없습니다.')
  }

  const request = {
    id: createId('reading'),
    bookId: book.id,
    title: book.title,
    review: payload.review.trim(),
    status: 'pending_parent_approval',
    requestedBy: familyProfile.activeChild,
    createdAt: new Date().toISOString()
  }

  return {
    request,
    state: {
      ...state,
      readingRequests: [request, ...state.readingRequests],
      wishlistBooks: state.wishlistBooks.map((item) =>
        item.id === book.id ? { ...item, status: 'approval_requested' } : item
      )
    }
  }
}

export function calculateStats(completedMissions) {
  const weekStart = new Date('2026-06-21T00:00:00.000Z')
  const weekEnd = new Date('2026-06-27T23:59:59.999Z')

  return completedMissions.reduce(
    (stats, mission) => {
      const completedDate = new Date(mission.completedAt)
      const day = completedDate.toISOString().slice(0, 10)
      const month = completedDate.toISOString().slice(0, 7)
      const bucketNames = ['monthly']

      if (completedDate >= weekStart && completedDate <= weekEnd) {
        bucketNames.push('weekly')
      }

      if (day === today) {
        bucketNames.push('daily')
      }

      bucketNames.forEach((bucket) => {
        if (mission.rewardType === rewardTypes.CASH) {
          stats[bucket].cash += mission.rewardAmount
        } else {
          stats[bucket].points += mission.rewardAmount
        }
      })

      return stats
    },
    {
      daily: { cash: 0, points: 0 },
      weekly: { cash: 0, points: 0 },
      monthly: { cash: 0, points: 0 }
    }
  )
}

export function createRewardItem(state, payload) {
  assertText(payload.name, '상품명')
  assertPositiveNumber(payload.price, '상품 가격')

  const item = {
    id: createId('reward'),
    name: payload.name.trim(),
    price: Number(payload.price),
    image: String(payload.image || '🎁').trim()
  }

  return {
    item,
    state: {
      ...state,
      rewardItems: [item, ...state.rewardItems]
    }
  }
}

export function createPointPurchase(state, rewardItemId) {
  const item = state.rewardItems.find((reward) => reward.id === rewardItemId)

  if (!item) {
    throw new Error('상품을 찾을 수 없습니다.')
  }

  if (state.pointBalance < item.price) {
    throw new Error('포인트가 부족합니다.')
  }

  const alert = {
    id: createId('alert'),
    itemId: item.id,
    message: `${familyProfile.activeChild}이가 ${item.name}을 구매했습니다.`,
    createdAt: new Date().toISOString()
  }

  return {
    alert,
    state: {
      ...state,
      pointBalance: state.pointBalance - item.price,
      purchaseAlerts: [alert, ...state.purchaseAlerts]
    }
  }
}

export function toggleHonestyPledge(state) {
  return {
    ...state,
    honestyPledgeDone: !state.honestyPledgeDone
  }
}

export function addTimelineEntry(state, entry) {
  const newEntry = {
    id: createId('timeline'),
    timestamp: new Date().toISOString(),
    ...entry
  }
  return {
    ...state,
    timeline: [newEntry, ...state.timeline]
  }
}

export function toggleMottoes(state) {
  return {
    ...state,
    showMottoes: !state.showMottoes
  }
}

export function toggleSettings(state) {
  return {
    ...state,
    showSettings: !state.showSettings
  }
}

export function setUser(state, user) {
  return {
    ...state,
    user,
    isAuthenticated: !!user,
    mode: user?.user_metadata?.role || 'parent'
  }
}

export function logout(state) {
  return {
    ...state,
    user: null,
    isAuthenticated: false,
    mode: 'parent'
  }
}
