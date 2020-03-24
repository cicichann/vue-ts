import axios from './config/axios'

/**
 * 资源标准
 */

// 资源标准-获取标准列表
const qs = require('qs')
export function queryStandardList() {
    return axios.get('/standards')
}

// 资源标准-获取权限过滤标准
export function queryAuthStandardList() {
    return axios.get('/standards/authorization')
}

// 资源标准-新增标准
export function addNewStandard(params) {
    let url = `/standards`
    let param = {
        name: params.name
    }
    return axios.post(url, qs.stringify(param))
}

// 资源标准-重命名标准
export function renameStandard(params) {
    let url = `/standards/${params.id}`
    let param = {
        name: params.name
    }
    return axios.put(url, qs.stringify(param))
}

// 资源标准-标准名校验
export function checkStandradName(params) {
  let url = `/standards/check/name`
  return axios.get(url, {params : params})
}

// 资源标准-删除标准
export function deleteStandard(params) {
    let url = `/standards/${params.id}`
    let param = {
        password: params.password
    }
    return axios.delete(url, { params: param })
}

// 资源标准-校验标准下有无数据
export function verifyStandardHasData(url) {
    return axios.get(`/standards/${url.standardId}/data/existence`)
}

// 资源标准-导入标准
export function uploadFile(params) {
    let url = `/standards/template`
    return axios.post(url, params)
}

// 资源标准-分类、资源、属性 列表查询
export function queryModelList(url, params) {
    return axios.get(url, { params: params })
}

// 资源标准-分类、资源、属性-列表拖拽
export function moveModelList(url, params) {
    return axios.put(url, qs.stringify(params))
}

// 资源标准-属性 列表查询
export function queryAttributeList(url, params) {
    url = `/standards/${url.standardId}/attribute/columns`

    return axios.get(url, { params: params })
}

// 资源标准-新增分类字段
export function addCategoryField(url, params) {
    url = `/standards/${url.standardId}/` +
        `category/columns`
    return axios.post(url, qs.stringify(params))
}

// 资源标准-新增分类字段-中文名合法性校验
export function verifyCateCname(url, params) {
    url = `/standards/${url.standardId}/` +
        `category/columns/verify/cname`
    return axios.get(url, { params: params })
}

// 资源标准-新增分类字段-英文名合法性校验
export function verifyCateEname(url, params) {
    url = `/standards/${url.standardId}/` +
        `category/columns/verify/ename`
    return axios.get(url, { params: params })
}

// 资源标准-编辑分类字段
export function editCategoryField(url, params) {
    url = `/standards/${url.standardId}/` +
        `category/columns` +
        `/${url.columnId}`
    return axios.put(url, qs.stringify(params))
}

// 资源标准-编辑分类字段-获取用户已填数据
export function queryCategoryFieldData(url) {
    url = `/standards/${url.standardId}/` +
        `category/columns` +
        `/${url.columnId}`
    return axios.get(url)
}

// 资源标准-新增/编辑分类字段-校验是否已有数据
export function verifyCategoryHasData(url) {
    url = `/standards/${url.standardId}/` +
        `categories/exists`
    return axios.get(url)
}

// 资源标准-新增资源字段
export function addResourceField(url, params) {
    url = `/standards/${url.standardId}/` +
        `resource/columns`
    return axios.post(url, qs.stringify(params))
}

// 资源标准-新增资源字段-中文名合法性校验
export function verifyResCname(url, params) {
    url = `/standards/${url.standardId}/` +
        `resource/columns/verify/cname`
    return axios.get(url, { params: params })
}

// 资源标准-新增资源字段-英文名合法性校验
export function verifyResEname(url, params) {
    url = `/standards/${url.standardId}/` +
        `resource/columns/verify/ename`
    return axios.get(url, { params: params })
}

// 资源标准-编辑资源字段
export function editResourceField(url, params) {
    url = `/standards/${url.standardId}/` +
        `resource/columns` +
        `/${url.columnId}`
    return axios.put(url, qs.stringify(params))
}

// 资源标准-编辑资源字段-获取用户已填数据
export function queryResourceFieldData(url) {
    url = `/standards/${url.standardId}/` +
        `resource/columns` +
        `/${url.columnId}`
    return axios.get(url)
}

// 资源标准-新增/编辑资源字段-校验是否已有数据
export function verifyResourceHasData(url) {
    url = `/standards/${url.standardId}/` +
        `resources/exists`
    return axios.get(url)
}

