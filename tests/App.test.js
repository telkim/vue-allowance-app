import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../src/App.vue'

describe('Allowance app shell', () => {
  it('renders family pages across the mobile tabs', async () => {
    const wrapper = mount(App)
    const clickTab = async (label) => {
      const button = wrapper.findAll('button').find((item) => item.text() === label)
      expect(button).toBeDefined()
      await button.trigger('click')
    }

    expect(wrapper.text()).toContain('우리 집 약속')
    expect(wrapper.text()).toContain('부모 모드(훈남/봄꽃)')
    expect(wrapper.text()).toContain('자녀 모드(똘똘이)')
    expect(wrapper.text()).toContain('정직해라.')
    expect(wrapper.text()).toContain('오늘의 정직 서약')

    await clickTab('미션')
    expect(wrapper.text()).toContain('제안 승인 대기')

    await clickTab('독서')
    expect(wrapper.text()).toContain('독서 미션 특별관')

    await clickTab('포인트 몰')
    expect(wrapper.text()).toContain('포인트 몰')
  })
})
