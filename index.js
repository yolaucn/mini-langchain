import { readFileSync } from "fs";

// 手动加载 .env 文件
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

const SYSTEM_PROMPT = `
You are a ReAct agent.

You must respond ONLY in this format:

Thought: <your resoning>
Action: <tool_name>("input")

OR, if finished:

Thought: <your reasoing>
Final: <final answer>

Available tools:
- search(query: string)
`;

const tools = {
  search: async (query) => {
    // mock : 可以换成真实api
    return `mock result for : ${query}`;
  },
};

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

async function runAgent(question, maxSteps = 5) {
  let history = `Question: ${question}\n`;

  for (let step = 0; step < maxSteps; step++) {
    console.log(`\n============= STEP ${step} ====================`);
    console.log("\n[HISTORY SENT TO LLM]\n" + history);

    const llmText = await callLLM(history);
    console.log("\nLLM OUTPUT:\n", llmText);

    const { thought, action, final } = parseResponse(llmText);

    // 把 thought 记录进 history （可选：生产环境通常不记录 thought)
    if (thought) history += `Thought: ${thought}\n`;

    // 如果 LLM 给 Final，结束
    if (final) {
      history += `Final: ${final}\n`;
      console.log("\n[FINAL]\n", final);
      return { final, history };
    }

    // 否则必须有action
    if (!action) throw new Error("LLM did not return Action or Final.");

    history += `Action: ${action.tool}("${action.input}")\n`;

    const toolFn = tools[action.tool];
    if (!toolFn) throw new Error(`Unknown tool:" ${action.tool}`);

    // 工具运行在你的服务器/本机 Node 运行时
    const observation = await toolFn(action.input);

    // 把 observation 追加进 history
    history += `Observation: ${observation}\n`;
  }

  throw new Error("Max steps reached");
}

async function callLLM(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  const data = await res.json();

  return data.choices[0].message.content;
}

runAgent("你的钱藏在哪里");
