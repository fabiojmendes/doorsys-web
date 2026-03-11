<script setup>
import { useRouter } from 'vue-router'
import { login } from '../auth.js'

const router = useRouter()

const callback = (response) => {
  login(response)
  router.push('/')
}
</script>

<template>
  <div class="row justify-content-center mt-5">
    <div class="col-11 col-md-10 col-lg-8">
      <div class="card shadow">
        <div class="card-body text-center p-5">
          <h2 class="mb-4 text-primary">Welcome</h2>
          <p class="text-muted mb-5">
            Please sign in with your Google account to access the system
          </p>
          <div class="d-flex justify-content-center">
            <GoogleLogin :callback="callback" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
