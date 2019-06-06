import { Reporter } from '../interfaces'
import humanReporter from './human-reporter'
import jsonReporter from './json-reporter'

export default function getReporter (
  argv: Record<string, any> = { }
): Reporter {
  return argv.json ? jsonReporter : humanReporter
}
