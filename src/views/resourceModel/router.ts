export default [{
    path: '/model',
    component: () => import ('@/views/resourceModel/index'),
    // redirect: '/model/standard',
    meta: {
        title: '资源模型',
        requireLogin: true,
        key: 'model',
        redirect: true
    },
    children: [{
            path: 'standard',
            component: () =>
                import ('@/views/resourceModel/standard/index'),
            meta: {
                title: '资源标准',
                key: 'model.all'
            },
            children: [{
                    path: 'category',
                    component: () =>
                        import ('@/views/resourceModel/standard/category'),
                    meta: {
                        title: '资源标准-分类',
                        key: 'model.all'
                    }
                },
                {
                    path: 'resource',
                    component: () =>
                        import ('@/views/resourceModel/standard/resource'),
                    meta: {
                        title: '资源标准-数据表',
                        key: 'model.all'
                    }
                },
                {
                    path: 'attribute',
                    component: () =>
                        import ('@/views/resourceModel/standard/attribute'),
                    meta: {
                        title: '资源标准-字段',
                        key: 'model.all'
                    }
                }
            ]
        },
        {
            path: 'category',
            component: () =>
                import ('@/views/resourceModel/category/index'),
            meta: {
                title: '资源目录',
                key: 'model.all'
            },
            children: [{
                path: 'list',
                component: () =>
                    import ('@/views/resourceModel/category/list'),
                meta: {
                    title: '资源目录-列表',
                    key: 'model.all',
                    // objType: '5010'
                }
            }]
        },
        {
            path: 'structure',
            component: () =>
                import ('@/views/resourceModel/structure/index'),
            meta: {
                title: '数据结构',
                key: 'model.all'
            },
            children: [{
                    path: 'catalog',
                    component: () =>
                        import ('@/views/resourceModel/structure/catalog'),
                    meta: {
                        title: '数据结构-目录',
                        key: 'model.all'
                    }
                },
                {
                    path: 'list',
                    component: () =>
                        import ('@/views/resourceModel/structure/list'),
                    meta: {
                        title: '数据结构-列表',
                        key: 'model.all',
                        // objType: '5020'
                    }
                }
            ]
        },
        {
            path: 'tag',
            component: () =>
                import ('@/views/resourceModel/tagManage/index'),
            meta: {
                title: '标签管理',
                key: 'model.all'
            },
            children: [{
                    path: 'list',
                    component: () =>
                        import ('@/views/resourceModel/tagManage/list'),
                    meta: {
                        title: '标签管理-列表',
                        key: 'model.all'
                    }
                }
            ]
        }
    ]
}]
