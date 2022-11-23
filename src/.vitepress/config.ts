import { resolve } from 'path'
import { UserConfig } from 'vitepress'

const sidebar = [
  {
    collapsible: true,
    text: 'Vite',
    items: [{ text: '前端模块化的变迁', link: '/vite/module' }],
  },
  {
    collapsible: true,
    text: 'React',
    items: [{ text: '渲染优化', link: '/react/render' }],
  },

  {
    collapsible: true,
    text: 'Javascript',
    items: [{ text: '宏任务与微任务', link: '/javascript/MacroAndMicroTask' }],
  },
  {
    collapsible: true,
    text: 'CSS',
    items: [{ text: '重学CSS', link: '/css/relearn' }],
  },
]

const config: UserConfig = {
  title: 'suemor 学习笔记',
  description: 'suemor 学习笔记',
  lang: 'zh-CN',
  outDir: resolve(__dirname, '../../dist'),

  head: [
    ['link', { rel: 'icon', href: 'https://y.suemor.com/imagesavatar.jpeg' }],
    ['meta', { property: 'og:title', content: 'suemor notes' }],
  ],

  themeConfig: {
    logo: '/favicon.png',

    socialLinks: [{ icon: 'github', link: 'https://github.com/suemor233' }],
    // nav: navBar,
    sidebar: {
      '/vite/': sidebar,
      '/react/': sidebar,
      '/javascript/': sidebar,
      '/css/': sidebar,
    },
    footer: {
      copyright: `Copyright © 2020-${new Date().getFullYear()} Suemor`,
    },
  },
}

export default config
