import path from 'path'
import fs from 'fs'

class BuildObj {
  // 编译主进程代码
  buildMain() {
    require('esbuild').buildSync({
      entryPoints: ['./src/main/mainEntry.ts'],
      bundle: true,
      platform: 'node',
      minify: true, // 生成压缩代码
      outfile: './dist/mainEntry.js',
      external: ['electron']
    })
  }

  // 为生产环境准备 package.json
  preparePackageJson() {
    let pkgJsonPath = path.join(process.cwd(), 'package.json')
    let localPkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
    let electronConfig = localPkgJson.devDependencies.electron.replace('^', '')
    localPkgJson.main = 'mainEntry.js'
    delete localPkgJson.scripts
    delete localPkgJson.devDependencies
    localPkgJson.devDependencies = { electron: electronConfig }
    let tarJsonPath = path.join(process.cwd(), 'dist', 'package.json')
    fs.writeFileSync(tarJsonPath, JSON.stringify(localPkgJson))
    fs.mkdirSync(path.join(process.cwd(), 'dist/node_modules'))
  }

  // 使用 electron-builder 制成安装包
  buildInstaller() {
    let options = {
      config: {
        directories: {
          output: path.join(process.cwd(), "release"),
          app: path.join(process.cwd(), "dist"),
        },
        files: ['**'],
        extends: null,
        productName: 'JueJin',
        appId: "com.juejin.desktop",
        asar: true,
        nsis: {
          oneClick: true,
          perMachine: true,
          allowToChangeInstallationDirectory: false,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: "juejinDesktop",
        },
        publish: [{ provider: "generic", url: "http://localhost:5500/" }]
      },
      project: process.cwd()
    }

    return require('electron-builder').build(options)
  }
}

export const buildPlugin = () => {
  return {
    name: 'build-plugin',
    // 在Vite编译完代码之后，执行 npm run build 这个指令的工作完成之后。closeBundle 会被调用
    closeBundle: () => {
      let buildObj = new BuildObj()
      buildObj.buildMain()
      buildObj.preparePackageJson()
      buildObj.buildInstaller()
    }
  }
}