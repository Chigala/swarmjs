import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { Agent } from './Agent.js';
import type {
  AIClient,
  ChatCompletionMessage,
  Response,
  Result,
} from '../types.js';
import { functionToJson, debugPrint } from '../utils.js';
import type { ChatCompletionMessageToolCall } from '../types.js';

const __CTX_VARS_NAME__ = 'contextVariables';

export class Swarm {
  private client: AIClient;
  private clientType: 'openai' | 'anthropic';

  constructor(config: { apiKey: string; clientType: 'openai' | 'anthropic' }) {
    this.clientType = config.clientType;
    if (this.clientType === 'openai') {
      this.client = new OpenAI({ apiKey: config.apiKey });
    } else {
      this.client = new Anthropic({ apiKey: config.apiKey });
    }
  }

  async run(config: {
    agent: Agent;
    messages: ChatCompletionMessage[];
    contextVariables?: Record<string, any>;
    modelOverride?: string;
    stream?: boolean;
    debug?: boolean;
    maxTurns?: number;
    executeTools?: boolean;
  }): Promise<Response> {
    let activeAgent = config.agent;
    const contextVariables = { ...config.contextVariables };
    const history = [...config.messages];
    const initLen = history.length;
    const maxTurns = config.maxTurns || Infinity;
    const debug = config.debug || false;
    const executeTools = config.executeTools !== false;

    console.log('this is the history: ', history);

    while (history.length - initLen < maxTurns) {
      const completion = await this.getChatCompletion(
        activeAgent,
        history,
        contextVariables,
        config.modelOverride,
        config.stream || false,
        debug,
      );
      console.log('this is the completion: ', completion);

      console.log(
        'completion: ',
        JSON.stringify(completion.choices[0].message, null, 2),
      );
      const message = completion.choices[0].message!;
      debugPrint(debug, 'Received completion:', message);
      message.name = activeAgent.name;
      //   message.tool_call_id = message.tool_calls?.[0]?.id;
      history.push(message);

      if ((!message.function_call && !message.tool_calls) || !executeTools) {
        debugPrint(debug, 'Ending turn.');
        break;
      }

      const toolCalls =
        message.tool_calls ||
        (message.function_call ? [{ function: message.function_call }] : []);

      const partialResponse = this.handleToolCalls(
        toolCalls,
        activeAgent.functions,
        contextVariables,
        debug,
      );

      history.push(...partialResponse.messages);
      Object.assign(contextVariables, partialResponse.contextVariables);
      if (partialResponse.agent) {
        activeAgent = partialResponse.agent;
      }
    }

    return {
      messages: history.slice(initLen),
      agent: activeAgent,
      contextVariables,
    };
  }

  private async getChatCompletion(
    agent: Agent,
    history: ChatCompletionMessage[],
    contextVariables: Record<string, any>,
    modelOverride: string | undefined,
    stream: boolean,
    debug: boolean,
  ): Promise<any> {
    const instructions =
      typeof agent.instructions === 'function'
        ? agent.instructions(contextVariables)
        : agent.instructions;

    const messages = [{ role: 'system', content: instructions }, ...history];

    debugPrint(debug, 'Getting chat completion for...:', messages);

    const tools = agent.functions.map((f) => functionToJson(f));
    tools.forEach((tool) => {
      const params = tool.function?.parameters;
      if (params) {
        delete params.properties[__CTX_VARS_NAME__];
        if (params.required) {
          params.required = params.required.filter(
            (p: string) => p !== __CTX_VARS_NAME__,
          );
        }
      }
    });
    // Function to sanitize name
    function sanitizeName(name: string): string {
      return name.replace(/[^a-za-z0-9_-]/g, '_');
    }

    // Sanitize names in messages
    const sanitizedMessages = messages.map((message) => {
      if (message.name) {
        return { ...message, name: sanitizeName(message.name) };
      }
      return message;
    });

    const createParams: any = {
      model: modelOverride || agent.model,
      messages: sanitizedMessages,
      tools: tools.length > 0 ? tools : undefined,
      stream,
    };

    if (this.clientType === 'openai') {
      return (this.client as OpenAI).chat.completions.create(createParams);
    } else {
      return (this.client as Anthropic).messages.create(createParams);
    }
  }

  private handleFunctionResult(result: any, debug: boolean): Result {
    if (result instanceof Agent) {
      return {
        value: JSON.stringify({ assistant: result.name }),
        agent: result,
      };
    }

    if (typeof result === 'object' && 'value' in result) {
      return result as Result;
    }

    try {
      return { value: String(result) };
    } catch (e) {
      const errorMessage = `Failed to cast response to string: ${result}. Make sure agent functions return a string or Result object. Error: ${e}`;
      debugPrint(debug, errorMessage);
      throw new TypeError(errorMessage);
    }
  }

  private handleToolCalls(
    toolCalls: ChatCompletionMessageToolCall[],
    functions: Function[],
    contextVariables: Record<string, any>,
    debug: boolean,
  ): Response {
    const functionMap = new Map(functions.map((f) => [f.name, f]));
    const partialResponse: Response = {
      messages: [],
      agent: null,
      contextVariables: {},
    };

    for (const toolCall of toolCalls) {
      const name = toolCall.function.name;
      if (!functionMap.has(name)) {
        debugPrint(debug, `Tool ${name} not found in function map.`);
        partialResponse.messages.push({
          role: 'tool',
          content: `Error: Tool ${name} not found.`,
          name: toolCall.id,
        });
        continue;
      }

      const args = JSON.parse(toolCall.function.arguments);
      debugPrint(debug, `Processing tool call: ${name} with arguments ${args}`);

      const func = functionMap.get(name)!;
      if (func.length > 0 && __CTX_VARS_NAME__ in args) {
        args[__CTX_VARS_NAME__] = contextVariables;
      }

      const rawResult = func(...Object.values(args));
      const result = this.handleFunctionResult(rawResult, debug);

      partialResponse.messages.push({
        role: 'tool',
        content: result.value,
        name: toolCall.id,
        tool_call_id: toolCall.id,
      });

      Object.assign(
        partialResponse.contextVariables,
        result.contextVariables || {},
      );
      if (result.agent) {
        partialResponse.agent = result.agent;
      }
    }

    return partialResponse;
  }
}
