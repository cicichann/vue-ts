import axios from './config/axios'
const qs = require('qs')
//资源管理-查询标准下拉中应用列表
export function queryApps(url, params) {
    url = `/apps/interface`
    return axios.get(url, {})
}

// 资源管理-分类统计
export function queryResourceCount(url, params) {
    return axios.get(url, {params: params})
}

// 资源管理-资源列表
export function queryResource(url, params) {
    // url = `/standards/${url.standardid}` +
    // (url.categoryid &&  url.categoryid != 0 ? `/categories/${url.categoryid}` : '') +
    // `/resources/${url.resourceid}/data`

    return axios.get(url, { params: params })
}

// 资源管理-查询标签
export function queryLabelsTag(params) {
  let url = `/labels/search`
  return axios.get(url, { params: params })
}
//资源管理-手动打标
export function addlabelTags(url, params) {
  url = `/standards/${url.standardId}/resources/${url.resourceId}/data/${url.dataId}/labels`
  return axios.post(url, qs.stringify(params))
}

export function querySourceRight(url, params) {
    url = `/standards/${url.standardid}/categories/resources/${url.resourceid}/data/rights/keys`

    return axios.get(url, { params: params })
}

//实时数据接入-版本信息
export function queryVersionDate(url, params) {
  url = `/management/monitor/log/basicdata/${url.id}`

  return axios.get(url, { params: params })
}

// 资源管理-使用轨迹
export function queryTrace(url, params) {
    url = `/standards/${url.standardId}/resources/${url.resourceId}/trace/${url.dataId}`
    return axios.get(url)
}

// 资源管理-标签列表
export function queryLabelList(url, params) {
    return axios.get(url, { params: params })
}

// 资源管理-图片、视频、文件列表
export function queryAttachList(url, params) {
    return axios.get(url, { params: params })
}

// 资源管理-删除资源
export function deleteResource(url, params) {
    url = `/standards/${url.standardId}/resources/${url.resourceId}/data`
    return axios.delete(url, { params: params })
  }

// 资源管理-删除图片、附件、视频
export function deleteAttach(params, type) {
  const url = `/standards/${params.standardId}/${type}/${params.appendixids}`
  return axios.delete(url)
}

// 资源管理-资源概览-查询数据总入库、被调用条数、今日入库条数
export function getDataAllcounts(params) {
    let param = {
        beginDateTime: params.beginDateTime,
        endDateTime: params.endDateTime,
        type: params.type
    }
    let url = `/standards/${params.id}/data/count`
    return axios.get(url, { params: param })
}

// 资源管理-资源概览-查询资源总数
export function getAllResource(params) {
    let url = `/standards/${params.id}/resources/count`
    return axios.get(url)
}

// 资源管理-查询数据入库、调用情况走势图
export function getDataTrend(url) {
    let param = {
        type: url.type
    }
    url = `/standards/${url.standardId}` +
        `/data/${url.time}/trend`
    return axios.get(url, { params: param })
}

// 资源管理-查询数据类型分布
export function getDataTypeDistrib(url) {
    url = `/standards/${url.standardId}/data/distribution`
    return axios.get(url)
}

// 资源管理-查询数据调用次数排行榜
export function getDataCallRank(url) {
    url = `/standards/${url.standardId}/data/rank`
    return axios.get(url)
}

// 文档预览-获取文档数据信息
export function queryDocDataById(params) {
    const url = `/standards/${params.standardid}/resources/${params.resourceid}/data/${params.dataid}`
    return axios.get(url)
}

// 文档预览-获取所有的字段信息
export function queryDocFieldData(params) {
    return axios.get(`/standards/${params.standardid}/resources/${params.resourceid}/columns`)
}

// 文档预览-获取相似文章数据信息
export function queryDuplicateDoc(type, params) {
    return axios.get(`/management/monitor/log/${type}/${params.duplicatedataid}`)
}

// 智能校对-获取文档校对信息
export function queryDocProofData(params) {
    return axios.get(`/standards/${params.standardid}/resources/${params.resourceid}/data/${params.dataid}/check`)
}

// 监控中心-资源归集-数据接入
export function queryCollectionAccess(params) {
    return axios.get(`/management/monitor/log/data-access`, { params: params })
}

export function queryRepository(url) {
  return axios.get(`/standards/${url.standardid}/resources/${url.resourceid}/data/${url.dataid}/repository`)
}

// 审阅核查-查询文档历史版本
export function queryDocVersions(url, params) {
    return axios.get(`/standards/${url.standardid}/resources/${url.resourceid}/data/${url.dataid}/versions`, {params: params})
}

// 监控中心-资源归集-自动打标
export function queryCollectionMark(params) {
    return axios.get(`/management/monitor/log/mark`, { params: params })
}

// 监控中心-资源归集-自动分类
export function queryCollectionCategory(params) {
    return axios.get(`/management/monitor/log/category`, { params: params })
}

// 监控中心-资源归集-自动排重
export function queryCollectionUnduplicate(params) {
    return axios.get(`/management/monitor/log/unduplicate`, { params: params })
}

// 监控中心-资源共享-资源下发
export function queryCollectionDistribute(params) {
    return axios.get(`/management/monitor/log/data-senddown`, { params: params })
}

// 监控中心-资源共享-资源报送
export function queryCollectionReport(params) {
    return axios.get(`/management/monitor/log/data-sendup`, { params: params })
}

// 监控中心-资源监管-智能校对
export function queryCollectionCheck(params) {
    return axios.get(`/management/monitor/log/check`, { params: params })
}

// 监控中心-资源监管-一键撤稿
export function queryCollectionWithdrawal(params) {
    return axios.get(`/management/monitor/log/canncel-article`, { params: params })
}

// 监控中心-系统运维-操作日志
export function queryCollectionOperation(params) {
    return axios.get(`/management/monitor/log/operationlog`, { params: params })
}

// 监控中心-系统运维-性能日志
export function queryCollectionPerform(params) {
    return axios.get(`/management/monitor/log/performancelog`, { params: params })
}

// 监控中心-系统列表
export function queryCollectionSystem() {
    return axios.get(`/management/monitor/log/systems`)
}

// 监控中心-资源列表
export function queryCollectionResource(params) {
    return axios.get(`/management/monitor/log/resources`, { params: params })
}

// 监控中心-分类列表
export function queryCollectionCategories() {
    return axios.get(`/management/monitor/log/autocategory/categories`)
}

// 监控中心-标签列表
export function queryCollectionLabels() {
    return axios.get(`/management/monitor/log/labels`)
}

// 监控中心-上级部门列表
export function queryCollectionUpdepts() {
    return axios.get(`/management/monitor/log/updepts`)
}

// 监控中心-下级部门列表
export function queryCollectionDowndepts() {
    return axios.get(`/management/monitor/log/downdepts`)
}

// 监控中心-日志类型列表
export function queryCollectionLogTypes() {
    return axios.get(`/management/monitor/log/logtypes`)
}

// 监控中心-模块列表
export function queryCollectionModuleNames() {
    return axios.get(`/management/monitor/log/moduleNames`)
}

// 专题库
export function queryTopics (standardid, params) {
    return axios.get(`/standards/${standardid}/dissertations`, { params: params })
}

export function queryTopicDetail (standardId, topicId) {
    return axios.get(`/standards/${standardId}/dissertations/${topicId}`)
}
