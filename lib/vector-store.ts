import { VectorChunk } from './vector-utils'
import fs from 'fs'
import path from 'path'

const VECTOR_STORE_PATH = path.join(process.cwd(), 'vectors', 'store.json')

// 确保向量存储目录存在
function ensureVectorDir() {
  const dir = path.dirname(VECTOR_STORE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 加载向量存储
export function loadVectorStore(): VectorChunk[] {
  ensureVectorDir()

  if (!fs.existsSync(VECTOR_STORE_PATH)) {
    return []
  }

  try {
    const data = fs.readFileSync(VECTOR_STORE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading vector store:', error)
    return []
  }
}

// 保存向量存储
export function saveVectorStore(vectors: VectorChunk[]) {
  ensureVectorDir()

  try {
    fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(vectors, null, 2))
  } catch (error) {
    console.error('Error saving vector store:', error)
    throw error
  }
}

// 添加向量到存储
export function addVectorsToStore(newVectors: VectorChunk[]) {
  const existingVectors = loadVectorStore()
  const combined = [...existingVectors, ...newVectors]
  saveVectorStore(combined)
}

// 根据文件名删除向量
export function removeVectorsByFileName(fileName: string) {
  const vectors = loadVectorStore()
  const filtered = vectors.filter(v => v.fileName !== fileName)
  saveVectorStore(filtered)
}

// 获取指定文件的所有向量
export function getVectorsByFileName(fileName: string): VectorChunk[] {
  const vectors = loadVectorStore()
  return vectors.filter(v => v.fileName === fileName)
}
