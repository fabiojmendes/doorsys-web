import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'vue-toastification/dist/index.css'
import './assets/main.css'

import { createApp, reactive } from 'vue'
import App from './App.vue'
import router from './router.js'
import axios from 'axios'
import Toast, { POSITION } from 'vue-toastification'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)

const user = reactive({
  isAuthenticated: !!localStorage.getItem('user'),
  data: JSON.parse(localStorage.getItem('user') || '{}')
})

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const options = {
  position: POSITION.TOP_CENTER,
  timeout: 2000
}

app
  .use(router)
  .use(Toast, options)
  .use(vue3GoogleLogin, {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
  })
  .provide('api', api)
  .provide('user', user)
  .mount('#app')
