import { describe, expect, it } from 'vitest'
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
  rejectProposal,
  toggleHonestyPledge
} from '../src/data/familyAllowance.js'

describe('family allowance domain rules', () => {
  it('defines the family profile and Korean mode labels', () => {
    expect(familyProfile.children).toEqual(['구피', '똘똘이'])
    expect(familyProfile.parents).toEqual(['훈남', '봄꽃'])
    expect(familyProfile.modeLabels.parent).toBe('부모 모드(훈남/봄꽃)')
    expect(familyProfile.modeLabels.child).toBe('자녀 모드(똘똘이)')
  })

  it('creates recurring cash and point missions with defensive validation', () => {
    const cashMission = createMission(initialFamilyState, {
      title: '방 정리',
      recurrence: 'daily',
      rewardType: 'cash',
      rewardAmount: 1000
    })
    const pointMission = createMission(cashMission.state, {
      title: '수학 문제 풀기',
      recurrence: 'weekly',
      rewardType: 'point',
      rewardAmount: 300
    })

    expect(cashMission.mission.rewardLabel).toBe('1,000원')
    expect(pointMission.mission.rewardLabel).toBe('300P')
    expect(pointMission.state.missions).toHaveLength(initialFamilyState.missions.length + 2)
    expect(() => createMission(initialFamilyState, { title: '', rewardAmount: 0 })).toThrow('미션 제목')
  })

  it('lets the child propose missions and lets parents approve or reject them', () => {
    const proposed = createProposal(initialFamilyState, {
      title: '신발장 정리',
      rewardType: 'point',
      rewardAmount: 250
    })
    const approved = approveProposal(proposed.state, proposed.proposal.id)
    const rejectedSeed = createProposal(initialFamilyState, {
      title: '간식 정리',
      rewardType: 'cash',
      rewardAmount: 500
    })
    const rejected = rejectProposal(rejectedSeed.state, rejectedSeed.proposal.id)

    expect(approved.state.proposals[0].status).toBe('approved')
    expect(approved.state.missions.some((mission) => mission.sourceProposalId === proposed.proposal.id)).toBe(true)
    expect(rejected.state.proposals[0].status).toBe('rejected')
  })

  it('requires a one-line review before a reading completion request can be sent', () => {
    expect(() =>
      createReadingCompletionRequest(initialFamilyState, {
        bookId: 'book-001',
        review: ' '
      })
    ).toThrow('한 줄 평')

    const result = createReadingCompletionRequest(initialFamilyState, {
      bookId: 'book-001',
      review: '정직한 주인공이 멋졌다.'
    })

    expect(result.request.review).toBe('정직한 주인공이 멋졌다.')
    expect(result.request.status).toBe('pending_parent_approval')
  })

  it('calculates daily weekly and monthly cash and point stats from completed missions', () => {
    const stats = calculateStats(initialFamilyState.completedMissions)

    expect(stats.daily.cash).toBe(2000)
    expect(stats.weekly.points).toBe(700)
    expect(stats.monthly.cash).toBe(14000)
    expect(stats.monthly.points).toBe(2200)
  })

  it('creates reward items and point purchases with parent notifications', () => {
    const rewardAdded = createRewardItem(initialFamilyState, {
      name: '게임 30분 이용권',
      price: 500,
      image: '🎮'
    })
    const purchase = createPointPurchase(rewardAdded.state, rewardAdded.item.id)

    expect(purchase.state.pointBalance).toBe(initialFamilyState.pointBalance - 500)
    expect(purchase.state.purchaseAlerts[0].message).toContain('게임 30분 이용권')
    expect(() => createPointPurchase({ ...rewardAdded.state, pointBalance: 10 }, rewardAdded.item.id)).toThrow(
      '포인트'
    )
  })

  it('toggles the honesty pledge without mutating the previous state', () => {
    const result = toggleHonestyPledge(initialFamilyState)

    expect(result.honestyPledgeDone).toBe(true)
    expect(initialFamilyState.honestyPledgeDone).toBe(false)
  })
})
