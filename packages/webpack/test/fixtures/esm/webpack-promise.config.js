import path from 'node:path'

export default async (argv, env) => ({
  entry: {
    file: path.join(__dirname, 'file.js'),
    small: path.join(__dirname, 'small.js')
  },
  output: {
    filename: '[name].js'
  },
  mode: 'development'
})
