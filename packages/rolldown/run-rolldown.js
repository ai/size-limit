import { build } from 'rolldown'

export function runRolldown(check) {
  return build(check.rolldownConfig)
}
