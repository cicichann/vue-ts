import axios, { CancelToken } from './config/axios'

const qs = require('qs')

// 实时数据接入左侧树
export function realtimeDateTree(url) {
  url = `/collection/uniformance/standards/${url.standardId}/datasources`
  return axios.get(url)
}

// 实时数据右侧列表查询
export const realtimeDateList = (function() {
  let cancel = null
  return function(params) {
    if (cancel) {
      cancel()
    }

    let url = `/collection/uniformance/resources`
    return axios.get(url, { params : params, cancelToken: new CancelToken((c) => { cancel = c }) })
  }
})()

// 实时数据右侧表格数据查询
export function realtimeDateTableList(params) {
  let url = `/collection/uniformance/resources/log`
  return axios.get(url, { params : params})
}

/**
 * 历史数据迁移
 */

// 历史数据迁移-获取左侧导航列表
export function queryMappingList(url) {
  url = `/standards/${url.standardId}/datasources`
  return axios.get(url)
}

// 历史数据迁移-获取任务列表
export const queryTaskList = (function() {
  let cancel = null

  return function(url, params) {
    if (cancel) {
      cancel()
    }

    url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks`
    return axios.get(url, { params: params, cancelToken: new CancelToken((c) => { cancel = c }) })
  }
})()

// 历史数据迁移-新增任务
export function addTask(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks`
  return axios.post(url, params)
}

// 历史数据迁移-新增Xml任务
export function addXmlTask(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks`
  return axios.post(url, params)
}

// 历史数据迁移-查询一级目录列表
export function queryNodes(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/sites`
  return axios.get(url)
}

// 历史数据迁移-查询子目录列表
export function querySubNodes(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/channels`
  return axios.get(url, { params: params })
}

// 历史数据迁移-检索站点、栏目
export const searchChannelSites = (function() {
  let cancel = null

  return function(url, params) {
    if (cancel) {
      cancel()
    }

    url = `/standards/${url.standardId}/datasources/${url.datasourceId}/channelsAndSites`
    return axios.get(url, { params: params, cancelToken: new CancelToken((c) => { cancel = c })})
  }
})()

// 历史数据迁移-查询爬虫表及字段
export function queryTables(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/tables`
  return axios.get(url)
}

// 历史数据迁移-删除任务
export function deleteTask(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.taskIds}`
  return axios.delete(url, { params: params })
}

// 历史数据迁移-获取任务详情
export function queryTaskInfo(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.taskId}`
  return axios.get(url)
}

//历史数据迁移-获取数据库表
export function queryDatabase(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/dbTableNames`
  return axios.get(url)
}

// 历史数据迁移-编辑任务
export function editTask(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.taskId}`
  return axios.post(url, params)
}

//历史数据迁移-编辑xml任务
export function editXmlTask(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.taskId}`
  return axios.post(url, params)
}

// 历史数据迁移-任务名重复性校验
export function verifyTaskName(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/isTransfertaskDuplicate`
  return axios.post(url, qs.stringify(params))
}

// 历史数据迁移-执行/暂停任务
export function operateTask(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.taskId}/operation`
  return axios.post(url, qs.stringify(params))
}

// 历史数据迁移-获取任务详情列表
export function queryTaskDetail(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.taskId}/taskdetails`
  return axios.get(url, { params: params })
}

// 历史数据迁移-删除任务详情
export function deleteTaskDetail(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.taskId}/taskdetails/${url.detailIds}`
  return axios.delete(url)
}

// 历史数据迁移-查询任务站点列表
export function queryTaskSites(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.transferTaskId}/taskdetails/sites`
  return axios.get(url)
}

// 历史数据迁移-查询任务栏目列表
export function queryTaskChannels(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/transfertasks/${url.transferTaskId}/taskdetails/sites/${url.siteId}/channels`
  return axios.get(url, { params: params})
}

// 历史数据迁移-查询列表字段
export function queryTaskFields(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasouceId}/transfertasks/${url.transferTaskId}/taskdetails/fields`
  return axios.get(url)
}

