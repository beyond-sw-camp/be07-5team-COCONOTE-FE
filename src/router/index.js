import {createRouter, createWebHistory} from 'vue-router';

import HomePage from '@/views/HomePage.vue';
import { canvasRouter } from './canvasRouter';
import { threadRouter } from '@/router/threadRouter'
import { channelRouter } from '@/router/channelRouter'
import SearchComponent from '@/components/test/SearchComponent.vue';

const routes = [
    {
        // path로도 라우팅이 가능하고, name으로도 라우팅이 가능
        // name으로 라우팅하는 경우는 js코드내에서 라우팅하는 경우
        path: '/',
        name: 'HOME',
        component: HomePage
    },
    {
        path: '/workspace/:workspaceId/search',
        name: 'SEARCH',
        component: SearchComponent,
        props: true  // workspaceId를 props로 전달하기 위해 설정
    },
    ...channelRouter,
    ...canvasRouter,
    ...threadRouter,
]


const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router;