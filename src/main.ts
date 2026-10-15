import { createApp } from 'vue'
import App from './App.vue'
import { initializeLocale } from './composables/useLocale'
import './style.css'

initializeLocale()
createApp(App).mount('#app')
