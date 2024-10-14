export function escalateToAgent(reason?: string): string {
  return reason ? `Escalating to agent: ${reason}` : 'Escalating to agent';
}

export function validToChangeFlight(): string {
  return 'Customer is eligible to change flight';
}

export function changeFlight(): string {
  return 'Flight was successfully changed!';
}

export function initiateRefund(): string {
  const status = 'Refund initiated';
  return status;
}

export function initiateFlightCredits(): string {
  const status = 'Successfully initiated flight credits';
  return status;
}

export function caseResolved(): string {
  return 'Case resolved. No further questions.';
}

export function initiateBaggageSearch(): string {
  return 'Baggage was found!';
}
