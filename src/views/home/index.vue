<template>
  <div class="home-container">
    <com-header :navs="navs" :menus="[]" :is-dropdown="false"></com-header>
    <div class="main-container">
      <div class="module-entry">
        <!-- 模块入口 -->
        <div v-access="entry.rightKey" v-for="(entry, entryIndex) in entries" :key="entryIndex" :class="entry.img + '-img'" class="module-item">
          <!-- <div v-for="(entry, entryIndex) in entries" :key="entryIndex" :class="entry.img + '-img'" class="module-item"> -->
          <router-link :to="entry.path" :class="{'disable':entry.disabled}">
            <p :class="{'manage-txt': entry.title == '资源管理'}" class="module-item-text">{{ entry.title }}</p>
            <p :class="{'manage-desc': entry.title == '资源管理' || entry.title == '资源可视'}" class="module-item-desc">{{ entry.desc }}</p>
            <p v-if="entry.disabled" class="wait-time">(敬请期待)</p>
          </router-link>
        </div>

        <!-- 只有系统配置权限 -->
        <div v-if="$checkRight('sysconf') && !$checkRight('model,aggr,datamgt')" class="sysconf-module uirb-no-data-img">
          <p>当前用户仅有系统配置权限</p>
          <router-link tag="button" class="edit-btn other-btn" to="/system">系统配置</router-link>
        </div>
      </div>

      <editionFooter :bottom="true"></editionFooter>
    </div>
  </div>
</template>

<script>
import comHeader from '@/views/common/header/index.vue'
import editionFooter from '@/views/common/footer/footer.vue'
export default {
  name: 'Home',
  components: {
    comHeader,
    editionFooter
  },
  data() {
    return {
      entries: [
        {
          path: '/model',
          title: '资源模型',
          desc: '统一资源库建模',
          img: 'blue',
          rightKey: 'model'
        },
        {
          path: '/collection',
          title: '资源归集',
          desc: '采集 , 处理 , 存储',
          img: 'purple',
          rightKey: 'aggr'
        },
        {
          path: '/manage',
          title: '数据管理',
          desc: '统一资源库数据管理',
          img: 'red',
          rightKey: 'datamgt'
        },
        // {
        //   path: '#',
        //   title: '资源可视',
        //   desc: '可视化图表',
        //   disabled: true,
        //   img: 'blank'
        // },
        // {
        //   path: '#',
        //   title: '资源分析',
        //   desc: '人工智能模型分析',
        //   disabled: true,
        //   img: 'blank'
        // }
      ],
      navs: []
    }
  }
}
</script>
