// Original procedural BonusTrack icon; no stock or generated-image assets.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
const crc = bytes => { let value = -1; for (const byte of bytes) { value ^= byte; for (let i = 0; i < 8; i++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1)) } return (value ^ -1) >>> 0 }
function chunk(type, data) {
  const content = Buffer.concat([Buffer.from(type), data]), length = Buffer.alloc(4), checksum = Buffer.alloc(4)
  length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc(content))
  return Buffer.concat([length, content, checksum])
}
function icon(size) {
  const rows = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x * 192 / size, v = y * 192 / size
    const rectangle = (left, top, right, bottom) => u >= left && u < right && v >= top && v < bottom
    const back = rectangle(52, 44, 148, 116) && !rectangle(60, 52, 140, 108)
    const front = rectangle(36, 68, 140, 148)
    const border = front && !rectangle(44, 76, 132, 140)
    const stripe = rectangle(36, 91, 140, 99) || rectangle(54, 119, 77, 127)
    const white = (back && !front) || border || stripe
    const offset = y * (size * 3 + 1) + 1 + x * 3
    rows[offset] = white ? 255 : 22; rows[offset + 1] = white ? 255 : 112; rows[offset + 2] = white ? 255 : 90
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2
  const origin = Buffer.from('impeccable:prompt\0Origin: Original procedural BonusTrack icon, authored in scripts/generate-icons.mjs. White overlapping payment-card outlines on a solid #16705a background. No external image source.')
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('tEXt', origin), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))])
}
mkdirSync('public', { recursive: true })
for (const size of [180, 192, 512]) writeFileSync(`public/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`, icon(size))
