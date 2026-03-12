<script setup>
import { useAuth0 } from "@auth0/auth0-vue";
import { RouterLink } from "vue-router";

const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();

const handleLogin = () => {
	loginWithRedirect();
};

const handleLogout = () => {
	logout({
		logoutParams: {
			returnTo: window.location.origin,
		},
	});
};
</script>

<template>
  <nav class="navbar navbar-expand-sm bg-dark" data-bs-theme="dark">
    <div class="container main-container">
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#main-menu"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="main-menu">
        <div class="navbar-nav me-auto">
          <RouterLink class="navbar-brand" to="/">Doorsys</RouterLink>
          <template v-if="isAuthenticated">
            <RouterLink class="nav-item nav-link" to="/customers">Customers</RouterLink>
            <RouterLink class="nav-item nav-link" to="/logs">Logs</RouterLink>
          </template>
        </div>
        <div class="navbar-nav">
          <template v-if="!isAuthenticated">
            <button class="btn btn-outline-light btn-sm" @click="handleLogin">Log in</button>
          </template>
          <template v-else>
            <div class="d-flex align-items-center me-3">
              <img
                v-if="user?.picture"
                :src="user.picture"
                alt="User Profile"
                class="rounded-circle me-2"
                style="width: 30px; height: 30px"
              />
              <span class="text-light small">{{ user?.name || user?.email }}</span>
            </div>
            <button class="btn btn-outline-light btn-sm" @click="handleLogout">Log out</button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>
