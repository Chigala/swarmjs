import type OpenAI from 'openai';
import type { Agent } from './agents/Agent.js';
import type Anthropic from '@anthropic-ai/sdk';

export interface ChatCompletionMessage {
  role: string;
  content: string;
  name?: string;
  tool_call_id?: string;
}
export interface ChatCompletionMessageToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Response {
  messages: ChatCompletionMessage[];
  agent: Agent | null;
  contextVariables: Record<string, any>;
}

export interface Result {
  value: string;
  agent?: Agent;
  contextVariables?: Record<string, any>;
}

export type AIClient = OpenAI | Anthropic;

export type AgentFunction = (...args: any[]) => any;
