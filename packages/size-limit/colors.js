import { styleText } from 'node:util'

// Node.js prints colors only to TTY, but CI logs support them as well
let inCI =
  'CI' in process.env &&
  !('NO_COLOR' in process.env) &&
  !('FORCE_COLOR' in process.env)

// Node.js re-opens the parent style after the nested one only since 22.19
// and 24.5. To support older versions, styles should be combined
// in a single call like `color('green', 'bold')` instead of `green(bold())`.
export default function color(...formats) {
  return text => styleText(formats, String(text), { validateStream: !inCI })
}
