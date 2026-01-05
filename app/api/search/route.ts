import { NextRequest, NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { embed } from 'ai'
import { cosineSimilarity } from '@/lib/vector-utils'
import { loadVectorStore, getVectorsByFileName } from '@/lib/vector-store'

export async function POST(request: NextRequest) {
  try {
    const { query, fileName, topK = 3 } = await request.json()

    if (!query) {
      return NextResponse.json(
        { success: false, error: '缺少查询文本' },
        { status: 400 }
      )
    }

    // 配置 OpenAI embedding 模型
    const apiKey = process.env.OPENAI_API_KEY || ''
    const baseURL = process.env.OPENAI_BASE_URL || undefined

    const openai = createOpenAI({
      apiKey,
      baseURL,
    })

    const embeddingModel = openai.embedding('text-embedding-3-small')

    // 生成查询向量
    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    })

    // 获取向量库
    let vectors = fileName ? getVectorsByFileName(fileName) : loadVectorStore()

    if (vectors.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: '没有找到相关文档',
      })
    }

    // 计算相似度并排序
    const similarities = vectors.map(vector => ({
      text: vector.text,
      fileName: vector.fileName,
      chunkIndex: vector.chunkIndex,
      similarity: cosineSimilarity(queryEmbedding, vector.embedding),
    }))

    // 按相似度降序排序，取前 topK 个
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)

    return NextResponse.json({
      success: true,
      results: topResults,
      query: query,
    })
  } catch (error) {
    console.error('搜索错误:', error)
    return NextResponse.json(
      { success: false, error: '搜索失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
