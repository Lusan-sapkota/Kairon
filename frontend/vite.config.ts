import {defineConfig, type Plugin, type ViteDevServer} from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const guidePath = path.resolve(dir, '..', 'GUIDE.md')
const virtualId = 'virtual:kairon-guide'
const resolvedVirtualId = '\0' + virtualId

function kaironGuide(): Plugin {
    return {
        name: 'kairon-guide',
        resolveId(id) {
            if (id === virtualId) return resolvedVirtualId
        },
        load(id) {
            if (id !== resolvedVirtualId) return
            this.addWatchFile(guidePath)
            const md = fs.readFileSync(guidePath, 'utf8')
            return `export default ${JSON.stringify(md)}`
        },
        configureServer(server: ViteDevServer) {
            server.watcher.add(guidePath)
        },
        handleHotUpdate({file, server}: {file: string; server: ViteDevServer}) {
            if (path.resolve(file) !== guidePath) return
            const mod = server.moduleGraph.getModuleById(resolvedVirtualId)
            if (!mod) {
                server.ws.send({type: 'full-reload'})
                return []
            }
            server.moduleGraph.invalidateModule(mod)
            return [...mod.importers]
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), kaironGuide()],
    server: {
        fs: {allow: [path.resolve(dir, '..')]},
    },
})
