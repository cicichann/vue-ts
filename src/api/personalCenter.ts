import axios from './config/axios'
const qs = require('qs')

// 判断用户是否为admin
export function isAdmin() {
  let url = `/users/administrator`
  return axios.get(url)
}

// 查询应用
export function queryAppList(params) {
    return axios.get('/apps', { params: params })
}

// 查询应用授权详情
export function queryAppAuth(url) {
    url = `/apps/${url.id}/accreditions`
    return axios.get(url)
}

// 保存应用授权详情
export function saveAppAuth(params) {
    return axios.put(`/apps/oauth`, params)
}

// 获取所有资源列表
export function queryResList(params) {
    return axios.get('/apps/resources', { params: params })
}

// 获取所有分类列表
export function queryCatList(params) {
    return axios.get('/apps/categories', { params: params })
}

// 用户管理

// 新增用户
export function addUsers(params) {
    return axios.post('/users', qs.stringify(params))
}

// 获取用户信息
export function getUserMsg(params) {
    let url = '/users/' + params.id
    return axios.get(url)
}

// 编辑用户信息
export function editUserMsg(url, params) {
    url = '/users/' + url.id
    return axios.put(url, qs.stringify(params))
}

// 删除用户
export function deleteUser(params) {
    let url = '/users/' + params.ids
    return axios.delete(url)
}

// 查询用户信息列表
export function queryUserList(params) {
    let url = '/users'
    return axios.get(url, { params: params })
}

// 用户导入
export function exportUser(params) {
    let url = '/users/template'
    return axios.post(url, params)
}

// 用户重置密码
export function resetPwd(params) {
    let url = `/users/reset/pwd`
    return axios.put(url, qs.stringify(params))
}

// 启用
export function starUser(params) {
    let url = `/users/enable`
    return axios.put(url, qs.stringify(params))
}

// 停用
export function stopUser(params) {
    let url = `/users/disable`
    return axios.put(url, qs.stringify(params))
}

// 请求个人信息
export function queryUserInfo(params) {
    let url = `/users/userInfo`
    return axios.get(url, { params: params })
}

// 修改个人信息
export function editUserInfo(params) {
    let url = `/users/userInfo`
    return axios.put(url, qs.stringify(params))
}

// 校验密码
export function checkPassWord(params) {
    let url = `/users/checkpassword`
    return axios.post(url, qs.stringify(params))
}

// 重置密码
export function reserPassword(params) {
    let url = `/users/password`
    return axios.put(url, qs.stringify(params))
}

// 用户名是否重复校验
export function personalCheckUserName(params) {
    let url = `/users/check/name`
    return axios.get(url, { params: params })
}

//密码是否可用
export function personalCheckPassWord(params) {
    let url = `/users/check/pwd`
    return axios.get(url, { params: params })
}

//密码是否重复
export function personalresetCheckPassWord(params) {
    let url = `/users/reset/check/pwd`
    return axios.get(url, { params: params })
}

// 用户管理 —— 已选角色列表
export function queryRoleRightList(params) {
    let url = `/users/${params.userId}/relations/roles`
    return axios.get(url)
}

// 用户管理 —— 分配角色回调
export function roleDistrib(url, params) {
    url = `/users/${url.userId}/relations/roles`
    return axios.post(url, qs.stringify(params))
}

// 组织管理

// 查询组织列表
export function queryGroupList(params) {
    let url = '/groups'
    return axios.get(url, { params: params })
}

// 组织检索
export function searchGroups(params) {
    let url = '/groups/list'
    return axios.get(url, { params: params })
}
// 新增组织
export function addGroups(params) {
    let url = '/groups'
    return axios.post(url, qs.stringify(params))
}

// 删除组织
export function deleteGroups(params) {
    let url = `/groups/${params.groupIds}`
    return axios.delete(url)
}

// 修改组织
export function editGroups(params) {
    let url = `/groups/${params.groupId}`
    return axios.put(url, qs.stringify(params))
}

// 拖动排序
export function moveGroups(params) {
    let url = `/groups/sort`
    return axios.post(url, qs.stringify(params))
}

