# Mini Agent Framework

一个轻量级的智能体框架，展示如何构建简单的 AI Agent 系统，类似 Mini LangChain。包含 ReAct (Reasoning + Acting) 模式的智能体实现。

## 🌟 特性

- 🤖 **ReAct Agent** - 实现推理和行动循环的智能体
- 🔧 **工具系统** - 可扩展的工具调用机制
- 📝 **简洁架构** - 易于理解和扩展的代码结构
- 🚀 **零依赖** - 仅使用 Node.js 内置模块
- 📚 **教学友好** - 适合学习智能体开发的入门项目

## 🧠 什么是 ReAct Agent？

ReAct (Reasoning + Acting) 是一种智能体模式，它结合了：
- **推理 (Reasoning)** - 分析问题和制定计划
- **行动 (Acting)** - 使用工具执行具体操作

智能体按照以下循环工作：
1. **Thought** - 分析当前情况
2. **Action** - 选择并执行工具
3. **Observation** - 观察工具执行结果
4. 重复直到得到最终答案

## 📋 前置要求

- Node.js 18.0.0 或更高版本
- OpenAI API 密钥

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/mini-agent-framework.git
cd mini-agent-framework
```

### 2. 配置 API 密钥

创建 `.env` 文件并添加你的 OpenAI API 密钥：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件：

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 运行智能体

```bash
npm start
```

或者使用开发模式（自动重启）：

```bash
npm run dev
```

## 📖 代码架构

### 核心组件

```
├── index.js          # 主程序 - ReAct Agent 实现
├── test.js           # 测试文件
└── .env              # 环境变量配置
```

### ReAct Agent 工作流程

```javascript
// 1. 智能体接收问题
runAgent("你的钱藏在哪里");

// 2. 进入 ReAct 循环
for (let step = 0; step < maxSteps; step++) {
  // 发送历史记录给 LLM
  const llmText = await callLLM(history);
  
  // 解析 LLM 响应
  const { thought, action, final } = parseResponse(llmText);
  
  // 如果有最终答案，结束
  if (final) return final;
  
  // 否则执行工具
  const observation = await tools[action.tool](action.input);
  
  // 将结果添加到历史记录
  history += `Observation: ${observation}\n`;
}
```

### 工具系统

```javascript
const tools = {
  search: async (query) => {
    // 搜索工具实现
    return `搜索结果: ${query}`;
  },
  
  // 可以添加更多工具...
};
```

## 🔧 自定义工具

添加新工具非常简单：

```javascript
// 1. 在 tools 对象中添加新工具
const tools = {
  search: async (query) => { /* ... */ },
  
  // 新工具
  calculator: async (expression) => {
    try {
      return `计算结果: ${eval(expression)}`;
    } catch (error) {
      return `计算错误: ${error.message}`;
    }
  }
};

// 2. 在系统提示中描述工具
const SYSTEM_PROMPT = `
Available tools:
- search(query: string)
- calculator(expression: string)
`;
```

## 📚 学习要点

这个项目展示了以下 AI Agent 核心概念：

### 1. **ReAct 模式**
- 推理与行动的结合
- 循环式问题解决
- 工具调用机制

### 2. **提示工程**
- 结构化提示设计
- 输出格式控制
- 上下文管理

### 3. **工具集成**
- 工具抽象和注册
- 异步工具执行
- 错误处理

### 4. **状态管理**
- 对话历史维护
- 步骤限制控制
- 循环检测

## 🎯 示例对话

```
Question: 你的钱藏在哪里

============= STEP 0 ====================
Thought: 我需要搜索关于钱藏在哪里的信息
Action: search("钱藏在哪里")

Observation: mock result for : 钱藏在哪里

============= STEP 1 ====================
Thought: 基于搜索结果，我可以给出答案
Final: 根据搜索结果，关于钱的存放位置...
```

## 🔄 与 LangChain 的对比

| 特性 | Mini Agent Framework | LangChain |
|------|---------------------|-----------|
| 复杂度 | 简单，易理解 | 功能丰富，复杂 |
| 依赖 | 零外部依赖 | 多个依赖包 |
| 学习曲线 | 平缓 | 陡峭 |
| 自定义性 | 高度可定制 | 框架约束 |
| 适用场景 | 学习、原型 | 生产环境 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 这个项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

这个项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 注意事项

- 请不要将你的 API 密钥提交到版本控制系统
- 示例中的 `eval()` 仅用于演示，生产环境需要更安全的实现
- 使用 OpenAI API 会产生费用，请注意使用量

## 📞 联系方式

如果你有任何问题，请通过以下方式联系：

- 提交 [Issue](https://github.com/yourusername/mini-agent-framework/issues)
- 发送邮件到：youlan@gmail.com

## 🙏 致谢

- 感谢 OpenAI 提供强大的 API 服务
- 灵感来源于 LangChain 和 ReAct 论文