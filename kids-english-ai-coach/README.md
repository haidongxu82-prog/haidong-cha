# 儿童英语 AI 陪练静态主站版

这个目录用于挂载到 `haidong.chat` 主站的静态工具目录。

- 入口：`index.html`
- 数据：浏览器 `localStorage`
- 流程：固定 5 阶段状态机
- 报告：课程完成后本地生成家长总结

静态站不能安全保存 OpenAI API Key，所以这个版本不直接调用 LLM。Next.js 版本仍保留在项目根目录，可在服务端配置 `OPENAI_API_KEY` 后启用真实模型纠错。
