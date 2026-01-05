"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { generateText, DefaultChatTransport } from "ai";

export default function QAPage() {
	const [selectedFile, setSelectedFile] = useState("");
	const selectedFileRef = useRef(selectedFile); // 创建一个 ref 来存储 selectedFile 的最新值
	const [availableFiles, setAvailableFiles] = useState<string[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// 每次 selectedFile 更新时，同步到 ref 中
	useEffect(() => {
		selectedFileRef.current = selectedFile;
		console.log("selectedFile 更新，ref 也更新为:", selectedFileRef.current); // 添加日志
	}, [selectedFile]);
	function getfilename() {
		const currentFileName = selectedFileRef.current;
		console.log("在 getfilename() 中从 ref 获取，selectedFile 的值是:", currentFileName);
		return currentFileName;
	}

	// 使用 AI SDK 的 useChat hook
	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({
			body: () => ({
				fileName: getfilename()
			})
		})
	});
	const [input, setInput] = useState("");

	// 自动滚动到底部
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// 获取可用的文件列表
	useEffect(() => {
		fetchFiles();
	}, []);

	const fetchFiles = async () => {
		try {
			const response = await fetch("/api/files");
			const data = await response.json();
			if (data.success) {
				setAvailableFiles(data.files);
			}
		} catch (error) {
			console.error("获取文件列表失败:", error);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					<div className="flex justify-between items-center mb-8">
						<h1 className="text-3xl font-bold text-gray-800 dark:text-white">知识库问答</h1>
						<Link href="/upload" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
							上传文档
						</Link>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
						{/* 文档选择区域 */}
						<div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择知识库文档</label>
							<select
								value={selectedFile}
								onChange={(e) => {
									setSelectedFile(e.target.value);
								}}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
								<option value="">请选择文档</option>
								{availableFiles.map((file, index) => (
									<option key={index} value={file}>
										{file}
									</option>
								))}
							</select>
						</div>

						{/* 消息显示区域 */}
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{messages.length === 0 ? (
								<div className="text-center text-gray-500 dark:text-gray-400 mt-8">
									<svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
									</svg>
									<p>开始提问吧！</p>
								</div>
							) : (
								messages.map((message, index) => (
									<div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
										<div className={`max-w-[70%] rounded-lg p-4 ${message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"}`}>
											<div className="text-xs font-semibold mb-1 opacity-75">{message.role === "user" ? "我" : "AI助手"}</div>
											<div className="whitespace-pre-wrap"> {message.parts.map((part, index) => (part.type === "text" ? <span key={index}>{part.text}</span> : null))}</div>
										</div>
									</div>
								))
							)}
							{status == "streaming" && (
								<div className="flex justify-start">
									<div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
										<div className="flex space-x-2">
											<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
											<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
											<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
										</div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* 输入区域 */}
						<form
							onSubmit={(e) => {
								e.preventDefault();
								if (input.trim()) {
									sendMessage({ text: input });
									setInput("");
								}
							}}
							className="p-4 border-t border-gray-200 dark:border-gray-700">
							<div className="flex gap-2">
								<input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入您的问题..." className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" disabled={status !== "ready"} />
								<button type="submit" disabled={status == "streaming" || !input || !input.trim()} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
									发送
								</button>
								<button
									onClick={() => {
										console.log(selectedFile);
									}}
									className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
									打印
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
