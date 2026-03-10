import { createRouter, createWebHistory } from 'vue-router'

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

router.beforeEach((to, _from, next) => {
  const isAuthenticated = !!localStorage.getItem('user')

  if (to.name !== 'login' && !isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    next({ path: '/' })
  } else {
    next()
  }
})

export default router
