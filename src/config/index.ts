/**
 * 统一资源库 - 变量管理（枚举值、默认值、配置项）
 * created by huang.jusheng on 2018/12/18
 */

// 标准分类树结构默认props
export const CATEGORY_TREE_PROPS = {
  children: 'children',
  label: 'category_name',
  isLeaf: (data, node) => {
    return node.data.hasChildren === 0
  }
}

export const TIME_TYPE = [{
  name: '全部时间',
  value: 'ALL'
}, {
  name: '一天之内',
  value: 'LAST_DAY'
}, {
  name: '一月之内',
  value: 'LAST_MONTH'
}, {
  name: '一年之内',
  value: 'LAST_YEAR'
}, {
  name: '自定义',
  value: 'CUSTOM'
}]

export const FRONT_VERSION = {
  name: '前端',
  version: '1.8'
}

export const FILTER_TAG_LIST = [
  'a', 'article', 'aside', 'audio',
  'b', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'code', 'col', 'colgroup',
  'dd', 'del', 'div', 'dl', 'dt',
  'em',
  'fieldset', 'figcaption',  'figure','footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'html',
  'i', 'iframe', 'img', 'input',
  'label', 'legend', 'li', 'link',
  'map', 'meta',
  'nav',
  'ol', 'optgroup', 'option',
  'p', 'pre',
  'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'sup',
  'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr',
  'ul',
  'video'
]

export const TASK_STATUS = {
  notStarted: 0,
  parsing: 1,
  transfering: 2,
  finished: 3,
  parseFailed: 4,
  deleting: 5,
  deleteFailed: 6
}
