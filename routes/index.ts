import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'PluginAIGroup',
    path: '/plugins/ai/group',
    component: () => import('../views/index.vue'),
    meta: {
      title: $t('ai_group.menu'),
      icon: 'ri:group-line',
    },
  },
];

export default routes;
