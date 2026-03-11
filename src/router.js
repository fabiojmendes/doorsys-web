import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from './auth.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/',
      redirect: '/customers'
    },
    {
      path: '/customers',
      component: () => import('@/views/CustomerListView.vue')
    },
    {
      path: '/customers/:id',
      component: () => import('@/views/CustomerView.vue')
    },
    {
      path: '/staff/:id',
      component: () => import('@/views/StaffView.vue')
    },
    {
      path: '/logs',
      component: () => import('@/views/EntryLogView.vue')
    }
  ]
})

router.beforeEach((to) => {
  const authenticated = isAuthenticated()

  if (to.name !== 'login' && !authenticated) {
    return { name: 'login' }
  } else if (to.name === 'login' && authenticated) {
    return { path: '/' }
  } else {
    return
  }
})

export default router
