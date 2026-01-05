import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads')

    try {
      const files = await readdir(uploadsDir)
      return NextResponse.json({
        success: true,
        files: files,
      })
    } catch (error) {
      // uploads 目录不存在
      return NextResponse.json({
        success: true,
        files: [],
      })
    }
  } catch (error) {
    console.error('获取文件列表错误:', error)
    return NextResponse.json(
      { success: false, error: '获取文件列表失败' },
      { status: 500 }
    )
  }
}