// 历史数据迁移-查询筛选枚举值
export function queryFilterEnum(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasouceId}/transfertasks/${url.transferTaskId}/taskdetails/fieldEnum`
  return axios.get(url)
}

// 历史数据迁移-查询是否需要时间策略
export function queryTimeStrategy(url) {
  url = `/standards/${url.standardId}/datasources/${url.datasourceId}/task/timestrategy`
  return axios.get(url)
}

/**
 * 查询接口文档列表
 */

// 接口文档-查询接口文档列表
export function queryDocList(params) {
  let url = '/interfaces'
  return axios.get(url, { params: params})
}

/**
 * 映射管理
 */

//映射管理-查询数据源列表
export function queryDatasourceList() {
  return axios.get(`/datasources`)
}

// 映射管理-新增数据源
export function addDataSource(url, params) {
  return axios.post(`/standards/${url.standardId}/datasources`, qs.stringify(params))
}

// 映射管理-查询具体数据源信息
export function findDataSourceById(url) {
  return axios.get(`/standards/${url.standardId}/datasource/${url.dataSourceId}`)
}

// 映射管理-修改数据源
export function modifyDataSource(url, params) {
  return axios.put(`/standards/${url.standardId}/datasource/${url.id}`, qs.stringify(params))
}

// 映射管理-校验是否有正在迁移的任务
export function checkTaskExist(datasourceId, params) {
  return axios.get(`/datasources/${datasourceId}/transferTask/existence`, { params: params })
}

// 映射管理-校验数据表是否已配置映射
export function checkMappingExist(url, params) {
  return axios.get(`/datasources/${url.dataSourceId}/apps/${url.appId}/mappings/validation`, { params: params })
}

// 映射管理-查询厂商列表
export function queryFactories() {
  return axios.get('/apps/factories')
}

// 映射管理-查询产品列表
export function queryProducts(url) {
  return axios.get(`/apps/factories/${url.factoryId}/products`)
}

// 映射管理-查询产品列表
export function queryAllProducts() {
  return axios.get(`/apps/products`)
}

// 映射管理-查询应用列表
export function queryAuthAppList(params) {
  return axios.get(`/datasources/apps`, {params: params})
}

// 映射管理-查询应用详情
export function queryAppMsg(params) {
  return axios.get(`/apps/${params.id}`)
}

// 映射管理-查询对接方式列表
export function queryAdapters(url) {
  return axios.get(`/apps/factories/${url.factoryId}/adapters`)
}

// 映射管理-查询库、数据表列表
export function queryGroupResList(url) {
  return axios.get(`/standards/${url.standardId}/groupsAndResources`)
}

// 映射管理-删除数据源
export function deleteDataSource(url, params) {
  url = `/standards/${url.standardId}/datasources/${url.id}`
  return axios.delete(url, {params: params})
}

// 映射管理-查询映射关系列表
export const queryDataMappings = (function() {
  let cancel = null

  return function(url) {
    if (cancel) {
      cancel()
    }

    url = `/standards/${url.standardid}/datasources/${url.datasourceid}/mappings`
    return axios.get(url, {  cancelToken: new CancelToken((c) => { cancel = c }) })
  }
})()

export function checkMappingStatus (url, params) {
  url = `/standards/${url.standardId}/datasources/${url.dataSourceId}/tables/${url.sourceTableId}/fieldIds/${url.fieldId}/check`
  return axios.get(url, params)
}

// 映射管理-新增爬虫数据表
export function addSpiderTable(url, params) {
  return axios.post(`/standards/${url.standardId}/datasources/${url.dataSourceId}/tables`, qs.stringify(params))
}

// 映射管理-修改爬虫数据表
export function modifySpiderTable(url, params) {
  return axios.put(`/standards/${url.standardId}/datasources/${url.dataSourceId}/tables/${url.tableId}`, qs.stringify(params))
}

// 映射管理-查询爬虫数据表字段信息
export function findSpiderTableById(url) {
  return axios.get(`/standards/${url.standardId}/datasources/${url.dataSourceId}/tables/${url.tableId}`)
}

// 映射管理-删除爬虫数据表
export function deleteSpiderTable(url) {
  return axios.delete(`/standards/${url.standardId}/datasources/${url.dataSourceId}/table/${url.sourceTableId}`)
}

// 映射管理-新建映射关系
export function addDataMapping(url, params) {
  return axios.post(`/standards/${url.standardId}/datasources/${url.dataSourceId}/mappings`, qs.stringify(params))
}

// 映射管理-修改映射关系
export function modifyDataMapping(url, params) {
  return axios.put(`/standards/${url.standardId}/datasources/${url.dataSourceId}/mappings`, qs.stringify(params))
}

// 映射管理-删除映射关系
export function deleteDataMapping(url) {
  return axios.delete(`/standards/${url.standardId}/datasources/${url.dataSourceId}/mappings/${url.mappingId}`)
}

// 映射管理-清除映射关系
export function clearDataMapping(url) {
  return axios.delete(`/standards/${url.standardId}/datasources/${url.dataSourceId}/tables/${url.tableId}`)
}

//映射管理-查询应用下有权限的标准
export function queryAppStandardAuth(url) {
  return axios.get(`/datasources/app/${url.appId}/standards`)
}

// 映射管理-查询应用下有权限分类
export function queryAppClassifyAuth(url, params) {
  return axios.get(`/datasources/app/${url.appId}/standards/${url.standardId}/categories/${url.categoryId}/tree`, {params: params})
}

/**
 * 应用管理
 */

// 新增应用
export function addApp(params) {
  return axios.post('/apps', qs.stringify(params))
}

// 编辑应用
export function editApp(url, params) {
  return axios.post(`/apps/${url.id}`, qs.stringify(params))
}

// 验证应用名称唯一性
export function verifyAppName(params) {
  return axios.get('/apps/exists', { params: params })
}

// 删除应用
export function deleteApp(params) {
  let url = `/apps/${params.ids}`
  return axios.delete(url)
}

// 按分页查询应用
export function queryAppWithSearch(params) {
  return axios.get('/apps/_search', { params: params })
}

// 校验地址可用性
export function checkAvailability(params) {
  return axios.get(`/datasourceurl`, { params: params })
}
