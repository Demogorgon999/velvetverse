import {build} from 'vite'
import {fileURLToPath} from 'node:url'
import react from '@vitejs/plugin-react'
export async function buildGuestPlayer(outDir){
  if(typeof outDir!=='string'||!outDir)throw new Error('explicit_guest_output_required')
  await build({configFile:false,plugins:[react()],define:{'process.env.NODE_ENV':'"production"'},root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'silent',base:'/velvetverse/player/',
    build:{outDir,emptyOutDir:true,lib:{entry:fileURLToPath(new URL('../src/experimental/guestPlayerEntry.tsx',import.meta.url)),name:'VelvetVerseGuest',formats:['iife'],fileName:()=> 'player.js',cssFileName:'player'},assetsInlineLimit:1000000}})
}
