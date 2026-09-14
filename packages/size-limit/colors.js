import { styleText } from 'node:util'

// Node.js prints colors only to TTY, but CI logs support them as well
let inCI =
  'CI' in process.env &&
  !('NO_COLOR' in process.env) &&
  !('FORCE_COLOR' in process.env)

export default function color(...formats) {
  return text => styleText(formats, String(text), { validateStream: !inCI })
}
