interface ParameterInfo {
  type: string;
}

// This is the signature of the function that will be used in the LLM(matches what the llm expects)
interface FunctionSignature {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ParameterInfo>;
      required: string[];
    };
  };
}

export function functionToJson(func: Function): FunctionSignature {
  if (typeof func !== 'function') {
    throw new Error('Input must be a function');
  }

  const funcStr = func.toString();
  const name = func.name || 'anonymous';
  const params = funcStr
    .slice(funcStr.indexOf('(') + 1, funcStr.indexOf(')'))
    .split(',')
    .map((p) => p.trim());

  const parameters: Record<string, ParameterInfo> = {};
  const required: string[] = [];

  params.forEach((param) => {
    const [paramName, defaultValue] = param.split('=');
    if (paramName) {
      const trimmedParamName = paramName.trim();
      parameters[trimmedParamName] = { type: 'string' };
      if (defaultValue === undefined) {
        required.push(trimmedParamName);
      }
    }
  });

  return {
    type: 'function',
    function: {
      name,
      description:
        func
          .toString()
          .match(/\/\*\*([\s\S]*?)\*\//)?.[1]
          ?.trim() || '',
      parameters: {
        type: 'object',
        properties: parameters,
        required,
      },
    },
  };
}

export function debugPrint(debug: boolean, ...args: any[]) {
  if (debug) {
    console.log(...args);
  }
}
export function mergeChunk(chunk: string, current: string) {
  return current.replace(/\n$/, '') + chunk;
}