// 资源标准-新增属性字段
export function addAttributeField(url, params) {
    url = `/standards/${url.standardId}/` +
        `attribute/columns`
    return axios.post(url, qs.stringify(params))
}

// 资源标准-新增属性字段-中文名合法性校验
export function verifyAttrCname(url, params) {
    url = `/standards/${url.standardId}/` +
        `attribute/columns/verify/cname`
    return axios.get(url, { params: params })
}

// 资源标准-新增属性字段-英文名合法性校验
export function verifyAttrEname(url, params) {
    url = `/standards/${url.standardId}/` +
        `attribute/columns/verify/ename`
    return axios.get(url, { params: params })
}

// 资源标准-编辑属性字段
export function editAttributeField(url, params) {
    url = `/standards/${url.standardId}/` +
        `attribute/columns` +
        `/${url.columnId}`
    return axios.put(url, qs.stringify(params))
}

// 资源标准-编辑属性字段-获取用户已填数据
export function queryAttributeFieldData(url) {
    url = `/standards/${url.standardId}/` +
        `attribute/columns` +
        `/${url.columnId}`
    return axios.get(url)
}

// 资源标准-新增/编辑属性字段-校验是否已有数据
export function verifyAttributeHasData(url) {
    url = `/standards/${url.standardId}/` +
        `resources/columns/exists`
    return axios.get(url)
}

// 资源标准-分类、资源、属性-删除字段
export function deleteField(url, params) {
    return axios.delete(url, { params: params })
}

/**
 * 数据分类
 */

//数据分类-左侧导航树查询
export function queryCategoriesList(url, params) {
    url = `/standards/${url.standardId}/categories`
    return axios.get(url, { params: params })
}

//数据分类-左侧导航树-子菜单查询
export function querySubCategory(standardId, params) {
    const url = `/standards/${standardId}/categories`
    return axios.get(url, { params: params })
}

//数据分类-新增分类-获取字段列表
export function queryCategoryFields(url, params) {
    url = `/standards/${url.standardId}/` +
        `category/columns`
    return axios.get(url, { params: params })
}

//数据分类-新增分类
export function addCategory(url, params) {
    url = `/standards/${url.standardId}/` +
        `categories`
    return axios.post(url, qs.stringify(params))
}

//数据分类-编辑分类-获取用户已填数据
export function queryCategoryData(url, params) {
    url = `standards/${url.standardId}/` +
        `categories/${url.categoryId}`
    return axios.get(url)
}

//数据分类-编辑分类
export function editCategory(url, params) {
    url = `/standards/${url.standardId}/` +
        `categories/${url.categoryId}`
    return axios.put(url, qs.stringify(params))
}

//数据分类-编辑分类-表单输入值合法性校验
export function verifyCateInput(url, params) {
    url = `/standards/${url.standardId}/` +
        `categories/verify/param`
    return axios.get(url, { params: params })
}

// 数据分类-导入分类
export function classficatinExport(url, params) {
    url = `/standards/${url.standardId}/categories/template`
    return axios.post(url, params, {type: '个分类', operate: '导入'})
}

// 数据分类-列表查询
export function queryResClassifyList(url, params) {
    let param = {
        parentCategoryId: params.parentCategoryId,
        containsChildren: params.containsChildren,
        searchText: params.searchText || ''
    }
    url = `/standards/${url.standardId}/categories`
    return axios.get(url, { params: param })
}

// 数据分类-列表查询（权限过滤）
export function queryResClassifyListAuth(url, params) {
    let param = {
        parentCategoryId: params.parentCategoryId,
        containsChildren: params.containsChildren,
        searchText: params.searchText || ''
    }
    url = `/standards/${url.standardId}/categories/authorization`
    return axios.get(url, { params: param })
}

// 数据管理-根据应用查询三方分类列表
export function queryAppResClassifyList(url, params) {
    url = `/apps/${url.appId}/thirdpartycategories`
    return axios.get(url, { params: params })
}

//数据分类-模糊查询
export function vagueSearch(url, params) {
  url = `/standards/${url.standardId}/categories/list`
  return axios.get(url, { params : params })
}

//数据分类-模糊查询（权限过滤）
export function vagueSearchAuth(url, params) {
  url = url.appId ? `/apps/${url.appId}/thirdpartycategories/fuzzy`
  : `/standards/${url.standardId}/categories/list/authorization`
  return axios.get(url, { params : params })
}

