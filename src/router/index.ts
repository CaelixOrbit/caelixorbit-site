import { createRouter, createWebHistory } from 'vue-router'

import ContactView from '@/pages/ContactView.vue'
import HomeView from '@/pages/HomeView.vue'
import IdentityView from '@/pages/IdentityView.vue'
import NoteDetailView from '@/pages/NoteDetailView.vue'
import NotesIndexView from '@/pages/NotesIndexView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    if (to.name === 'notes' && from.name === 'notes' && to.path === from.path) {
      return false
    }

    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/notes',
      name: 'notes',
      component: NotesIndexView,
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
    },
    {
      path: '/identity',
      name: 'identity',
      component: IdentityView,
    },
    {
      path: '/notes/:slug+',
      name: 'note-detail',
      component: NoteDetailView,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