// 获取导入组织信息的模板
export function queryTemplate() {
    let url = '/groups/template'
    return axios.get(url, {})
}

// 导入组织信息的模板
export function loadTemplate(params) {
    let url = '/groups/template'
    return axios.post(url, params)
}

// 根据组织id获取父节点id
export function queryParentId(params) {
    let url = `/groups/${params.groupId}/parent/id`
    return axios.get(url, {})
}

// 根据组织id获取全路径
export function queryGroupPath(url) {
    url = `/groups/${url.id}/path`
    return axios.get(url)
}

// 移动组织
export function moveGroup(params) {
    let url = `/groups/position`
    return axios.post(url, qs.stringify(params))
}

// 组织排序
export function groupSort(params) {
    let url = '/groups/sort'
    return axios.post(url, qs.stringify(params))
}

// 获取当前组织索引值及同级组织数
export function queryPosInfo(url) {
    return axios.get(`/groups/${url.id}/positions`)
}

//组织管理导入用户
export function exportUserToGroup(groupid,params) {
    let url = `/groups/${groupid}/users/template`
    return axios.post(url, params)
}

// 组织管理删除用户
export function deleteUserInGroup(params) {
    let url = `/groups/${params.groupId}/users`
    return axios.delete(url, { params: params})
}

// 组织管理移除用户
export function removeUsers(params) {
    let url = `/groups/${params.groupId}/relations/users`
    return axios.delete(url, { params: params})
}

// 组织管理启用用户
export function startGroupUser(params) {
    let url = `/groups/${params.id}/users/status/enable`
    return axios.post(url, qs.stringify(params))
}

// 组织管理停用用户
export function stopGroupUser(params) {
    let url = `/groups/${params.id}/users/status/disable`
    return axios.post(url, qs.stringify(params))
}

// 组织管理重置密码
export function groupResetPassword(params) {
    let url = `/groups/${params.groupId}/users/pwd`
    return axios.post(url, qs.stringify(params))
}

// 组织管理新建用户
export function addUserInGroup(params) {
    let url = `/groups/${params.groupId}/users`
    return axios.post(url, qs.stringify(params))
}

// 分配用户
export function distribUser(params) {
    let url = `/groups/${params.groupId}/relations/users`//lhy修改路径
    return axios.post(url, qs.stringify(params))
}

// 获取右侧已添加用户列表信息
export function selectedUsers(params) {
    let url = `/groups/${params.groupId}/relations/users`//lhy修改路径
    return axios.get(url, { params: params })
}

// 添加用户获取左侧已过滤的未添加的用户列表
export function queryPassUsers(params) {
    let url = `/groups/users`
    return axios.get(url, { params: params })
}

// 分配角色
export function distribRole(params) {
    let url = `/groups/${params.groupId}/roles`//lhy修改路径
    return axios.post(url, qs.stringify(params))
}

// 获取左侧角色列表信息
export function queryRoleList(params) {
    let url = `/roles`
    return axios.get(url, { params: params })
}

// 获取右侧已添加角色列表信息
export function selectedRoles(params) {
    let url = `/groups/${params.groupId}/roles`
    return axios.get(url, { params: params })
}

// 校验组织名是否可用
export function isUsedGroupName(params) {
    let url = '/groups/check/name'
    return axios.get(url, { params: params })
}
// 分配组织弹窗左侧数据
export function queryOrganizeList(params) {
    let url = `/groups`
    return axios.get(url, { params: params })
}

// 分配组织弹窗右侧数据
export function queryOrganizeRightList(params) {
    let url = `/users/${params.userId}/relations/groups`
    return axios.get(url)
}

// 分配组织回调
export function groupDistrib(url, params) {
    url = `/users/${url.userId}/relations/groups`//lhy修改
    return axios.post(url, qs.stringify(params))
}

// 用户中心-分配用户获取右侧选中
export function queryUserRightList(url) {
    url = `/users/${url.userId}/relations/groups`
    return axios.get(url)
}

