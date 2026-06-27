// [수정 원인] Vue/Vite 초기 실행 진입점이 없어 앱 마운트와 Tailwind 스타일 연결이 불가능했습니다.
// [해결 방안] Vue 앱을 생성해 #app에 마운트하고 전역 Tailwind 스타일을 불러옵니다.
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
