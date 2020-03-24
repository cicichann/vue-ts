<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="调整顺序" custom-class="sort-group">

    <div v-loading="loading" element-loading-text="数据加载中..." class="sort-group">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" label-suffix="：">

        <el-form-item prop="type" label="调整组织至">
          <el-select v-model="form.type" class="overflow">
            <el-option label="最前" value="0"></el-option>
            <el-option label="最后" value="1"></el-option>
            <el-option label="指定位置" value="2"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.type === '2'" prop="position" label="位置">
          <el-input v-model="form.position" placeholder="请输入目标位置" />
          <p>同级组织数：<span>{{ siblingNum }}</span></p>
        </el-form-item>

      </el-form>
    </div>

    <span slot="footer">
      <el-button :disabled="loading || isDisabled" type="primary" @click="sortGroup">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>

  </el-dialog>
</template>

<script>
export default {
  name: "sortGroupDialog",

  props: {
    groupId: {
      type: Number || String,
      default: ""
    },
    siblingData: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      loading: false,
      siblingNum: '',
      originalPosition: '',
      form: {
        type: "0",
        position: "1"
      },
      rules: {
        type: [{required: true, trigger: 'blur', message: '请选择调整方式'}],
        position: [{required: true, trigger: 'blur', validator: this.checkLegality}]
      }
    }
  },

  computed: {
    isDisabled() {
      return this.siblingData[this.getTargetPos() - 1] ? (this.siblingData[this.getTargetPos() - 1].key === this.groupId) : true
    }
  },

  mounted() {
    this.queryPosInfo()
  },

  methods: {
    /**
     * 查询当前组织的索引值及同级组织数
     */
    queryPosInfo() {
      this.loading = true
      this.$api.queryPosInfo({id: this.groupId}).then(data => {
        this.form.position = data.position
        this.originalPosition = data.position
        this.siblingNum = data.count
        this.loading = false
      })
    },

    /**
     * 调整组织顺序
     */
    sortGroup() {
      this.loading = true
      this.$refs.form.validate().then(() => {
        let params = {
          fromId: this.groupId,
          toId: this.siblingData[this.getTargetPos() - 1].key,
          moveDirection: this.originalPosition < this.getTargetPos() ? -1 : 1
        }

        this.$api.groupSort(params).then(() => {
          this.$close(params.toId)
          this.$trsModalSuccess('调整顺序成功！')
        }, () => {
          this.loading = false
        })
      }, () => {
        this.loading = false
      })
    },

    /**
     * 目标位置的合法性校验
     */
    checkLegality(rule, value, callback) {
      let numberReg = /^\d+$/
      if(!value) {
        return callback(new Error('请输入目标位置'))
      } else if(!numberReg.test(value)) {
        return callback(new Error('请输入合法数字值'))
      } else if(parseInt(value) < 1 || parseInt(value) > this.siblingNum) {
        return callback(new Error('目标位置超出有效范围'))
      } else {
        return callback()
      }
    },

    /**
     * 获取目标组织的id
     */
    getTargetPos() {
      let targetPos
      switch(this.form.type) {
        case '0':
          targetPos = 1
          break
        case '1':
          targetPos = this.siblingNum
          break
        case '2':
          targetPos = this.form.position
          break
      }
      return targetPos
    }
  }
}
</script>

<style lang="scss">
.sort-group {
  .el-form-item__content {
    line-height: inherit;
  }

  p {
    margin-top: 10px;
    color: #969EA6;

    span {
      color: #4A8EFD;
    }
  }
}
</style>
