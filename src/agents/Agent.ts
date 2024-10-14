import type { AgentFunction } from '../types.js';

export class Agent {
  name: string;
  instructions: string | ((contextVariables: Record<string, any>) => string);
  functions: AgentFunction[];
  model: string;
  toolChoice: any;
  parallelToolCalls: number;

  constructor(config: {
    name: string;
    instructions: string | ((contextVariables: Record<string, any>) => string);
    functions?: AgentFunction[];
    model?: string;
    toolChoice?: any;
    parallelToolCalls?: number;
  }) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.functions = config.functions || [];
    this.model = config.model || 'gpt-3.5-turbo';
    this.toolChoice = config.toolChoice || 'auto';
    this.parallelToolCalls = config.parallelToolCalls || 1;
  }
}
