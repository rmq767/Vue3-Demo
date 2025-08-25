<template>
  <div class="rule-linkage">
    <div class="left">
      <el-divider>规则配置</el-divider>
      <el-form
        :model="state.form"
        ref="form"
        label-width="100px"
        :inline="false"
      >
        <el-form-item label="规则名称">
          <el-input v-model="state.form.ruleName"></el-input>
        </el-form-item>
        <el-form-item label="条件">
          <el-row
            style="width: 100%"
            :gutter="20"
            v-for="(item, index) in state.form.conditions"
            :key="index"
          >
            <el-col :span="6" :offset="0">
              <span>项目：</span>
              <el-select
                v-model="item.field"
                @change="(value:number)=>setFieldType(value,item)"
              >
                <el-option
                  v-for="item in getItemsWithType()"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                >
                </el-option>
              </el-select>
            </el-col>
            <el-col :span="6" :offset="0">
              <span>符号：</span>
              <el-select v-model="item.symbol">
                <el-option
                  v-for="item in state.symbolOption"
                  :key="item"
                  :label="item"
                  :value="item"
                >
                </el-option>
              </el-select>
            </el-col>
            <el-col :span="6" :offset="0">
              <span>值：</span>
              <el-input
                v-if="item.type === 'input'"
                v-model="item.value"
                placeholder="请输入"
              />
              <el-input-number
                v-else-if="item.type === 'number'"
                v-model="item.value"
                placeholder="请输入"
                :controls="false"
              />
              <el-select
                v-else-if="item.type === 'select'"
                v-model="item.value"
                placeholder="请选择"
              >
                <el-option
                  v-for="i in item.options"
                  :key="i.value"
                  :label="i.label"
                  :value="i.value"
                >
                </el-option>
              </el-select>
              <el-date-picker
                v-model="item.value"
                v-else-if="item.type === 'date'"
                placeholder="选择日期时间"
                value-format="YYYY-MM-DD"
              >
              </el-date-picker>
            </el-col>
            <el-col :span="6" :offset="0">
              <el-button type="danger" @click="deleteRule(index)"
                >删除</el-button
              >
            </el-col>
          </el-row>
          <el-button type="primary" @click="addRule">新增条件</el-button>
        </el-form-item>
        <el-form-item label="动作">
          <el-row
            style="width: 100%"
            :gutter="20"
            v-for="(item, index) in state.form.actions"
            :key="index"
          >
            <el-col :span="6" :offset="0">
              <span>项目：</span>
              <el-select
                v-model="item.field"
                @change="(value:number)=>setFieldType(value,item)"
              >
                <el-option
                  v-for="item in getItemsWithType()"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                >
                </el-option>
              </el-select>
            </el-col>
            <el-col :span="6" :offset="0">
              <span>设置为：</span>
            </el-col>
            <el-col :span="6" :offset="0">
              <span>值：</span>
              <el-input
                v-if="item.type === 'input'"
                v-model="item.value"
                placeholder="请输入"
              />
              <el-input-number
                v-else-if="item.type === 'number'"
                v-model="item.value"
                placeholder="请输入"
                :controls="false"
              />
              <el-select
                v-else-if="item.type === 'select'"
                v-model="item.value"
                placeholder="请选择"
              >
                <el-option
                  v-for="i in item.options"
                  :key="i.value"
                  :label="i.label"
                  :value="i.value"
                >
                </el-option>
              </el-select>
              <el-date-picker
                v-model="item.value"
                v-else-if="item.type === 'date'"
                placeholder="选择日期时间"
                value-format="YYYY-MM-DD"
              >
              </el-date-picker>
            </el-col>
            <el-col :span="6" :offset="0">
              <el-button type="danger" @click="deleteAction(index)"
                >删除</el-button
              >
            </el-col>
          </el-row>
          <el-button type="primary" @click="addAction">新增动作</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">保存规则</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-divider>规则表</el-divider>
      <el-table :data="state.ruleList">
        <el-table-column prop="ruleName" label="规则名称" align="left" />
      </el-table>
    </div>
    <div class="right">
      <el-divider>数据表</el-divider>
      <el-table :data="state.tableData" row-key="id" border default-expand-all>
        <el-table-column prop="name" label="项目" align="left" />
        <el-table-column prop="value" label="值" align="center">
          <template #default="{ row }">
            <el-input
              v-if="row.type === 'input'"
              v-model="row.value"
              placeholder="请输入"
              @change="onChange(row)"
            />
            <el-input-number
              v-else-if="row.type === 'number'"
              v-model="row.value"
              placeholder="请输入"
              :controls="false"
              @change="onChange(row)"
            />
            <el-select
              v-else-if="row.type === 'select'"
              v-model="row.value"
              placeholder="请选择"
              clearable
              @change="onChange(row)"
            >
              <el-option
                v-for="item in row.options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
            <el-date-picker
              v-model="row.value"
              v-else-if="row.type === 'date'"
              placeholder="选择日期时间"
              value-format="YYYY-MM-DD"
              @change="onChange(row)"
            >
            </el-date-picker>
            <span v-else>{{ row.value }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "RuleLinkage" };