// 数据分类-删除分类
export function classficatinDelete(url, params) {
    url = `/standards/${url.standardId}/categories/` + params.categoryIds
    return axios.delete(url)
}

// 数据分类-校验分类下是否有数据
export function classfyHaveData(url, params) {
  url = `/standards/${url.standardId}/categories/data/existence`
  return axios.get(url, { params: params, type: '个分类', operate: '删除' })
}

//数据分类-删除分类密码弹窗
export function classfyDelete(url, params) {
  url = `/standards/${url.standardId}/categories/` + url.categoryIds
  return axios.delete(url, { params: params })
}

// 数据分类-拖动排序
export function sortClassfication(url, params) {
    let param = {
        fromId: params.fromId,
        toId: params.toId,
        moveDirection: params.moveDirection
    }
    url = `/standards/${url.standardid}/categories/sort/`
    return axios.put(url, qs.stringify(param))
}

// 数据分类-查询当前分类的全路径
export function queryCategoryPath(standardId, categoryId) {
  const url = `/standards/${standardId}/categories/${categoryId}/path`
  return axios.get(url)
}

// 数据分类-移动到
export function categorymoveTo(url,params) {
  url = `/standards/${url.standardId}/categories/move`
  return axios.put(url, qs.stringify(params), {type: '个分类', operate: '移动'})
}

// 数据分类-移动面包屑
export function categorymoveToHead(url) {
  url = `/standards/${url.standardId}/categories/${url.categoryId}/nodes`
  return axios.get(url)
}

// 资源目录-合并分类
export function mergeCategory(url, params) {
    url = `/standards/${url.standardId}/categories/merge`
    return axios.post(url, qs.stringify(params))
}

// 资源目录-拆分分类
export function splitCategory(url, params) {
    url = `/standards/${url.standardId}/categories/${url.categoryId}/split`
    return axios.post(url, qs.stringify(params))
}

/**
 * 资源结构
 */

// 资源结构-分组列表查询
export function queryStructureGroupList(url) {
    url = `/standards/${url.standardId}/groups`
    return axios.get(url)
}

// 资源结构-新增分组
export function addGroup(url,params) {
  url = `/standards/${url.standardId}/groups`
  return axios.post(url, qs.stringify(params))
}

// 资源结构-删除分组
export function deleteGroup(url,params) {
  url = `/standards/${url.standardId}/groups/${url.groupId}`
  return axios.delete(url, {params : params, type: '个资源', operate: '删除'})
}

// 资源结构-修改分组
export function editGroup(url,params) {
  url = `/standards/${url.standardId}/groups/${url.groupId}`
  return axios.put(url, qs.stringify(params))
}

// 资源结构-分组名检验
export function checkGroupName(url, params) {
  url = `/standards/${url.standardId}/groups/check/name`
  return axios.get(url, {params : params})
}

// 资源结构-移动到
export function structureListMove(url, params) {
  url = `/standards/${url.standardId}/resources/move`
  return axios.put(url, qs.stringify(params), { type: '个资源', operate: '移动' })
}

// 资源结构-卡片拖动排序
export function structureDrag(url,params) {
  url = `/standards/${url.standardid}/resources/sort`
  return axios.put(url,qs.stringify(params))
}

// 资源结构-资源字段列表查询
export function queryStructureTableList(url, params) {
    url = `/standards/${url.standardId}/resources/${url.resourceId}/columns/transform`
    return axios.get(url, { params: params })
}

// 资源结构-资源列表查询
export function queryStructureListTable(url, params) {
    url = `/standards/${url.standardId}/resources`
    return axios.get(url, { params: params })
}

// 资源结构-删除属性字段
export function queryStructureListTableDel(url, params) {
    url = `/standards/${url.standardid}/resources/${url.resourceid}/columns/${params.columnId}`
    return axios.delete(url)
}

// 资源结构-删除资源
export function deleteResources(url, params) {
    url = `/standards/${url.standardId}/resources/${url.resourceIds}`
    return axios.delete(url, { params: params, type: '个资源', operate: '删除' })
}

// 资源结构-资源属性弹窗数据查询
export function queryAttributeFieldList (url, params) {
    url = `/standards/${url.standardId}/resources/${params.resourceId}/columns`
    return axios.get(url)
}

