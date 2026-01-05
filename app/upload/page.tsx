'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [vectorizing, setVectorizing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      // 1. 上传文件
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        const fileName = file.name

        // 2. 自动进行向量化
        setVectorizing(true)
        try {
          const vectorizeResponse = await fetch('/api/vectorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName }),
          })

          const vectorizeData = await vectorizeResponse.json()

          if (vectorizeData.success) {
            alert(`文件上传并向量化成功！已处理 ${vectorizeData.chunksCount} 个文本块。`)
          } else {
            alert(`文件上传成功，但向量化失败：${vectorizeData.error}`)
          }
        } catch (error) {
          alert('文件上传成功，但向量化失败')
          console.error('向量化错误:', error)
        } finally {
          setVectorizing(false)
        }

        setUploadedFiles(prev => [...prev, fileName])
        setFile(null)
        // 重置文件输入
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        alert('文件上传失败：' + data.error)
      }
    } catch (error) {
      alert('文件上传失败：' + error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              文档上传
            </h1>
            <Link
              href="/qa"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              前往问答页
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                选择文档文件
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                accept=".txt,.pdf,.doc,.docx,.md"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  已选择: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading || vectorizing}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {uploading ? '上传中...' : vectorizing ? '向量化处理中...' : '上传文档'}
            </button>

            {uploadedFiles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  已上传的文件
                </h2>
                <ul className="space-y-2">
                  {uploadedFiles.map((fileName, index) => (
                    <li
                      key={index}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <svg
                        className="w-5 h-5 text-green-500 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">
                        {fileName}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              支持的文件格式: TXT, PDF, DOC, DOCX, MD
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
