import fecha from 'fecha'
import { FILTER_TAG_LIST } from '@/config/index'

export function initDate(timestamp) {
  return timestamp ? fecha.format(+timestamp, 'YYYY-MM-DD HH:mm') : ''
}
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

export const arrayFindIndex = function(arr, pred) {
  for (let i = 0; i !== arr.length; ++i) {
    if (pred(arr[i])) {
      return i;
    }
  }
  return -1;
};

export const arrayFind = function(arr, pred) {
  const idx = arrayFindIndex(arr, pred);
  return idx !== -1 ? arr[idx] : undefined;
};

/**
 * 树形数据转换为数组
 */
export const treeToArray = function(data, attr = 'fields', parent = null) {
  let tmp = []
  Array.from(data).forEach((field, index) => {
    if (parent) {
      field.parent = parent
    }
    tmp.push(field)
    if (field[attr] && field[attr].length > 0) {
      const children = treeToArray(field[attr], attr, JSON.parse(JSON.stringify(field)))
      tmp = tmp.concat(children)
    }
  })
  return tmp
}

// 初始化当前选择标准，优先级：路由记忆 > storage存储 > 列表第一个
export function getStandard(standards, standardid, type = 'standard') {
  return new Promise(resolve => {
    if (standards.length === 0) resolve()

    // 优先根据路由记忆确定标准
    if (standardid) {
      let curStd = standards.find(standard => standard.id === parseInt(standardid))
      resolve(curStd || standards[0])
    }

    // 是否有存储记忆
    let storageStd = localStorage[type + '-' + localStorage.curUser]
    if (!!storageStd && standards.some(standard => standard.id === JSON.parse(storageStd).id)) {
      resolve(JSON.parse(storageStd))
    } else {
      resolve(standards[0])
    }
  })
}

export function debounce(fn, delay){
  let timer = null
  return (...args) =>{
      clearTimeout(timer)
      timer = setTimeout(()=>{
          fn(...args)
      }, delay)
  }
}

export function throttle (fn, delay) {
  let startTime = 0
  return (...args) => {
    let timeNow = +new Date()
    if(timeNow - startTime >= delay){
      fn(...args)
      startTime = timeNow
    }
  }
}

/**
 * 过滤标签
 */
export function filterTags (str) {
  let filterExp = ''
  FILTER_TAG_LIST.map(item => { filterExp += item + '|' })
  let pattern = new RegExp ('<\\/*[' + filterExp + '][^>]*>', 'g')
  return str.replace(pattern, '')
}
