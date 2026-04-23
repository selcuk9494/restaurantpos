const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../../..')
const embeddedPnpmDir = path.join(root, 'apps/pos-web/.embedded-api/node_modules/.pnpm')
const sourcePnpmDir = path.join(root, 'node_modules/.pnpm')

function findSourcePrismaDir(baseDir) {
  const matches = fs
    .readdirSync(baseDir)
    .filter((entry) => entry.startsWith('@prisma+client@6.16.3'))
    .map((entry) => path.join(baseDir, entry, 'node_modules/.prisma'))
    .filter((candidate) => fs.existsSync(path.join(candidate, 'client')))

  return matches[0] ?? null
}

function findEmbeddedClientDir(baseDir) {
  const matches = fs
    .readdirSync(baseDir)
    .filter((entry) => entry.startsWith('@prisma+client@6.16.3'))
    .map((entry) => path.join(baseDir, entry, 'node_modules/@prisma/client'))
    .filter((candidate) => fs.existsSync(candidate))

  return matches[0] ?? null
}

const sourceDir = findSourcePrismaDir(sourcePnpmDir)
const embeddedClientDir = findEmbeddedClientDir(embeddedPnpmDir)

if (!sourceDir || !embeddedClientDir) {
  throw new Error(`Prisma client path not found. source=${sourceDir} embeddedClient=${embeddedClientDir}`)
}

const embeddedNodeModulesDir = path.resolve(embeddedClientDir, '..', '..')
const embeddedPrismaDir = path.join(embeddedNodeModulesDir, '.prisma')
const embeddedClientPrismaLink = path.join(embeddedClientDir, '.prisma')

fs.rmSync(embeddedPrismaDir, { recursive: true, force: true })
fs.cpSync(sourceDir, embeddedPrismaDir, { recursive: true })
fs.rmSync(embeddedClientPrismaLink, { recursive: true, force: true })
fs.symlinkSync('../.prisma', embeddedClientPrismaLink, 'dir')

console.log(`synced prisma client from ${sourceDir} to ${embeddedPrismaDir}`)
