import 'bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'vue-toastification/dist/index.css'
import './assets/main.css'

import axios from 'axios'
import { createApp, reactive } from 'vue'
import Toast, { POSITION } from 'vue-toastification'
import vue3GoogleLogin from 'vue3-google-login'
import App from './App.vue'
import router from './router.js'

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

api.interceptors.request.use((config) => {
  if (user.data.token) {
    config.headers.Authorization = `Bearer ${user.data.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      user.isAuthenticated = false
      user.data = {}
      localStorage.removeItem('user')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

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