//组织管理-移动用户
export function moveUser(url, params) {
    url = `/groups/${url.id}/users/position`
    return axios.post(url, qs.stringify(params))
}

// 角色管理

// 添加角色
export function addRoles(params) {
    let url = `/roles`
    return axios.post(url, qs.stringify(params))
}

// 删除角色
export function deleteRole(params) {
    let url = `/roles/${params.roleIds}`
    return axios.delete(url)
}

// 修改角色信息
export function editRole(params) {
    let url = `/roles/${params.roleId}`
    return axios.put(url, qs.stringify(params))
}

// 为角色分配用户
export function distributeUser(params) {
    let url = `/roles/${params.roleId}/relations/users`
    return axios.post(url, qs.stringify(params))
}

// 获取右侧已添加用户列表信息
export function queryCheckedUsers(params) {
    let url = `/roles/${params.roleId}/relations/users`
    return axios.get(url, {})
}

// 给角色分配组织
export function distributeGroup(params) {
    let url = `/roles/${params.roleId}/relations/groups`//lhy修改
    return axios.post(url, qs.stringify(params))
}

// 获取右侧已添加组织列表
export function queryCheckedGroup(params) {
    let url = `/roles/${params.roleId}/relations/groups`
    return axios.get(url, {})
}

// 分类授权 保存角色授权对象
export function categories(params) {
    let url = `/rights/oprObjs`
    return axios.post(url, params)
}

// 获取右侧已添加分类列表
export function checkedCategories(url, params) {
    url = `/roles/${url.roleId}/category/authorization`
    return axios.get(url, { params: params })
}

// 分类授权-分类树模糊检索
export function cateFuzzySearch(params) {
    return axios.get(`/standards/categories/list`, { params: params })
}

// 检验角色是否可用
export function isCheckedRole(params) {
    let url = `/roles/check/name`
    return axios.get(url, { params: params })
}

// 获取权限模板的列表
export function queryAuthTemplate(params) {
    let url = `/rights/templates`
    return axios.get(url, { params: params })
}

// 获取模板权限位列表信息
export function queryRightTemplate(params) {
    let url = `/rights/templates/${params.rightTemplateId}/keys`
    return axios.get(url)
}

// 权限模板-修改权限位信息
export function changeRightTemplate(id, params) {
    let url = `/rights/templates/${id}/keys`
    return axios.post(url, params)
}

// 权限模板-新增权限模板
export function addAuth(params) {
    let url = `/rights/templates`
    return axios.post(url, qs.stringify(params))
}

// 权限模板-删除权限
export function deleteAuth(params) {
    let url = `/rights/templates/${params.id}`
    return axios.delete(url)
}

// 权限模板-修改模板名
export function changeAuth(params) {
    let url = `/rights/templates/${params.id}`
    return axios.put(url, qs.stringify(params))
}

// 权限模板-校验模板名是否重复
export function checkTemplateName(params) {
    let url = `/rights/templates/name/availability`
    return axios.get(url, { params: params })
}

// 根据父级查询有权限的子级
export function queryRight(params) {
    let url = `/rights/authorizedKeys`
    return axios.get(url, { params: params })
}

/**
 * 配置项管理
 */

// 配置项管理-查询配置项列表
export function queryConfig(params) {
    return axios.get(`/sys/configs`, {params: params})
}

// 配置项管理-新增配置项
export function addConfig(params) {
    return axios.post(`/sys/configs`, qs.stringify(params))
}

// 配置项管理-重名校验
export function verifyConfigName(params) {
    return axios.get(`/sys/configs/verification`, {params: params})
}

// 配置项管理-查询配置项信息
export function findConfigById(url) {
    return axios.get(`/sys/configs/${url.id}`)
}

// 配置项管理-编辑配置项
export function editConfig(url, params) {
    return axios.post(`/sys/configs/${url.id}`, qs.stringify(params))
}

// 配置项管理-删除配置项
export function deleteConfig(configIds) {
    return axios.delete(`/sys/configs/${configIds}`)
}

// 只看当前分类配置项是否开启
export function checkOnlyMy() {
    return axios.get('/sys/configs/onlyMy')
}
