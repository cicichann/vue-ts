export default [
  {
    path: '/recycle',
    component: () => import('@/views/recycle/index'),
    meta: {
      title: '回收站',
      requireLogin: true,
      key: 'recyclebin',
    },
    children: [
      {
        path: 'home',
        component: () => import('@/views/recycle/home'),
        meta: {
          title: '回收站',
          key: 'recyclebin.recyclebin'
        }
      }, {
        path: 'list',
        component: () => import('@/views/recycle/list'),
        beforeEnter: (to, from, next) => {
          if (to.query.resourceid) {
            next()
          } else {
            next({ path: '/recycle/home', query: from.query })
          }
        },
        meta: {
          title: '回收站',
          key: 'recyclebin.recyclebin'
        }
      }
    ]
  }
]