// 资源结构-保存资源属性弹窗数据
export function saveDistribution(url, params) {
    url = `/standards/${url.standardId}/resources/${params.resourceId}/columns/property`
    let param = {
        data: JSON.stringify(params.data)
    }
    return axios.post(url, qs.stringify(param))
}

// 资源结构-新增资源
export function addResource(url, params) {
    url = `/standards/${url.standardId}/` +
        `resources`
    return axios.post(url, qs.stringify(params))
}

// 资源结构-编辑资源
export function editResource(url, params) {
    url = `/standards/${url.standardId}/` +
        `resources/${url.resourceId}`
    return axios.put(url, qs.stringify(params))
}

// 资源结构-新增资源-获取字段列表
export function queryResourceFields(url, params) {
    url = `/standards/${url.standardId}/` +
        `resource/columns`
    return axios.get(url, { params: params })
}

// 资源结构-编辑资源-获取用户已填数据
export function queryResourceData(url) {
    url = `standards/${url.standardId}/` +
        `resources/${url.resourceId}`
    return axios.get(url)
}

// 资源结构-编辑资源-表单输入值合法性校验
export function verifyResourceInput(url, params) {
    url = `/standards/${url.standardId}/` +
        `resources/verify/param`
    return axios.get(url, { params: params })
}

// 资源结构-新增资源属性字段
export function addResourceAttrField(url, params) {
    url = `/standards/${url.standardId}/` +
        `resources/${url.resourceId}/` +
        `columns`
    return axios.post(url, qs.stringify(params))
}

// 资源结构-编辑资源属性字段
export function editResourceAttrField(url, params) {
    url = `/standards/${url.standardId}/` +
        `resources/${url.resourceId}/` +
        `columns/${url.columnId}`
    return axios.put(url, qs.stringify(params))
}

// 资源结构-编辑资源属性-获取用户已填数据
export function queryResourceAttrData(url) {
    url = `standards/${url.standardId}/` +
        `resources/${url.resourceId}/` +
        `columns/${url.columnId}`
    return axios.get(url)
}

// 资源结构-编辑资源属性-表单输入值合法性校验
export function verifyAttrInput(url, params) {
    url = `/standards/${url.standardId}/` +
        `resources/${url.resourceId}/` +
        `columns/verify/param`
    return axios.get(url, { params: params })
}

// 资源结构-导入资源
export function categoryExport(url, params) {
    url = `/standards/${url.standardId}/resources/template`
    return axios.post(url, params, {type: '个资源', operate: '导入'})
}

// 资源结构-复制资源
export function copyResource(url, params) {
    url = `/standards/${url.standardId}/resources/copy`
    return axios.post(url, qs.stringify(params))
}

// 数据结构-查询数据表中是否已有数据
export function checkResourceData (url) {
    url = `/standards/${url.standardId}/resources/${url.resourceId}/check`
    return axios.get(url)
}

// 版本信息获取
export function editionMsg() {
  let url = `/apps/system/version`
  return axios.get(url)
}

// 资源模型-获取字段类型列表
export function queryFieldType(params) {
    return axios.get('/field/type', { params: params })
}

/**
 * 标签管理
 */

// 标签管理-左侧树数据获取
export function queryTagTree() {
  let url = `/labels/type`
  return axios.get(url)
}

// 标签管理-列表查询
export function queryTagList(params) {
  let url = `/labels`
  return axios.get(url, { params: params })
}

// 标签管理-新增标签
export function AddTagList(params) {
  let url = `/labels`
  return axios.post(url, qs.stringify(params))
}

// 标签管理-编辑标签
export function editTagList(params) {
  let url = `/labels/${params.labelId}`
  let param = {
    label: params.label
  }
  return axios.post(url, qs.stringify(param))
}
// 标签管理-删除标签
export function deleteTagList(params) {
  let url = `/labels/${params.ids}`
  return axios.delete(url)
}

// 标签管理-导入标签
export function exportTagList(params) {
  let url = `/labels/import`
  return axios.post(url, params)
}

// 标签管理-标签重名校验
export function verifyTagList(params) {
  let url = `/labels/verify`
  return axios.get(url, {params: params})
}

// 标签管理-启用功能
export function tagStar(params) {
  let url = `/labels/enable/${params.ids}`
  return axios.put(url)
}

// 标签管理-停用功能
export function tagStop(params) {
  let url = `/labels/disable/${params.ids}`
  return axios.put(url)
}
