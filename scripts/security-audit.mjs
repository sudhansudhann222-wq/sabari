import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const forbidden = ['.env', '.env.local', '.env.production', '.htpasswd', '.bash_history', '.mysql_history', 'users.json', 'accounts.json', 'JAMonAdmin.jsp']
const publicFiles = readdirSync(join(root, 'public'), { withFileTypes: true }).map(entry => entry.name)
const distFiles = existsSync(join(root, 'dist')) ? readdirSync(join(root, 'dist'), { withFileTypes: true }).map(entry => entry.name) : []
const vercel = readFileSync(join(root, 'vercel.json'), 'utf8')
const vite = readFileSync(join(root, 'vite.config.ts'), 'utf8')
const failures = []
for (const file of forbidden) if (publicFiles.includes(file) || distFiles.includes(file)) failures.push(`Sensitive file present in deploy scope: ${file}`)
for (const header of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']) if (!vercel.includes(header)) failures.push(`Missing production header: ${header}`)
if (!vite.includes("host: '127.0.0.1'")) failures.push('Vite is not localhost-bound by default')
if (!vite.includes("fs:") || !vite.includes(".env")) failures.push('Vite filesystem deny rules are incomplete')
if (failures.length) { console.error(failures.join('\n')); process.exit(1) }
console.log('Security audit passed: sensitive paths, production headers, and Vite defaults verified.')
