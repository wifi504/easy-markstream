# EasyMarkstream

> 这里只演示一小段。完整压测请在仓库根目录执行 `pnpm dev`，用 playground 测。
>
> > 引用也可以嵌套。完整压测文档里还有更复杂的套娃。

基于 **markstream-vue** 的开箱即用封装：也支持 *斜体*、***粗斜体***、~~删除线~~、`行内代码`，以及上标 x^2^、下标 H~2~O。😄

仓库见 ([GitHub][github])。带括号的引用会显示成气泡：([文档站][docs])、([Vue][vue])；不带括号仍是普通链接：[markstream-vue][msv]。

裸链接会带站点图标：https://github.com/wifi504/easy-markstream

### 列表与任务

- 无序列表
  - 可以嵌套
1. 有序列表
2. 第二项

- [x] GitHub 浅色主题
- [x] 代码块流式高亮
- [ ] 完整压测（请去 playground）

### 表格

| 能力 | 说明 |
| :--- | :--- |
| 公式 | KaTeX 行内与块级 |
| 代码 | 语法高亮，含 diff |
| 图表 | Mermaid；ECharts 常见图（柱 / 折 / 饼 / 散点 / 雷达） |
| 链接 | 气泡、引用、文末来源 |
| 图片 | 点击可放大 |

脚注也可以用。[^1]

### 公式

行内：$E = mc^2$。块级：

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

### 代码

```ts
export const hello = 'world'
```

```diff
- const name = 'old'
+ const name = 'EasyMarkstream'
```

### 图表

```mermaid
flowchart LR
  A[Markdown] --> B[EasyMarkstream]
  B --> C[页面]
```

```echarts
{
  "title": { "text": "销量" },
  "tooltip": { "trigger": "axis" },
  "xAxis": { "type": "category", "data": ["A", "B", "C"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [10, 20, 30] }]
}
```

### 图片

![Markdown](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)

转义后不会当成语法：\*\*不是粗体\*\*。

---

[^1]: 完整压测请在仓库里跑 `pnpm dev`。

[docs]: https://wifi504.github.io/easy-markstream/ "文档站"
[vue]: https://vuejs.org/ "Vue.js"
[msv]: https://www.npmjs.com/package/markstream-vue "markstream-vue"
[github]: https://github.com/wifi504/easy-markstream "GitHub"
