import { logout } from '../login'
import tip from '@/utils/trsModal/packages/tip/index'
import errorMsg from '@/utils/trsModal/packages/errorMsg/index.vue'
import errorDialog from '@/utils/trsModal/packages/errorDialog/index.vue'

/**
 * 自定义请求发送成功拦截器
 */
export function requestSuccessFunc(request) {
    let isRequestJsonFile = /\.*?.json/
    if (isRequestJsonFile.test(request.url)) {
        request.baseURL = ''
    }
    return request
}

/**
 * 自定义请求发送失败拦截器
 */
export function requestFailFunc(error) {
    return Promise.reject(error)
}

/**
 * 自定义请求响应成功拦截器
 */
export function responseSuccessFunc(response) {
  const headers = response.headers
  const data = response.data
  const config = response.config

    // ids判断当前用户未登录
    if (response.config.url.indexOf('/uirb') >= 0  && typeof data === 'string' && data.indexOf('/ids/admin') >= 0) {
        window.location.href = '/uirb/ids/gotoLogin'
        return Promise.reject()
    }

    // 文件导出
    if (headers['content-type'].toLocaleLowerCase().includes('application/octet-stream')) {
        if (data.success && !data.success) {
            tip.error(data.msg)
            return Promise.reject(data)
        } else {
            return response
        }
    }

    // 附件下载失败拦截
    if (config.responseType === 'arraybuffer') {
        return Promise.reject(data)
    }

    // 操作成功
    if (data.code === 200 && data.success) {
        // 批量删除失败拦截
        if (data.data && data.data.success === false) {
            // type和operate参数请在接口中传参，可参考queryStandardDelete接口
            new errorMsg({
                msg: data.data.data,
                type: config.type,
                operate: config.operate,
                title: '操作失败！'
            })
            return Promise.reject(data)
        }
        return data.data
        // 操作失败
    } else if (data.code === 5001) {
        new errorDialog({
            msg: data.msg,
            title: '登录失败！'
        })
        document.addEventListener('click', () => {
            return logout()
        })
        return Promise.reject(data)
    } else {
        new errorDialog({
            msg: data.msg,
            title: '操作失败！'
        })
        return Promise.reject(data)
    }
}

/**
 * 自定义请求响应失败拦截器
 */
export function responseFailFunc(error) {
    if (error && error.response) {
        switch (error.response.status) {
            case 400:
                error.message = '请求错误'
                break
            case 401:
                error.message = '未授权，请登录'
                break
            case 403:
                error.message = '拒绝访问'
                break
            case 404:
                error.message = `请求地址出错: ${error.response.config.url}`
                break
            case 408:
                error.message = '请求超时'
                break
            case 500:
                error.message = '服务器内部错误'
                break
            case 501:
                error.message = '服务未实现'
                break
            case 502:
                error.message = '网关错误'
                break
            case 503:
                error.message = '服务不可用'
                break
            case 504:
                error.message = '网关超时'
                break
            case 505:
                error.message = 'HTTP版本不受支持'
                break
            default:
                break
        }
    }
    if (error.message) {
        tip.error(error.message)
    }
    return Promise.reject(error)
}
