export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-vue',
    'stylelint-config-rational-order',
  ],
  ignoreFiles: [
    '**/dist/**',
    '**/node_modules/**',
    'docs/.vitepress/**',
  ],
  rules: {
    // 禁止空块
    'block-no-empty': true,
    // 禁止无效十六进制
    'color-no-invalid-hex': true,
    // 允许直接用 "@import 'xxx'"，不强制 url()
    'import-notation': null,
    // 组件使用 BEM（block__element--modifier）
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?|--[a-z0-9]+(?:-[a-z0-9]+)*)?$',
      { resolveNestedSelectors: true },
    ],
    // 皮肤与 BEM 选择器必然重叠，重排会改变 cascade
    'no-descending-specificity': null,
  },
  plugins: [
    'stylelint-order',
  ],
  overrides: [
    {
      files: ['**/*.(less|css|vue|html)'],
      customSyntax: 'postcss-less',
    },
    {
      files: ['**/*.(html|vue)'],
      customSyntax: 'postcss-html',
    },
  ],
}
