module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ['plugin:vue/recommended', 'eslint:recommended'],

  // add your custom rules here
  rules: {

    // vue属性，单行最多书写10个，多行书写时，每行一个属性
    "vue/max-attributes-per-line": [2, {
      "singleline": 10,
      "multiline": {
        "max": 10,
        "allowFirstLine": true
      }
    }],

    // vue组件，html标签自闭合(off)
    "vue/html-self-closing": 0,

    // 声明的变量需要使用：本地、全局变量(on)，参数(off)
    'no-unused-vars': [2, {
      'vars': 'all',
      'args': 'none'
    }],

    // vue组件属性名必须驼峰(off)
    "vue/name-property-casing": 0,

    // 开启断点调试
    "no-debugger": "off",

    "no-console": "off"

  }
}

