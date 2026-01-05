// 文档分块工具
export function splitTextIntoChunks(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[。！？\n]+/).filter(s => s.trim().length > 0)

  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      // 保留一些重叠以保持上下文
      const words = currentChunk.split(' ')
      currentChunk = words.slice(-Math.floor(overlap / 10)).join(' ') + ' ' + sentence
    } else {
      currentChunk += sentence + '。'
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

// 计算余弦相似度
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// 向量数据结构
export interface VectorChunk {
  text: string
  embedding: number[]
  fileName: string
  chunkIndex: number
}
