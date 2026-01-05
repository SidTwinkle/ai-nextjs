import { createDeepSeek, deepseek } from '@ai-sdk/deepseek';
import { streamText, UIMessage, convertToModelMessages, embed } from 'ai'
import { cosineSimilarity } from '@/lib/vector-utils'
import { loadVectorStore, getVectorsByFileName } from '@/lib/vector-store'


export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, fileName }: { messages: UIMessage[]; fileName?: string } = await req.json()

    // 配置 OpenAI 提供商
    const apiKey = process.env.OPENAI_API_KEY || ''
    const baseURL = process.env.OPENAI_BASE_URL || undefined
    const modelName = process.env.MODEL_NAME || 'gpt-3.5-turbo'

    // 创建提供商实例
    // const deepseek = createDeepSeek({
    //   apiKey,
    //   baseURL
    // })

    // 获取用户最后一条消息作为查询
    const lastMessage = messages[messages.length - 1]
    const userQuery = lastMessage?.parts
      ?.map(part => (part.type === 'text' ? part.text : ''))
      .join('') || ''

    let systemPrompt = '你是一个有帮助的AI助手，可以回答用户的各种问题。'
    let context = ''

    // 如果选择了文档，进行RAG检索
    if (fileName && userQuery) {
      try {
        // 生成查询向量
        const embeddingModel = deepseek.embeddingModel('text-embedding-3-small')
        const { embedding: queryEmbedding } = await embed({
          model: embeddingModel,
          value: userQuery,
        })

        // 获取该文档的向量
        const vectors = getVectorsByFileName(fileName)

        if (vectors.length > 0) {
          // 计算相似度并排序
          const similarities = vectors.map(vector => ({
            text: vector.text,
            similarity: cosineSimilarity(queryEmbedding, vector.embedding),
          }))

          // 取前3个最相关的片段
          const topResults = similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)

          // 构建上下文
          context = topResults.map(r => r.text).join('\n\n')

          // 更新系统提示
          systemPrompt = `你是一个有帮助的AI助手。请根据以下文档内容来回答用户的问题。

文档内容：
${context}

请基于以上内容回答用户问题。如果文档中没有相关信息，请说明这一点。`
        }
      } catch (error) {
        console.error('RAG检索错误:', error)
        // 如果检索失败，继续正常对话
      }
    }
    const result = streamText({
      model: deepseek(modelName),
      messages: await convertToModelMessages(messages),
      system: systemPrompt,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('AI 聊天错误:', error)
    return new Response(
      JSON.stringify({ error: '处理请求时出错', details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}