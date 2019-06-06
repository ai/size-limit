import { ReporterResult } from './../interfaces'

function print (data: any) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

interface JSONReportEntry {
  name: string | string[] | undefined
  running?: number
  passed: boolean
  size: number
  loading: number
}

export default {
  error (msg: string) {
    print({ error: msg })
  },

  results (results: ReporterResult[]) {
    print(results.map(result => {
      let out: JSONReportEntry = {
        name: result.file.name,
        passed: !result.failed,
        size: result.file.size,
        loading: result.file.loading
      }
      if (typeof result.file.running === 'number') {
        out.running = result.file.running
      }
      return out
    }))
  }
}
