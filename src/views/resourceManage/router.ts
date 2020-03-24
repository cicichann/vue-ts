// 数据管理路由
export default [
  {
    path: '/manage',
    component: () => import('@/views/resourceManage/index'),
    // redirect: '/manage/summary',
    meta: {
      title: '数据管理',
      requireLogin: true,
      key: 'datamgt',
      redirect: true
    },
    children: [
      {
        path: 'summary',
        component: () => import('@/views/resourceManage/summary/index'),
        meta: {
          title: '资源概览',
          key: 'datamgt.overview'
        }
      },
      {
        path: 'inforepo',
        component: () => import('@/views/resourceManage/infoRepository/index'),
        meta: {
          title: '信息资源库',
          key: 'datamgt.data'
        },
        children: [
          {
            path: 'home',
            component: () => import('@/views/resourceManage/infoRepository/tab/home'),
            meta: {
              title: '信息资源库-首页',
              key: 'datamgt.data'
            }
          },
          {
            path: 'list',
            component: () => import('@/views/resourceManage/infoRepository/tab/list'),
            beforeEnter: (to, from, next) => {
              if (to.query.resourceid) {
                next()
              } else {
                next({ path: '/manage/inforepo/home', query: from.query })
              }
            },
            meta: {
              title: '信息资源库-列表',
              key: 'datamgt.data',
              objType: '5010'
            }
          },
          {
            path: 'pic',
            component: () => import('@/views/resourceManage/infoRepository/tab/pic'),
            meta: {
              title: '信息资源库-图片',
              key: 'datamgt.data'
            }
          },
          {
            path: 'video',
            component: () => import('@/views/resourceManage/infoRepository/tab/video'),
            meta: {
              title: '信息资源库-视频',
              key: 'datamgt.data'
            }
          },
          {
            path: 'file',
            component: () => import('@/views/resourceManage/infoRepository/tab/file'),
            meta: {
              title: '信息资源库-文件',
              key: 'datamgt.data'
            }
          }
        ]
      },
      {
        path: 'topic',
        component: () => import('@/views/resourceManage/specialTopic/index'),
        meta: {
          title: '专题库',
          key: 'datamgt.dissertation'
        },
        children: [
          {
            path: 'home',
            component: () => import('@/views/resourceManage/specialTopic/tab/home'),
            meta: {
              title: '专题库-首页',
              key: 'datamgt.dissertation'
            }
          },
          {
            path: 'list',
            component: () => import('@/views/resourceManage/specialTopic/tab/list'),
            beforeEnter: (to, from, next) => {
              if (to.query.resourceid) {
                next()
              } else {
                next({ path: '/manage/topic/home', query: from.query })
              }
            },
            meta: {
              title: '专题库-列表',
              key: 'datamgt.dissertation',
              objType: '5010'
            }
          },
          {
            path: 'pic',
            component: () => import('@/views/resourceManage/specialTopic/tab/pic'),
            meta: {
              title: '专题库-图片',
              key: 'datamgt.dissertation'
            }
          },
          {
            path: 'video',
            component: () => import('@/views/resourceManage/specialTopic/tab/video'),
            meta: {
              title: '专题库-视频',
              key: 'datamgt.dissertation'
            }
          },
          {
            path: 'file',
            component: () => import('@/views/resourceManage/specialTopic/tab/file'),
            meta: {
              title: '专题库-文件',
              key: 'datamgt.dissertation'
            }
          }
        ]
      },
      {
        path: 'monitor',
        component: () => import('@/views/resourceManage/monitorCenter/index'),
        meta: {
          title: '监控中心',
          key: 'datamgt.monitorcenter',
        },
        children: [
          {
            path: 'dataaccess',
            component: () => import('@/views/resourceManage/monitorCenter/collection/dataAccess'),
            meta: {
              title: '数据接入',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'autocategory',
            component: () => import('@/views/resourceManage/monitorCenter/collection/autoCategory'),
            meta: {
              title: '自动分类',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'automark',
            component: () => import('@/views/resourceManage/monitorCenter/collection/autoMark'),
            meta: {
              title: '自动打标',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'autounduplicate',
            component: () => import('@/views/resourceManage/monitorCenter/collection/autoUnduplicate'),
            meta: {
              title: '自动排重',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'distribute',
            component: () => import('@/views/resourceManage/monitorCenter/share/distribute'),
            meta: {
              title: '资源下发',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'report',
            component: () => import('@/views/resourceManage/monitorCenter/share/report'),
            meta: {
              title: '资源报送',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'check',
            component: () => import('@/views/resourceManage/monitorCenter/monitor/check'),
            meta: {
              title: '智能校对',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'withdrawal',
            component: () => import('@/views/resourceManage/monitorCenter/monitor/withdrawal'),
            meta: {
              title: '一键撤稿',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'operation',
            component: () => import('@/views/resourceManage/monitorCenter/maintenance/operation'),
            meta: {
              title: '操作日志',
              key: 'datamgt.monitorcenter'
            }
          }, {
            path: 'performance',
            component: () => import('@/views/resourceManage/monitorCenter/maintenance/performance'),
            meta: {
              title: '性能日志',
              key: 'datamgt.monitorcenter'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/ai',
    component: () => import('@/views/resourceManage/ai/index'),
    meta: {
      title: '智能处理',
      requireLogin: true,
      key: 'intel'
    },
    children: [
      {
        path: 'preview',
        component: () => import('@/views/resourceManage/ai/docPreview'),
        meta: {
          title: '数据预览',
          key: 'intel.view'
        }
      }, {
        path: 'trace',
        component: () => import('@/views/resourceManage/ai/useTrack'),
        meta: {
          title: '使用轨迹'
        }
      }, {
        path: 'record',
        component: () => import('@/views/resourceManage/ai/editHistory'),
        meta: {
          title: '审阅核查'
        }
      }, {
        path: 'proof',
        component: () => import('@/views/resourceManage/ai/docProof'),
        meta: {
          title: '智能校对'
        }
      }, {
        path: 'knowledgemap',
        component: () => import('@/views/resourceManage/ai/knowledgeMap'),
        meta: {
          title: '知识图谱'
        }
      }
    ]
  }
]
