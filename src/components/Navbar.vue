<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'

import { logout } from '../auth.js'

const user = inject('user')
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar navbar-expand-sm bg-dark" data-bs-theme="dark" v-if="user.isAuthenticated">
    <div class="container main-container">
      <RouterLink class="navbar-brand" to="/">Doorsys</RouterLink>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main-menu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="main-menu">
        <div class="navbar-nav me-auto">
          <RouterLink class="nav-item nav-link" to="/customers">Customers</RouterLink>
          <RouterLink class="nav-item nav-link" to="/logs">Logs</RouterLink>
        </div>
        <div class="navbar-nav ms-auto">
          <span class="navbar-text me-3">
            <img :src="user.data.picture" class="rounded-circle me-1" width="24" height="24" />
            {{ user.data.name }}
          </span>
          <button class="btn btn-outline-light btn-sm" @click="handleLogout">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>
