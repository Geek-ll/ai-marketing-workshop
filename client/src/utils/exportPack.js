import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { fetchAssets } from '../api/asset'

const BASE = import.meta.env.VITE_API_BASE ?? ''
const safeName = (s) => s.replace(/[\\/:*?"<>|]/g, '_')

/**
 * 把一个商品的所有成品素材打包成 ZIP 下载。
 * 结构：<商品名>-营销包/{images/scene-N.png, copy/<渠道>-<语言>-N.txt, README.txt}
 */
export async function exportPack(product) {
  const assets = (await fetchAssets({ productId: product._id })).data.filter((a) => a.status === 'done')
  const images = assets.filter((a) => a.type === 'image')
  const copies = assets.filter((a) => a.type === 'copy')
  if (!images.length && !copies.length) throw new Error('该商品还没有可导出的素材，请先生成文案或场景图')

  const rootName = safeName(product.name) + '-营销包'
  // 保留外层 zip 引用，folder 只是它的子目录，这样解压后第一层就是“商品名-营销包”
  const zip = new JSZip()
  const folder = zip.folder(rootName)

  // 图片：同源下载为 Blob 后放进 images/
  await Promise.all(
    images.map(async (a, i) => {
      const res = await fetch(BASE + a.imageUrl)
      if (!res.ok) throw new Error('下载图片失败：' + a.imageUrl)
      folder.file(`images/scene-${i + 1}.png`, await res.blob())
    })
  )

  // 文案：每条保存为一个 .txt
  copies.forEach((a, i) => folder.file(`copy/${a.channel}-${a.language}-${i + 1}.txt`, a.content))

  folder.file(
    'README.txt',
    `商品：${product.name}\n导出时间：${new Date().toLocaleString()}\n场景图：${images.length} 张\n文案：${copies.length} 条\n`
  )

  // 从 zip 根生成，压缩包内第一层就是商品文件夹
  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, rootName + '.zip')
}
