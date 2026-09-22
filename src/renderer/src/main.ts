import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settingsStore'
import './styles/theme.scss'
import './styles/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(ElementPlus)
app.use(router)

useSettingsStore(pinia).initialize()

app.mount('#app')
