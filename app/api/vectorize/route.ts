import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { deepseek } from '@ai-sdk/deepseek'
import { embed } from 'ai'
import { splitTextIntoChunks } from '@/lib/vector-utils'
import { addVectorsToStore, removeVectorsByFileName } from '@/lib/vector-store'

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: '缺少文件名' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const filePath = path.join(process.cwd(), 'uploads', fileName)
    let fileContent: string

    try {
      const buffer = await readFile(filePath)
      fileContent = buffer.toString('utf-8')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '文件读取失败' },
        { status: 404 }
      )
    }

    // 分块处理
    const chunks = splitTextIntoChunks(fileContent, 500, 50)

    if (chunks.length === 0) {
      return NextResponse.json(
        { success: false, error: '文件内容为空' },
        { status: 400 }
      )
    }

    // 使用 text-embedding-3-small 模型（或其他兼容模型）
    const embeddingModel = deepseek.embeddingModel('text-embedding-3-small')

    // 先删除该文件的旧向量
    removeVectorsByFileName(fileName)

    // 为每个块生成向量
    const vectors = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      try {
        const { embedding } = await embed({
          model: embeddingModel,
          value: chunk,
        })

        vectors.push({
          text: chunk,
          embedding: embedding,
          fileName: fileName,
          chunkIndex: i,
        })
      } catch (error) {
        console.error(`Error embedding chunk ${i}:`, error)
        // 继续处理其他块
      }
    }

    // 保存向量
    if (vectors.length > 0) {
      addVectorsToStore(vectors)

      return NextResponse.json({
        success: true,
        fileName: fileName,
        chunksCount: vectors.length,
        message: '文档向量化成功',
      })
    } else {
      return NextResponse.json(
        { success: false, error: '向量化失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('向量化错误:', error)
    return NextResponse.json(
      { success: false, error: '向量化处理失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
