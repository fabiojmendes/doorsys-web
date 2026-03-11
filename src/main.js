import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'vue-toastification/dist/index.css'
import './assets/main.css'

import axios from 'axios'
import { createApp } from 'vue'
import Toast, { POSITION } from 'vue-toastification'
import vue3GoogleLogin from 'vue3-google-login'
import App from './App.vue'
import { initAuth, refresh, user } from './auth.js'
import router from './router.js'

initAuth()

const app = createApp(App)

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
  async (error) => {
    const config = error.config
    if (error.response?.status === 401 && !config._retry) {
      try {
        config._retry = true
        await refresh()
        config.headers.Authorization = `Bearer ${user.data.token}`
        return api(config)
      } catch (e) {
        console.error('Authentication error', e)
      }
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
