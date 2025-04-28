import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import MakeCall from '../components/CallButtonComponent.vue'; 
import { isAuthenticated } from '../auth';

const routes = [
  {
    path: '/FrankesteinToConsumeAPIForCalls/',
    name: 'Login',
    component: Login,
  },
  {
    path: '/FrankesteinToConsumeAPIForCalls/make-call',
    name: 'MakeCall',
    component: MakeCall,
    meta: { requiresAuth: true }, 
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
