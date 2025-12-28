# Mini Agent Framework 详细教程

这个教程将带你深入了解如何构建和使用 ReAct (Reasoning + Acting) 智能体。

## 📚 目录

1. [智能体概述](#智能体概述)
2. [ReAct 模式详解](#react-模式详解)
3. [代码架构分析](#代码架构分析)
4. [工具系统设计](#工具系统设计)
5. [扩展和自定义](#扩展和自定义)
6. [最佳实践](#最佳实践)
7. [常见问题](#常见问题)

## 智能体概述

### 什么是智能体？

智能体 (Agent) 是一个能够：
- 感知环境
- 做出决策
- 执行行动
- 学习和适应

的自主系统。在 AI 领域，智能体通常指能够使用工具完成复杂任务的 AI 系统。

### 为什么需要智能体？

传统的 LLM 只能生成文本，但智能体可以：
- 调用外部 API
- 执行计算
- 访问数据库
- 与其他系统交互

## ReAct 模式详解

### ReAct 是什么？

ReAct = **Reasoning** (推理) + **Acting** (行动)

这是一种让 AI 模型能够：
1. **思考** - 分析问题，制定计划
2. **行动** - 使用工具执行操作
3. **观察** - 分析工具执行结果
4. **重复** - 直到解决问题

### ReAct 工作流程

```
用户问题 → Thought → Action → Observation → Thought → Action → ... → Final Answer
```

### 示例对话流程

```
Question: 今天北京的天气如何？

Step 1:
Thought: 我需要查询北京今天的天气信息
Action: search("北京今天天气")

Observation: 北京今天晴，温度 15-25°C，微风

Step 2:
Thought: 我已经获得了天气信息，可以给出答案
Final: 根据查询结果，北京今天天气晴朗，温度在15-25°C之间，有微风。
```

## 代码架构分析

### 1. 环境变量加载

```javascript
// 手动实现 dotenv 功能
const envContent = readFileSync(".env", "utf8");
const envLines = envContent.split("\n");
for (const line of envLines) {
  if (line.trim() && !line.startsWith("#")) {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
}
```

**为什么手动实现？**
- 教学目的：理解环境变量加载原理
- 零依赖：不需要安装额外包
- 简单直接：代码逻辑清晰

### 2. 系统提示设计

```javascript
const SYSTEM_PROMPT = `
You are a ReAct agent.

You must respond ONLY in this format:

Thought: <your reasoning>
Action: <tool_name>("input")

OR, if finished:

Thought: <your reasoning>
Final: <final answer>

Available tools:
- search(query: string)
`;
```

**关键设计原则：**
- **格式严格** - 确保输出可解析
- **工具描述** - 让 AI 知道可用工具
- **示例格式** - 明确输出格式

### 3. 响应解析

```javascript
function parseResponse(text) {
  const thoughtMatch = text.match(/Thought:\s*(.*)/);
  const actionMatch = text.match(/Action:\s*(\w+)\("(.*)"\)/);
  const finalMatch = text.match(/Final:\s*(.*)/);

  return {
    thought: thoughtMatch?.[1],
    action: actionMatch
      ? { tool: actionMatch[1], input: actionMatch[2] }
      : null,
    final: finalMatch?.[1],
  };
}
```

**解析逻辑：**
- 使用正则表达式提取结构化信息
- 处理三种可能的输出：Thought、Action、Final
- 容错处理：使用可选链操作符

### 4. 主循环实现

```javascript
async function runAgent(question, maxSteps = 5) {
  let history = `Question: ${question}\n`;

  for (let step = 0; step < maxSteps; step++) {
    // 1. 发送历史给 LLM
    const llmText = await callLLM(history);
    
    // 2. 解析响应
    const { thought, action, final } = parseResponse(llmText);
    
    // 3. 检查是否完成
    if (final) {
      return { final, history };
    }
    
    // 4. 执行工具
    if (action) {
      const observation = await tools[action.tool](action.input);
      history += `Observation: ${observation}\n`;
    }
  }
}
```

## 工具系统设计

### 工具接口

```javascript
const tools = {
  toolName: async (input) => {
    // 工具实现
    return "工具执行结果";
  }
};
```

### 示例工具实现

#### 1. 搜索工具

```javascript
search: async (query) => {
  // 模拟搜索 - 实际项目中可以调用真实搜索 API
  return `搜索结果: ${query}`;
}
```

#### 2. 计算器工具

```javascript
calculator: async (expression) => {
  try {
    // 注意：生产环境需要更安全的实现
    const result = eval(expression.replace(/[^0-9+\-*/().\s]/g, ''));
    return `计算结果: ${result}`;
  } catch (error) {
    return `计算错误: ${error.message}`;
  }
}
```

#### 3. 时间工具

```javascript
getCurrentTime: async () => {
  return `当前时间: ${new Date().toLocaleString('zh-CN')}`;
}
```

## 扩展和自定义

### 1. 添加新工具

```javascript
// 1. 在 tools 对象中添加
const tools = {
  // 现有工具...
  
  // 新工具：天气查询
  weather: async (city) => {
    // 调用天气 API
    const response = await fetch(`https://api.weather.com/v1/current?city=${city}`);
    const data = await response.json();
    return `${city}天气: ${data.weather}, 温度: ${data.temperature}°C`;
  }
};

// 2. 更新系统提示
const SYSTEM_PROMPT = `
Available tools:
- search(query: string)
- weather(city: string)  // 新增
`;
```

### 2. 改进错误处理

```javascript
async function runAgent(question, maxSteps = 5) {
  let history = `Question: ${question}\n`;

  for (let step = 0; step < maxSteps; step++) {
    try {
      const llmText = await callLLM(history);
      const { thought, action, final } = parseResponse(llmText);
      
      if (final) return { final, history };
      
      if (action) {
        const toolFn = tools[action.tool];
        if (!toolFn) {
          history += `Error: Unknown tool "${action.tool}"\n`;
          continue;
        }
        
        const observation = await toolFn(action.input);
        history += `Observation: ${observation}\n`;
      }
    } catch (error) {
      history += `Error: ${error.message}\n`;
    }
  }
}
```

### 3. 添加记忆功能

```javascript
class AgentMemory {
  constructor(maxHistory = 10) {
    this.conversations = [];
    this.maxHistory = maxHistory;
  }
  
  addConversation(question, answer) {
    this.conversations.push({ question, answer, timestamp: new Date() });
    if (this.conversations.length > this.maxHistory) {
      this.conversations.shift();
    }
  }
  
  getRelevantHistory(currentQuestion) {
    // 简单的相关性匹配
    return this.conversations.filter(conv => 
      conv.question.includes(currentQuestion) || 
      currentQuestion.includes(conv.question)
    );
  }
}
```

## 最佳实践

### 1. 提示工程

**好的提示：**
```javascript
const SYSTEM_PROMPT = `
You are a helpful ReAct agent. Follow these rules:

1. Always think step by step
2. Use tools when you need external information
3. Be precise in your tool calls
4. Provide clear final answers

Format:
Thought: <reasoning>
Action: <tool>("input")
OR
Final: <answer>

Tools:
- search(query): Search for information
- calculate(expr): Perform calculations
`;
```

**避免的问题：**
- 提示过于复杂
- 格式不明确
- 缺少工具描述

### 2. 工具设计

**好的工具设计：**
- 单一职责
- 清晰的输入输出
- 错误处理
- 文档完整

```javascript
const tools = {
  // 好的工具设计
  searchWeb: async (query) => {
    if (!query || query.trim() === '') {
      return 'Error: Search query cannot be empty';
    }
    
    try {
      // 实际搜索逻辑
      const results = await performSearch(query);
      return `搜索结果: ${results}`;
    } catch (error) {
      return `搜索失败: ${error.message}`;
    }
  }
};
```

### 3. 性能优化

```javascript
// 缓存机制
const cache = new Map();

const tools = {
  search: async (query) => {
    const cacheKey = `search:${query}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    const result = await performSearch(query);
    cache.set(cacheKey, result);
    return result;
  }
};
```

## 常见问题

### Q: 为什么智能体有时会陷入循环？

A: 可能的原因：
1. 工具返回的信息不够明确
2. 系统提示不够清晰
3. 缺少循环检测机制

**解决方案：**
```javascript
// 添加循环检测
const actionHistory = [];
if (actionHistory.includes(JSON.stringify(action))) {
  history += `Warning: Repeated action detected\n`;
}
actionHistory.push(JSON.stringify(action));
```

### Q: 如何处理工具执行失败？

A: 实现健壮的错误处理：
```javascript
try {
  const observation = await tools[action.tool](action.input);
  history += `Observation: ${observation}\n`;
} catch (error) {
  history += `Tool Error: ${error.message}. Try a different approach.\n`;
}
```

### Q: 如何优化 API 调用成本？

A: 几个策略：
1. 使用更便宜的模型（如 gpt-4o-mini）
2. 实现缓存机制
3. 限制最大步数
4. 优化提示长度

### Q: 如何扩展到多智能体系统？

A: 可以考虑：
1. 智能体间通信协议
2. 任务分配机制
3. 协调和同步
4. 共享状态管理

```javascript
class MultiAgentSystem {
  constructor() {
    this.agents = new Map();
    this.messageQueue = [];
  }
  
  addAgent(name, agent) {
    this.agents.set(name, agent);
  }
  
  async coordinate(task) {
    // 任务分配和协调逻辑
  }
}
```

## 进阶主题

### 1. 流式响应

```javascript
async function streamingAgent(question) {
  // 实现流式输出
  for await (const chunk of llmStream(prompt)) {
    process.stdout.write(chunk);
  }
}
```

### 2. 并行工具执行

```javascript
// 并行执行多个工具
const results = await Promise.all([
  tools.search(query1),
  tools.weather(city),
  tools.calculate(expression)
]);
```

### 3. 智能体链

```javascript
class AgentChain {
  constructor(agents) {
    this.agents = agents;
  }
  
  async run(input) {
    let result = input;
    for (const agent of this.agents) {
      result = await agent.run(result);
    }
    return result;
  }
}
```

这个教程涵盖了构建智能体的核心概念和实践。通过学习这些内容，你可以构建更复杂和强大的智能体系统！