</script>
<script lang="ts" setup>
import { computed, reactive } from "vue";
import { SafeComparator } from ".";

const state = reactive({
  tableData: [
    {
      id: 1,
      name: "技术",
      type: "input",
      value: null,
      options: null,
    },
    {
      id: 2,
      name: "工龄",
      type: "number",
      value: null,
      options: null,
    },
    {
      id: 3,
      name: "项目",
      value: null,
      options: null,
      children: [
        {
          id: 31,
          name: "炒菜",
          value: null,
          type: "select",
          options: [
            {
              value: "炒粉",
              label: "炒粉",
            },
            {
              value: "蛋炒饭",
              label: "蛋炒饭",
            },
          ],
        },
        {
          id: 32,
          name: "经商",
          value: null,
          type: "select",
          options: [
            {
              value: "外卖",
              label: "外卖",
            },
            {
              value: "滴滴",
              label: "滴滴",
            },
          ],
        },
      ],
    },
    {
      id: 4,
      name: "周期",
      type: "date",
      value: null,
      options: null,
    },
  ],
  form: {
    ruleName: "",
    conditions: [
      {
        field: "",
        symbol: "",
        value: "",
        type: "",
        options: null,
      },
    ],
    actions: [
      {
        field: "",
        value: "",
        type: "",
        options: null,
      },
    ],
  },
  symbolOption: [">", "<", ">=", "<=", "==", "!=", "为空", "不为空"],
  ruleList: [
    {
      ruleName: "技术==js&&工龄>=3，则周期为2025-07-28",
      conditions: [
        {
          field: 1,
          symbol: "==",
          value: "js",
          type: "input",
          options: null,
        },
        {
          field: 2,
          symbol: ">=",
          value: 3,
          type: "number",
          options: null,
        },
      ],
      actions: [
        {
          field: 4,
          value: "2025-07-28",
          type: "date",
          options: null,
        },
      ],
    },
    // {
    //   ruleName: "2",
    //   conditions: [
    //     {
    //       field: 31,
    //       symbol: "!=",
    //       value: "炒粉",
    //       type: "select",
    //       options: [
    //         {
    //           value: "炒粉",
    //           label: "炒粉",
    //         },
    //         {
    //           value: "蛋炒饭",
    //           label: "蛋炒饭",
    //         },
    //       ],
    //     },
    //   ],
    //   actions: [
    //     {
    //       field: 32,
    //       value: "外卖",
    //       type: "select",
    //       options: [
    //         {
    //           value: "外卖",
    //           label: "外卖",
    //         },
    //         {
    //           value: "滴滴",
    //           label: "滴滴",
    //         },
    //       ],
    //     },
    //   ],
    // },
  ] as any[],
});
const onSubmit = () => {
  console.log(state.form);
  state.ruleList.push(state.form);
  onReset();
};
const setFieldType = (value: number, row: any) => {
  const item = getItemsWithType().find((item) => item.id === value);
  if (item) {
    row.type = item.type;
    row.options = item.options;
  }
};
function getItemsWithType() {
  let result = [] as any[];
  function traverse(items: any) {
    items.forEach((item: any) => {
      if (item.hasOwnProperty("type")) {
        result.push(item);
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    });
  }
  traverse(state.tableData);
  return result;
}
const addRule = () => {
  state.form.conditions.push({
    field: "",
    symbol: "",
    value: "",
    type: "",
    options: null,
  });
};
const deleteRule = (index: number) => {
  state.form.conditions.splice(index, 1);
};
const addAction = () => {
  state.form.actions.push({
    field: "",
    value: "",
    type: "",
    options: null,
  });
};
const deleteAction = (index: number) => {
  state.form.actions.splice(index, 1);
};
const onReset = () => {
  state.form = {
    ruleName: "",
    conditions: [
      {
        field: "",
        symbol: "",
        value: "",
        type: "",
        options: null,
      },
    ],
    actions: [
      {
        field: "",
        value: "",
        type: "",
        options: null,
      },
    ],
  };
};
const onChange = (row: any) => {
  const conditionStr = getCondition(row.id, row.value);
  console.log(conditionStr);
  try {
    const fn = new Function(`return ${conditionStr}`);
    console.log(fn());
  } catch (error: any) {
    console.log(error);
  }
};

function getCondition(id: number, value: any) {
  let conditionStr = "";
  state.ruleList.forEach((item: any) => {
    let ids = [] as number[];
    // 拿到所有条件和id
    const symbols = item.conditions.map((condition: any) => {
      ids.push(condition.field);
      let str = "";
      const node = findTreeNodeById(state.tableData, condition.field).node;
      // 保留原有的值类型
      switch (condition.symbol) {
        case "==":
          str = `${SafeComparator.equal(node.value, condition.value)}`;
          break;
        case ">":
          str = `${SafeComparator.greaterThan(node.value, condition.value)}`;
          break;
        case "<":
          str = `${SafeComparator.lessThan(node.value, condition.value)}`;
          break;
        case ">=":
          str = `${SafeComparator.greaterOrEqual(node.value, condition.value)}`;
          break;
        case "<=":
          str = `${SafeComparator.lessOrEqual(node.value, condition.value)}`;
          break;
        case "!=":
          str = `${SafeComparator.notEqual(node.value, condition.value)}`;
          break;
        case "为空":
          str = `${SafeComparator.isEmpty(node.value)}`;
          break;
        case "不为空":
          str = `${SafeComparator.isNotEmpty(node.value)}`;
          break;
      }
      return str;
    });
    // 如果当前操作的行是有条件的
    if (ids.includes(id)) {
      // 如果条件置空，则目标值也置空
      if (value === null || value === undefined || value === "") {
        item.actions.forEach((action: any) => {
          const node = findTreeNodeById(state.tableData, action.field).node;
          if (node) {
            node.value = undefined;
          }
        });
      }

      // 合并条件 然后根据条件挨个设置值
      conditionStr = symbols.join(" && ");
      if (eval(conditionStr)) {
        item.actions.forEach((action: any) => {
          const node = findTreeNodeById(state.tableData, action.field).node;
          if (node) {
            node.value = action.value;
          }
        });
      } else {
        item.actions.forEach((action: any) => {
          const node = findTreeNodeById(state.tableData, action.field).node;
          if (node) {
            node.value = undefined;
          }
        });
      }
    }
  });
  return conditionStr;
}

/**
 * @description 获取当前id的数据结构，目的是为了隐藏节点
 * @export
 * @param {any[]} tree
 * @param {string} id
 * @param {string} [idKey='configParamId']
 * @return {*}
 */
function findTreeNodeById(tree: any[], id: string, idKey = "id"): any {
  for (const node of tree) {
    if (node[idKey] === id) {
      return { node, path: [node] };
    }
    if (node.children && node.children.length > 0) {
      const result = findTreeNodeById(node.children, id, idKey);
      if (result.node) {
        return {
          node: result.node,
          path: [node, ...result.path],
        };
      }
    }
  }

  return { node: null, path: [] };
}
</script>

<style lang="scss" scoped>
.rule-linkage {
  position: relative;
  .left {
    position: absolute;
    left: 0;
    top: 0;
    width: 50vw;
    height: 100%;
  }
  .right {
    margin-left: 50vw;
    height: 100%;
  }
}
.el-input-number {
  width: 100% !important;
}
:deep(.el-date-editor) {
  width: 100% !important;
}
</style>
