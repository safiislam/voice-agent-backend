import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { AIMessage, createAgent, HumanMessage, ToolMessage } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from './config/config.js';
import { MemorySaver } from '@langchain/langgraph';
import { systemPrompt } from './prompt/agentPrompt.js';
import { AssemblyAISTT } from './assemblyai/stt.js';
import { life, writeableIterator } from './utils.js';
import type { VoiceAgentEvent } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import { CartesiaTTS } from './cartesia/tts.js';
import { iife } from '@langchain/core/messages';
import type { WSContext } from 'hono/ws';
import { tavilySearchTool } from './tool/tavilySearchTool.js';
const app = new Hono()
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use("/*", cors());


const agent = createAgent({
  model: new ChatGoogleGenerativeAI({
    apiKey: config.GIMINI_API_KEY,
    model: "gemini-2.5-flash",
  }),
  tools: [tavilySearchTool],
  checkpointer: new MemorySaver(),
  systemPrompt: systemPrompt,
});



app.get('/', (c) => {
  return c.text('voice agent server 2')
})

async function* sttStream(audioStream: AsyncIterable<Uint8Array>): AsyncGenerator<VoiceAgentEvent> {
  const stt = new AssemblyAISTT({
    apiKey: config.AssemblyAISTT_API_KEY,
    sampleRate: 16000
  })
  // console.log(stt)
  const passthrough = writeableIterator<VoiceAgentEvent>()

  const producer = life(async () => {
    try {
      for await (const audioChunk of audioStream) {
        await stt.sendAudio(audioChunk)
      }
    } finally {
      await stt.close();
    }
  })

  const consumer = life(async () => {
    for await (const event of stt.receiveEvents()) {
      passthrough.push(event)
    }
  })
  try {
    yield* passthrough;
  } finally {
    await Promise.all([producer, consumer]);
  }
}

async function* agentStream(eventStream: AsyncIterable<VoiceAgentEvent>): AsyncGenerator<VoiceAgentEvent> {
  const threadId = uuidv4();

  for await (const event of eventStream) {
    yield event
    if (event.type === 'stt_output') {
      const stream = await agent.stream(
        {
          messages: [new HumanMessage(event.transcript)]
        }, {
        configurable: { thread_id: threadId },
        streamMode: 'messages'
      }
      )
      for await (const [message] of stream) {
        if (AIMessage.isInstance(message) && message.tool_calls) {
          yield { type: "agent_chunk", text: message.text, ts: Date.now() }
          for (const toolCall of message.tool_calls) {
            yield {
              type: "tool_call",
              id: toolCall.id ?? uuidv4(),
              name: toolCall.name,
              args: toolCall.args,
              ts: Date.now(),
            };
          }
        }
        if (ToolMessage.isInstance(message)) {
          yield {
            type: "tool_result",
            toolCallId: message.tool_call_id ?? "",
            name: message.name ?? "unknown",
            result:
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content),
            ts: Date.now(),
          };
        }
      }
      yield { type: "agent_end", ts: Date.now() };
    }
  }
}

async function* ttsStream(eventStream: AsyncIterable<VoiceAgentEvent>): AsyncGenerator<VoiceAgentEvent> {
  const tts = new CartesiaTTS({
    apiKey: config.CartesiaTTS_API_KEY,
    voiceId: "f6ff7c0c-e396-40a9-a70b-f7607edb6937"
  })
  const passthrough = writeableIterator<VoiceAgentEvent>();
  const producer = iife(async () => {
    try {
      let buffer: string[] = [];
      for await (const event of eventStream) {
        passthrough.push(event);
        if (event.type === "agent_chunk") {
          buffer.push(event.text);
        }
        if (event.type === "agent_end") {
          await tts.sendText(buffer.join(""));
          buffer = [];
        }
      }
    } finally {
      await tts.close();
    }
  });
  const consumer = iife(async () => {
    for await (const event of tts.receiveEvents()) {
      passthrough.push(event);
    }
  });
  try {
    yield* passthrough;
  } finally {
    await Promise.all([producer, consumer]);
  }
}
app.get("/ws",
  upgradeWebSocket(async () => {
    let currentSocket: WSContext<WebSocket> | undefined
    const inputStream = writeableIterator<Uint8Array>()

    const transcriptEventStream = sttStream(inputStream)
    const agentEventStream = agentStream(transcriptEventStream);
    const outputEventStream = ttsStream(agentEventStream);
    const flushPromise = life(async () => {
      for await (const event of outputEventStream) {
        currentSocket?.send(JSON.stringify(event))
      }
    })
    // console.log(await flushPromise)
    // console.log(flushPromise)

    return {
      onOpen(_, ws) {
        currentSocket = ws as unknown as WSContext<WebSocket>
      },
      onMessage(event) {
        const data = event.data
        if (Buffer.isBuffer(data)) {
          inputStream.push(new Uint8Array(data))
        }
        else if (data instanceof ArrayBuffer) {
          inputStream.push(new Uint8Array(data))
        }
      },
      async onClose() {
        inputStream.cancel()
        await flushPromise
      }
    }

  })

)

const server = serve({
  fetch: app.fetch,
  port: Number(config.PORT) || 8000,
});

injectWebSocket(server)
console.log(`Server is running on port ${config.PORT || 8000}`);

// export default app
