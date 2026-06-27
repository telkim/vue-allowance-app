// [수정 원인] 부모와 자녀가 공유할 미션 데이터 모델과 실시간 채널 기준이 없었습니다.
// [해결 방안] 상태 enum, Mock 미션 목록, 요약 함수를 분리해 Supabase 연동 전에도 검증 가능하게 구성합니다.
export const MISSION_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PAID: 'paid'
})

export const missionRealtimeChannel = 'allowance:missions'

export const mockMissions = Object.freeze([
  {
    id: 'mission-001',
    title: 'Morning reading',
    amount: 4000,
    status: MISSION_STATUS.PENDING,
    childId: 'child-minjun',
    parentId: 'parent-hana',
    createdAt: '2026-06-27T00:00:00.000Z',
    updatedAt: '2026-06-27T00:00:00.000Z'
  },
  {
    id: 'mission-002',
    title: 'Desk cleanup',
    amount: 6000,
    status: MISSION_STATUS.APPROVED,
    childId: 'child-minjun',
    parentId: 'parent-hana',
    createdAt: '2026-06-26T09:00:00.000Z',
    updatedAt: '2026-06-27T01:30:00.000Z'
  }
])

export function summarizeMissions(missions) {
  return missions.reduce(
    (summary, mission) => ({
      totalAmount: summary.totalAmount + mission.amount,
      pendingCount:
        mission.status === MISSION_STATUS.PENDING
          ? summary.pendingCount + 1
          : summary.pendingCount,
      approvedCount:
        mission.status === MISSION_STATUS.APPROVED
          ? summary.approvedCount + 1
          : summary.approvedCount
    }),
    {
      totalAmount: 0,
      pendingCount: 0,
      approvedCount: 0
    }
  )
}
