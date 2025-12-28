# 智能体示例

这个文档展示了各种智能体使用场景和扩展示例。

## 📚 目录

1. [基础示例](#基础示例)
2. [工具扩展](#工具扩展)
3. [高级模式](#高级模式)
4. [实际应用](#实际应用)

## 基础示例

### 1. 简单问答

```javascript
// 运行智能体
await runAgent("什么是人工智能？");

// 输出示例：
// Thought: 用户询问人工智能的定义，我可以直接回答
// Final: 人工智能是计算机科学的一个分支...
```

### 2. 需要搜索的问题

```javascript
await runAgent("2024年奥运会在哪里举办？");

// 输出示例：
// Thought: 我需要搜索2024年奥运会的信息
// Action: search("2024年奥运会举办地")
// Observation: mock result for: 2024年奥运会举办地
// Thought: 基于搜索结果，我可以回答
// Final: 2024年奥运会在巴黎举办
```

## 工具扩展

### 1. 添加计算器工具

```javascript
const tools = {
  search: async (query) => {
    return `搜索结果: ${query}`;
  },
  
  // 新增计算器工具
  calculator: async (expression) => {
    try {
      // 安全的数学表达式计算
      const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = Function(`"use strict"; return (${safeExpression})`)();
      return `计算结果: ${result}`;
    } catch (error) {
      return `计算错误: ${error.message}`;
    }
  }
};

// 更新系统提示
const SYSTEM_PROMPT = `
You are a ReAct agent.

Available tools:
- search(query: string): Search for information
- calculator(expression: string): Perform mathematical calculations

Format:
Thought: <reasoning>
Action: <tool_name>("input")
OR
Final: <answer>
`;

// 使用示例
await runAgent("计算 15 * 23 + 100");
```

### 2. 添加天气工具

```javascript
const tools = {
  // ... 其他工具
  
  weather: async (city) => {
    // 模拟天气 API 调用
    const weatherData = {
      "北京": "晴天，15-25°C",
      "上海": "多云，18-28°C", 
      "广州": "雨天，20-26°C"
    };
    
    return weatherData[city] || `无法获取${city}的天气信息`;
  }
};

// 使用示例
await runAgent("北京今天天气怎么样？");
```

### 3. 添加时间工具

```javascript
const tools = {
  // ... 其他工具
  
  getCurrentTime: async () => {
    return `当前时间: ${new Date().toLocaleString('zh-CN')}`;
  },
  
  getTimezone: async (city) => {
    const timezones = {
      "北京": "UTC+8",
      "纽约": "UTC-5",
      "伦敦": "UTC+0",
      "东京": "UTC+9"
    };
    
    return `${city}时区: ${timezones[city] || "未知"}`;
  }
};
```

## 高级模式

### 1. 智能体链 (Agent Chain)

```javascript
class AgentChain {
  constructor() {
    this.agents = [];
  }
  
  addAgent(name, agent) {
    this.agents.push({ name, agent });
  }
  
  async run(input) {
    let result = input;
    
    for (const { name, agent } of this.agents) {
      console.log(`\n=== ${name} 处理中 ===`);
      const response = await agent.run(result);
      result = response.final || response;
    }
    
    return result;
  }
}

// 使用示例
const chain = new AgentChain();

// 研究智能体
const researchAgent = createAgent([searchTool], "你是研究专家，负责收集信息");
chain.addAgent("研究员", researchAgent);

// 分析智能体  
const analysisAgent = createAgent([calculatorTool], "你是分析专家，负责数据分析");
chain.addAgent("分析师", analysisAgent);

// 总结智能体
const summaryAgent = createAgent([], "你是总结专家，负责整理结论");
chain.addAgent("总结员", summaryAgent);

await chain.run("分析2024年AI市场趋势");
```

### 2. 并行工具执行

```javascript
async function runAgentWithParallelTools(question, maxSteps = 5) {
  let history = `Question: ${question}\n`;

  for (let step = 0; step < maxSteps; step++) {
    const llmText = await callLLM(history);
    const { thought, actions, final } = parseParallelResponse(llmText);
    
    if (final) return { final, history };
    
    if (actions && actions.length > 0) {
      // 并行执行多个工具
      const results = await Promise.all(
        actions.map(async (action) => {
          const result = await tools[action.tool](action.input);
          return `${action.tool}: ${result}`;
        })
      );
      
      history += `Observations: ${results.join('; ')}\n`;
    }
  }
}

// 解析并行动作
function parseParallelResponse(text) {
  const thoughtMatch = text.match(/Thought:\s*(.*)/);
  const finalMatch = text.match(/Final:\s*(.*)/);
  
  // 解析多个动作
  const actionMatches = [...text.matchAll(/Action:\s*(\w+)\("(.*)"\)/g)];
  const actions = actionMatches.map(match => ({
    tool: match[1],
    input: match[2]
  }));
  
  return {
    thought: thoughtMatch?.[1],
    actions: actions.length > 0 ? actions : null,
    final: finalMatch?.[1]
  };
}
```

### 3. 记忆增强智能体

```javascript
class MemoryEnhancedAgent {
  constructor(llm, tools, maxMemory = 10) {
    this.llm = llm;
    this.tools = tools;
    this.shortTermMemory = [];
    this.longTermMemory = [];
    this.maxMemory = maxMemory;
  }
  
  addToMemory(type, content) {
    const memory = {
      type,
      content,
      timestamp: new Date(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.shortTermMemory.push(memory);
    
    // 管理记忆大小
    if (this.shortTermMemory.length > this.maxMemory) {
      const old = this.shortTermMemory.shift();
      this.longTermMemory.push(old);
    }
  }
  
  getRelevantMemory(query) {
    const allMemory = [...this.shortTermMemory, ...this.longTermMemory];
    
    return allMemory.filter(mem => 
      mem.content.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3); // 返回最相关的3条记忆
  }
  
  async run(input) {
    // 获取相关记忆
    const relevantMemory = this.getRelevantMemory(input);
    
    let prompt = input;
    if (relevantMemory.length > 0) {
      const memoryContext = relevantMemory
        .map(mem => `记忆: ${mem.content}`)
        .join('\n');
      prompt = `相关记忆:\n${memoryContext}\n\n当前问题: ${input}`;
    }
    
    // 记录问题
    this.addToMemory('question', input);
    
    // 运行智能体逻辑
    const result = await this.runReActLoop(prompt);
    
    // 记录答案
    this.addToMemory('answer', result.final);
    
    return result;
  }
}
```

## 实际应用

### 1. 客服智能体

```javascript
const customerServiceTools = {
  searchFAQ: async (question) => {
    const faq = {
      "退款": "退款需要7-14个工作日处理",
      "配送": "标准配送2-3天，加急配送1天",
      "售后": "产品享有1年质保服务"
    };
    
    for (const [key, value] of Object.entries(faq)) {
      if (question.includes(key)) {
        return `FAQ答案: ${value}`;
      }
    }
    
    return "未找到相关FAQ，请联系人工客服";
  },
  
  checkOrderStatus: async (orderId) => {
    // 模拟订单查询
    return `订单${orderId}状态: 已发货，预计明天到达`;
  }
};

const customerServicePrompt = `
你是专业的客服智能体，负责帮助客户解决问题。

可用工具:
- searchFAQ(question): 搜索常见问题
- checkOrderStatus(orderId): 查询订单状态

请友好、专业地回答客户问题。
`;

// 使用示例
const customerAgent = createAgent(customerServiceTools, customerServicePrompt);
await customerAgent.run("我的订单什么时候能到？订单号是12345");
```

### 2. 数据分析智能体

```javascript
const dataAnalysisTools = {
  loadData: async (source) => {
    // 模拟数据加载
    return `已加载数据源: ${source}，包含1000条记录`;
  },
  
  calculateStats: async (column) => {
    // 模拟统计计算
    return `${column}列统计: 平均值85.2, 最大值100, 最小值60`;
  },
  
  generateChart: async (type) => {
    return `已生成${type}图表，保存为chart.png`;
  }
};

const dataAnalysisPrompt = `
你是数据分析专家，帮助用户分析数据并生成报告。

可用工具:
- loadData(source): 加载数据
- calculateStats(column): 计算统计信息  
- generateChart(type): 生成图表

请提供专业的数据分析建议。
`;
```

### 3. 代码助手智能体

```javascript
const codeAssistantTools = {
  analyzeCode: async (code) => {
    // 简单的代码分析
    const lines = code.split('\n').length;
    const hasAsync = code.includes('async');
    const hasError = code.includes('try') && code.includes('catch');
    
    return `代码分析: ${lines}行代码, ${hasAsync ? '包含' : '不包含'}异步操作, ${hasError ? '有' : '无'}错误处理`;
  },
  
  suggestImprovement: async (issue) => {
    const suggestions = {
      "性能": "建议使用缓存、减少循环嵌套",
      "安全": "建议验证输入、使用HTTPS",
      "可读性": "建议添加注释、使用有意义的变量名"
    };
    
    return suggestions[issue] || "请提供具体的改进方向";
  }
};
```

## 测试和调试

### 1. 智能体测试框架

```javascript
class AgentTester {
  constructor(agent) {
    this.agent = agent;
    this.testCases = [];
  }
  
  addTest(name, input, expectedPattern) {
    this.testCases.push({ name, input, expectedPattern });
  }
  
  async runTests() {
    const results = [];
    
    for (const test of this.testCases) {
      try {
        const result = await this.agent.run(test.input);
        const passed = test.expectedPattern.test(result.final);
        
        results.push({
          name: test.name,
          passed,
          input: test.input,
          output: result.final
        });
      } catch (error) {
        results.push({
          name: test.name,
          passed: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

// 使用示例
const tester = new AgentTester(myAgent);
tester.addTest("数学计算", "计算 2+2", /4/);
tester.addTest("搜索功能", "搜索人工智能", /搜索|结果/);

const results = await tester.runTests();
console.log(results);
```

### 2. 调试工具

```javascript
class AgentDebugger {
  constructor(agent) {
    this.agent = agent;
    this.logs = [];
  }
  
  log(step, data) {
    this.logs.push({
      step,
      data,
      timestamp: new Date()
    });
  }
  
  async runWithDebug(input) {
    this.log('start', { input });
    
    try {
      const result = await this.agent.run(input);
      this.log('success', { result });
      return result;
    } catch (error) {
      this.log('error', { error: error.message });
      throw error;
    }
  }
  
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

这些示例展示了如何扩展和应用智能体框架。你可以根据具体需求选择合适的模式和工具！