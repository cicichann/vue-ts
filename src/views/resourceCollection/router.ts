export default [{
    path: '/collection',
    component: () => import ('@/views/resourceCollection/index'),
    // redirect: '/collection/realtime',
    meta: {
        title: '资源归集',
        requireLogin: true,
        key: 'aggr',
        redirect: true
    },
    children: [{
            path: 'realtime',
            component: () => import ('@/views/resourceCollection/realtimeData/index'),
            meta: {
                title: '实时数据接入',
                key: 'aggr.reltimedata'
            },
            children: [{
              path: 'cardList',
              component: () => import ('@/views/resourceCollection/realtimeData/card'),
              meta: {
                title: '实时数据接入',
                key: 'aggr.reltimedata'
              },
            },{
              path: 'tableList',
              component: () => import ('@/views/resourceCollection/realtimeData/list'),
              meta: {
                title: '实时数据接入',
                key: 'aggr.reltimedata'
              },
            }]
        },
        {
            path: 'history',
            component: () => import ('@/views/resourceCollection/historyData/index'),
            meta: {
                title: '历史数据迁移',
                key: 'aggr.historydata'
            },
            children: [
                {
                    path: 'task',
                    component: () => import('@/views/resourceCollection/historyData/task'),
                    meta: {
                        title: '历史数据迁移',
                        key: 'aggr.historydata'
                    }
                },
                {
                    path: 'list',
                    component: () => import('@/views/resourceCollection/historyData/list'),
                    meta: {
                        title: '历史数据迁移',
                        key: 'aggr.historydata'
                    }
                }
            ]
        },
        {
            path: 'document',
            component: () => import ('@/views/resourceCollection/interfaceDoc/index'),
            meta: {
                title: '接口文档',
                key: 'aggr.apidoc'
            }
        },
        {
          path: 'app',
          component: () => import ('@/views/resourceCollection/appManage/index'),
          meta: {
              title: '应用管理',
              key: 'aggr.appmgt'
          }
        },
        {
            path: 'mapping',
            component: () => import ('@/views/resourceCollection/mappingManage/index'),
            meta: {
                title: '映射管理',
                key: 'aggr.mappingmgt'
            },
            children: [
              {
                path: '',
                components: {
                  left: () => import ('@/views/resourceCollection/mappingManage/left'),
                  right: () => import ('@/views/resourceCollection/mappingManage/mapping-list')
                },
                meta: {
                  title: '映射管理',
                  key: 'aggr.mappingmgt'
                }
              }, {
                path: ':id',
                components: {
                  left: () => import ('@/views/resourceCollection/mappingManage/left'),
                  right: () => import ('@/views/resourceCollection/mappingManage/mapping-list')
                },
                meta: {
                  title: '映射管理',
                  key: 'aggr.mappingmgt'
                }
              }
            ]
        }
    ]
}]
