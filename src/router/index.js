import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import Callback from '../views/Callback.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: App
    },
    {
      path: '/callback',
      component: Callback
    }
  ]
})

export default router
