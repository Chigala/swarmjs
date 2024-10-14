# Swarm.js (Node.js Implementation of OpenAI Swarm)

Swarm.js is a Node.js implementation of OpenAI's experimental Swarm framework[https://github.com/openai/swarm]. Also following this cookbook from OpenAI[https://cookbook.openai.com/examples/orchestrating_agents]. I took some inspiration from both the repo and the cookbook to create my own Node.js implementation of Swarm. This library also supports anthropic sdk, so you are not limited to just using openai.

## Install

You can install the Swarm.js library via npm:

```bash
npm install node-swarmjs
```

## What is Swarm.js?

Swarm.js focuses on multi-agent coordination and execution by defining lightweight agents that can carry out tasks and hand off conversations when necessary. Heavily inspired by OpenAI's Python Swarm framework, this Node.js implementation allows developers to build multi-agent systems that are highly customizable, scalable, and easy to use.

### Warning

This is currently in the early stages of development and is not yet ready for production use. There are no tests and some of the core functionality is missing(e.g. this doesn't yet support streaming responses from agents).

## Usage

Swarm.js makes it easy to define agents, assign them tasks, and manage interactions between them. Below is a simple example demonstrating how to create and orchestrate two agents.

```javascript
import { Swarm, Agent } from 'node-swarmjs';

 const client = new Swarm({
    apiKey: process.env.OPENAI_API_KEY,
    clientType: 'openai'// can also be anthropic,
  });

// define the agents
  function transferToAgentB()  {
    return agentB;
  }

  const agentA = new Agent({
    name: 'Agent A',
    instructions: 'You are a helpful agent',
    functions: [transferToAgentB],
  });

  const agentB = new Agent({
    name: 'Agent B',
    instructions: 'Only speak in Haiku.',
  });

  // run the conversation with agentA
  (async () => {
  try {
    const response = await client.run({
      agent: agentA,
      messages: [{ role: "user", content: "I want to talk to agent B." }]
    });

    console.log(response.messages[response.messages.length - 1].content);
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
```

## Example with Anthropic

```javascript
import { Swarm, Agent } from 'node-swarmjs';

const client = new Swarm({
  apiKey: process.env.ANTHROPIC_API_KEY,
  clientType: 'anthropic',
});

function transferToAgentB() {
  return agentB;
}

const agentA = new Agent({
  name: 'Agent A',
  instructions: 'You are a helpful agent',
  functions: [transferToAgentB],
});

const agentB = new Agent({
  name: 'Agent B',
  instructions: 'Only speak in Haiku.',
});

(async () => {
  try {
    const response = await client.run({
      agent: agentA,
      messages: [{ role: 'user', content: 'I want to talk to agent B.' }],
    });

    console.log(response.messages[response.messages.length - 1].content);
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
```

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

## Roadmap

### Core Functionality

- [ ] Expand LLM Support
  - [ ] Integrate with Hugging Face models
  - [x] Add support for Anthropic
  - [ ] Implement Azure OpenAI Service integration
- [ ] Enhance Agent Capabilities
  - [ ] Implement streaming responses from agents
  - [ ] Develop context passing mechanism between agents
  - [ ] Create advanced conversation routing logic
  - [ ] Add support for concurrent agent execution

### Integration and Tools

- [ ] LangChain Integration
  - [ ] Implement support for LangChain tools
  - [ ] Create adapters for LangChain agents
- [ ] UI Components
  - [ ] Develop drop-in React components for easy UI integration
- [ ] Database Connectors
  - [ ] Add support for vector databases (e.g., Pinecone, Weaviate)
  - [ ] Implement connectors for relational databases
- [ ] CLI
  - [ ] Add a CLI for easy setup of agents(ideally use be able to bootstrap your agents from a CLI inside your NextJS app, or express server)

### Reliability and Performance

- [ ] Implement Retry Mechanism
  - [ ] Add exponential backoff for failed requests
- [ ] Optimize Performance
  - [ ] Implement caching layer for frequent requests
  - [ ] Add support for batch processing of tasks

### Developer Experience

- [ ] Expand Documentation
  - [ ] Create comprehensive API reference
  - [ ] Write step-by-step tutorials for common use cases
- [ ] Improve Testing
  - [ ] Increase unit test coverage to 80%(currently there are no tests)
  - [ ] Add performance benchmarks

### Examples and Use Cases

- [ ] Develop Example Projects
  - [ ] Create a customer support chatbot example
  - [ ] Build a multi-agent collaborative task solver
  - [ ] Implement a document analysis and summarization system

### Community and Ecosystem

- [ ] Improve Contribution Process
  - [ ] Develop contributor guidelines
  - [ ] Set up automated code quality checks for pull requests
