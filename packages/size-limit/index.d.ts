export type Config = {
  brotli?: boolean
  compareWith?: string
  config?: string
  disableModuleConcatenation?: boolean
  entry?: string | string[]
  gzip?: boolean
  hidePassed?: boolean
  highlightLess?: boolean
  ignore?: string[]
  import?: string | Record<string, string>
  limit?: string
  modifyEsbuildConfig?: (config?: any) => any
  modifyWebpackConfig?: (config?: any) => any
  module?: boolean
  name?: string
  path: string | string[]
  running?: boolean
  uiReports?: object
  webpack?: boolean
}
