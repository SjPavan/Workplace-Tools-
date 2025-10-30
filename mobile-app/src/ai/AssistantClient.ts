import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import {
  GenerateConfig,
  GenerateResult,
  LoadModelConfig,
  localModelManager,
} from './LocalModelManager';

export type AssistantResponse = GenerateResult & {
  source: 'local' | 'cloud';
};

export type AssistantRequest = GenerateConfig & {
  disableLocal?: boolean;
  localOnly?: boolean;
  loadConfig?: LoadModelConfig;
  endpoint?: string;
  headers?: Record<string, string>;
};

const DEFAULT_ENDPOINT = 'https://api.example.com/ai/respond';

function resolveLatencyThreshold(): number {
  const platform = Platform.OS;
  if (platform === 'android' || platform === 'ios') {
    return 5000;
  }
  return 2500;
}

async function isOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  const connected = Boolean(state.isConnected);
  const reachable = state.isInternetReachable;
  if (reachable === null || typeof reachable === 'undefined') {
    return !connected;
  }
  return !(connected && reachable);
}

export async function getAssistantResponse(request: AssistantRequest): Promise<AssistantResponse> {
  const {
    disableLocal = false,
    localOnly = false,
    loadConfig,
    endpoint = DEFAULT_ENDPOINT,
    headers = {},
    ...generateConfig
  } = request;

  if (!generateConfig.prompt.trim()) {
    throw new Error('Prompt is required');
  }

  const offline = await isOffline();
  const canUseLocal = !disableLocal && localModelManager.isSupported();
  const latencyBudget = resolveLatencyThreshold();

  if (canUseLocal) {
    try {
      const result = await localModelManager.generate(generateConfig, loadConfig);
      if (result.durationMs > latencyBudget) {
        console.warn(
          `[AssistantClient] Local response exceeded latency budget (${result.durationMs}ms > ${latencyBudget}ms)`
        );
      }
      return {
        ...result,
        source: 'local',
      };
    } catch (error) {
      if (localOnly) {
        throw error;
      }
      if (offline) {
        throw new Error(
          `Local inference failed while offline: ${(error as Error).message ?? error}`
        );
      }
      console.warn('[AssistantClient] Local inference failed, falling back to cloud', error);
    }
  } else if (localOnly) {
    throw new Error('Local model usage forced but the bridge is unavailable or disabled');
  } else if (offline) {
    throw new Error('Device is offline and local model usage is disabled');
  }

  if (offline) {
    throw new Error('Offline usage requires the local model to be enabled');
  }

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      prompt: generateConfig.prompt,
      maxTokens: generateConfig.maxTokens ?? 256,
      temperature: generateConfig.temperature ?? 0.7,
      topP: generateConfig.topP ?? 0.9,
      topK: generateConfig.topK ?? 40,
      stopSequences: generateConfig.stopSequences,
    }),
  });

  if (!response.ok) {
    const message = await safeReadBody(response);
    throw new Error(`Cloud inference failed (${response.status}): ${message}`);
  }

  const payload = await response.json().catch(() => ({}));
  const text: string = payload.text ?? payload.output ?? '';
  const tokensGenerated: number =
    payload.tokensGenerated ?? payload.usage?.total_tokens ?? payload.usage?.completion_tokens ?? 0;
  const finishedAt = Date.now();

  return {
    text,
    tokensGenerated,
    durationMs: finishedAt - startedAt,
    source: 'cloud',
  };
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch (error) {
    return String(error);
  }
}
