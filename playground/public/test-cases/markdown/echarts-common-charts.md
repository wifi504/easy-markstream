# ECharts 常见图

围栏语言为 `echarts`，内容必须是可 `JSON.parse` 的 option。本用例覆盖第一版承诺的常见图：柱状、折线、饼图、散点、雷达。非法 JSON 放在文末。

## 柱状图

```echarts
{
  "title": { "text": "月度销量" },
  "tooltip": { "trigger": "axis" },
  "legend": { "data": ["销量"] },
  "xAxis": {
    "type": "category",
    "data": ["1月", "2月", "3月", "4月", "5月", "6月"]
  },
  "yAxis": { "type": "value" },
  "series": [
    {
      "name": "销量",
      "type": "bar",
      "data": [120, 200, 150, 80, 70, 110]
    }
  ]
}
```

## 堆叠柱状图

```echarts
{
  "title": { "text": "渠道销量（堆叠）" },
  "tooltip": { "trigger": "axis" },
  "legend": { "data": ["直销", "经销"] },
  "xAxis": {
    "type": "category",
    "data": ["Q1", "Q2", "Q3", "Q4"]
  },
  "yAxis": { "type": "value" },
  "series": [
    {
      "name": "直销",
      "type": "bar",
      "stack": "total",
      "data": [320, 302, 341, 374]
    },
    {
      "name": "经销",
      "type": "bar",
      "stack": "total",
      "data": [120, 132, 101, 134]
    }
  ]
}
```

## 折线图

```echarts
{
  "title": { "text": "访问趋势" },
  "tooltip": { "trigger": "axis" },
  "xAxis": {
    "type": "category",
    "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  "yAxis": { "type": "value" },
  "series": [
    {
      "type": "line",
      "data": [150, 230, 224, 218, 135, 147, 260]
    }
  ]
}
```

## 面积图

```echarts
{
  "title": { "text": "活跃用户" },
  "tooltip": { "trigger": "axis" },
  "xAxis": {
    "type": "category",
    "boundaryGap": false,
    "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  "yAxis": { "type": "value" },
  "series": [
    {
      "type": "line",
      "areaStyle": {},
      "data": [820, 932, 901, 934, 1290, 1330, 1320]
    }
  ]
}
```

## 饼图

```echarts
{
  "title": { "text": "流量来源", "left": "center" },
  "tooltip": { "trigger": "item" },
  "legend": { "orient": "vertical", "left": "left" },
  "series": [
    {
      "name": "来源",
      "type": "pie",
      "radius": "50%",
      "data": [
        { "value": 1048, "name": "搜索" },
        { "value": 735, "name": "直接" },
        { "value": 580, "name": "邮件" },
        { "value": 484, "name": "联盟" },
        { "value": 300, "name": "视频" }
      ]
    }
  ]
}
```

## 散点图

```echarts
{
  "title": { "text": "身高与体重" },
  "tooltip": { "trigger": "item" },
  "xAxis": { "name": "身高 cm" },
  "yAxis": { "name": "体重 kg" },
  "series": [
    {
      "type": "scatter",
      "symbolSize": 12,
      "data": [
        [161, 51],
        [167, 59],
        [170, 62],
        [174, 70],
        [178, 75],
        [182, 81],
        [186, 85]
      ]
    }
  ]
}
```

## 雷达图

```echarts
{
  "title": { "text": "能力模型" },
  "legend": { "data": ["Allocated", "Actual"] },
  "radar": {
    "indicator": [
      { "name": "销售", "max": 6500 },
      { "name": "管理", "max": 16000 },
      { "name": "信息技术", "max": 30000 },
      { "name": "客服", "max": 38000 },
      { "name": "研发", "max": 52000 },
      { "name": "市场", "max": 25000 }
    ]
  },
  "series": [
    {
      "type": "radar",
      "data": [
        {
          "value": [4200, 3000, 20000, 35000, 50000, 18000],
          "name": "Allocated"
        },
        {
          "value": [5000, 14000, 28000, 26000, 42000, 21000],
          "name": "Actual"
        }
      ]
    }
  ]
}
```

## 非法 JSON

预览区应显示解析错误，并可切到源码。

```echarts
{
  "title": { "text": "这不是合法 JSON",
  "series": [{ "type": "pie", "data": [{ "value": 1, "name": "A" }] }]
}
```
