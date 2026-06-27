import { describe, expect, it } from 'vitest'
import {
  MISSION_STATUS,
  missionRealtimeChannel,
  mockMissions,
  summarizeMissions
} from '../src/data/mockMissions.js'

describe('mock mission data model', () => {
  it('keeps every mission compatible with parent and child realtime workflows', () => {
    expect(mockMissions.length).toBeGreaterThan(0)

    mockMissions.forEach((mission) => {
      expect(mission).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          amount: expect.any(Number),
          status: expect.any(String),
          childId: expect.any(String),
          parentId: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      )
      expect(Object.values(MISSION_STATUS)).toContain(mission.status)
      expect(mission.amount).toBeGreaterThan(0)
      expect(Number.isNaN(Date.parse(mission.createdAt))).toBe(false)
      expect(Number.isNaN(Date.parse(mission.updatedAt))).toBe(false)
    })

    expect(missionRealtimeChannel).toBe('allowance:missions')
  })

  it('summarizes missions without mutating the source list', () => {
    const originalStatuses = mockMissions.map((mission) => mission.status)
    const summary = summarizeMissions(mockMissions)

    expect(summary.totalAmount).toBe(10000)
    expect(summary.pendingCount).toBe(1)
    expect(summary.approvedCount).toBe(1)
    expect(mockMissions.map((mission) => mission.status)).toEqual(originalStatuses)
  })
})
