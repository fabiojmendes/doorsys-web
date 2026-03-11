import { reactive } from 'vue'
import { decodeCredential, googleLogout, googleOneTap } from 'vue3-google-login'

const user = reactive({
  isAuthenticated: false,
  data: {}
})

export function initAuth() {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser)
      user.data = userData
      user.isAuthenticated = true
    } catch {
      logout()
    }
  }
}

export function login(response) {
  const userData = decodeCredential(response.credential)
  userData.token = response.credential
  user.data = userData
  user.isAuthenticated = true
  localStorage.setItem('user', JSON.stringify(userData))
}

export async function refresh() {
  const response = await googleOneTap({ cancelOnTapOutside: false, autoLogin: true })
  login(response)
}

export function logout() {
  user.isAuthenticated = false
  user.data = {}
  localStorage.removeItem('user')
  googleLogout()
}

export { user }
