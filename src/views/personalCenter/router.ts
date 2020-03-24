export default [{
    name: 'system',
    path: '/system',
    component: () =>
        import ('@/views/personalCenter/index'),
    meta: {
        title: '个人中心',
        requireLogin: true,
        key: 'sysconf',
        redirect: true
    },
    // redirect: '/system/userGroup',
    children: [{
        path: 'appauth',
        component: () =>
            import ('@/views/personalCenter/systemConfig/appAuth/index'),
        meta: {
            title: '系统配置-应用授权',
            key: 'sysconf.appauth'
        }
    }, {
        path: 'userGroup',
        component: () =>
            import ('@/views/personalCenter/systemConfig/userGroup/index'),
        meta: {
            title: '系统配置-用户组织管理',
            key: 'sysconf.user,sysconf.group'
        },
        redirect: '/system',
        children: [{
                path: 'user',
                component: () =>
                    import ('@/views/personalCenter/systemConfig/userGroup/user'),
                meta: {
                    title: '系统配置-用户管理',
                    key: 'sysconf.user'
                }
            }, {
                path: 'group',
                component: () =>
                    import ('@/views/personalCenter/systemConfig/userGroup/group'),
                meta: {
                    title: '系统配置-组织管理',
                    key: 'sysconf.group'
                }
            }
        ]
    }, {
        path: 'roleManage',
        component: () =>
            import ('@/views/personalCenter/systemConfig/role/index'),
        meta: {
            title: '系统配置-角色管理',
            key: 'sysconf.role'
        }
    }, {
        path: 'rightManage',
        component: () =>
            import ('@/views/personalCenter/systemConfig/right/index'),
        meta: {
            title: '系统配置-权限模板',
            key: 'sysconf.righttemplate'
        }
    }, {
        path: 'configuration',
        component: () =>
            import ('@/views/personalCenter/systemConfig/configuration/index'),
        meta: {
            title: '系统配置-配置项管理',
            key: 'sysconf.config'
        }
    }]
}]
