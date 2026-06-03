import { execSync } from 'child_process'
import { mkdirSync } from 'fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const MMDC = '.\\node_modules\\.bin\\mmdc'
const env = { ...process.env, PUPPETEER_EXECUTABLE_PATH: CHROME }
const diagrams = ['mcd', 'classes', 'usecase', 'sequence', 'sequence_anticheat']

mkdirSync('pages/diagrams', { recursive: true })

for (const name of diagrams) {
  console.log(`Generating ${name}.svg...`)
  execSync(
    `${MMDC} -i diagrams/${name}.mmd -o pages/diagrams/${name}.svg -c diagrams/mermaid.config.json -b transparent`,
    { env, stdio: 'inherit', shell: true }
  )
}

console.log('Done.')
