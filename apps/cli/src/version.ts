// 版本号唯一真源：apps/cli/package.json
// 打包时被 esbuild 内联，运行时不依赖任何相对路径（bin 可能被 symlink 到别处）

import packageJson from '../package.json'

export const VERSION: string = packageJson.version
