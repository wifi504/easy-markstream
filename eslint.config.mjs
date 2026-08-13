import config from '@ezview/eslint-config'

export default config.append({
  ignores: [
    '**/dist/**',
    'playground/public/**',
    'docs/.vitepress/cache/**',
    'docs/.vitepress/dist/**',
  ],
})
