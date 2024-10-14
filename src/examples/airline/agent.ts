import {
  escalateToAgent,
  initiateRefund,
  initiateFlightCredits,
  changeFlight,
  validToChangeFlight,
  initiateBaggageSearch,
  caseResolved,
} from './tools.js';
import {
  FLIGHT_CANCELLATION_POLICY,
  FLIGHT_CHANGE_POLICY,
  LOST_BAGGAGE_POLICY,
  TRIAGE_STARTER_PROMPT,
  LOST_BAGGAGE_STARTER_PROMPT,
  REFUND_CANCELLATION_STARTER_PROMPT,
  TRIAGE_SYSTEM_PROMPT,
} from './config.js';
import { Swarm, Agent } from '../../index.js';

function transferToFlightModification(): Agent {
  return flightModification;
}

function transferToFlightCancel(): Agent {
  return flightCancel;
}

function transferToFlightChange(): Agent {
  return flightChange;
}

function transferToLostBaggage(): Agent {
  return lostBaggage;
}

function transferToTriage(): Agent {
  /**
   * Call this function when a user needs to be transferred to a different agent and a different policy.
   * For instance, if a user is asking about a topic that is not handled by the current agent, call this function.
   */
  return triageAgent;
}

function triageInstructions(contextVariables: Record<string, any>): string {
  const customerContext = contextVariables.customerContext ?? null;
  const flightContext = contextVariables.flightContext ?? null;
  return `You are to triage a users request, and call a tool to transfer to the right intent.
    Once you are ready to transfer to the right intent, call the tool to transfer to the right intent.
    You dont need to know specifics, just the topic of the request.
    When you need more information to triage the request to an agent, ask a direct question without explaining why you're asking it.
    Do not share your thought process with the user! Do not make unreasonable assumptions on behalf of user.
    The customer context is here: ${customerContext}, and flight context is here: ${flightContext}`;
}

const triageAgent = new Agent({
  name: 'Triage Agent',
  instructions: TRIAGE_SYSTEM_PROMPT + triageInstructions,
  functions: [transferToFlightModification, transferToLostBaggage],
});

const flightModification = new Agent({
  name: 'Flight Modification Agent',
  instructions: `You are a Flight Modification Agent for a customer service airlines company.
      You are an expert customer service agent deciding which sub intent the user should be referred to.
You already know the intent is for flight modification related question. First, look at message history and see if you can determine if the user wants to cancel or change their flight.
Ask user clarifying questions until you know whether or not it is a cancel request or change flight request. Once you know, call the appropriate transfer function. Either ask clarifying questions, or call one of your functions, every time.`,
  functions: [transferToFlightCancel, transferToFlightChange],
});

const flightCancel = new Agent({
  name: 'Flight cancel traversal',
  instructions: REFUND_CANCELLATION_STARTER_PROMPT + FLIGHT_CANCELLATION_POLICY,
  functions: [
    escalateToAgent,
    initiateRefund,
    initiateFlightCredits,
    transferToTriage,
    caseResolved,
  ],
});

const flightChange = new Agent({
  name: 'Flight change traversal',
  instructions: TRIAGE_STARTER_PROMPT + FLIGHT_CHANGE_POLICY,
  functions: [
    escalateToAgent,
    changeFlight,
    validToChangeFlight,
    transferToTriage,
    caseResolved,
  ],
});

const lostBaggage = new Agent({
  name: 'Lost baggage traversal',
  instructions: LOST_BAGGAGE_STARTER_PROMPT + LOST_BAGGAGE_POLICY,
  functions: [
    escalateToAgent,
    initiateBaggageSearch,
    transferToTriage,
    caseResolved,
  ],
});

export async function exampleAgent() {
  console.log('this is the env : ', process.env.OPENAI_API_KEY);
  const swarm = new Swarm({
    apiKey: process.env.OPENAI_API_KEY!,
    clientType: 'openai',
  });

  swarm.run({
    agent: triageAgent,
    messages: [
      {
        role: 'user',
        content: 'I want to change my flight',
      },
    ],
    contextVariables: {
      customer_context: `Here is what you know about the customer's details:
1. CUSTOMER_ID: customer_12345
2. NAME: John Doe
3. PHONE_NUMBER: (123) 456-7890
4. EMAIL: johndoe@example.com
5. STATUS: Premium
6. ACCOUNT_STATUS: Active
7. BALANCE: $0.00
8. LOCATION: 1234 Main St, San Francisco, CA 94123, USA
`,
      flight_context: `The customer has an upcoming flight from LGA (Laguardia) in NYC to LAX in Los Angeles.
The flight # is 1919. The flight departure date is 3pm ET, 5/21/2024.`,
    },
  });
}

exampleAgent().catch((err) => {
  console.error(err);
});
