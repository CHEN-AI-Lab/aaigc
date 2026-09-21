import { supportedTools, listTools } from './shared/tools/registry.ts'

const caps = ['network', 'clipboard', 'timer']
const tools = supportedTools(caps)

console.log('小程序端可运行工具数:', tools.length)
console.log('目标 >= 22:', tools.length >= 22 ? '达标' : '未达标')
console.log()
console.log('清单:')
for (const t of tools) {
  console.log('  ' + t.id + '  [' + t.tier + ']  caps=' + JSON.stringify(t.capabilities))
}
console.log()
console.log('全部工具数:', listTools().length)
