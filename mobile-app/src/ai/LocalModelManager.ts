import { AppState, AppStateStatus, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { EmitterSubscription } from 'react-native';

const { LlamaBridge } = NativeModules as {
  LlamaBridge?: {
    loadModel?: (config: Record<string, unknown>) => Promise<void>;
    unloadModel?: () => Promise<void>;
    generate?: (config: Record<string, unknown>) => Promise<string>;
    streamGenerate?: (config: Record<string, unknown>) => Promise<void>;
    cancel?: () => Promise<void>;
    getBatteryLevel?: () => Promise<number>;
  };
};

export interface AbortSignalLike {
  aborted: boolean;
  addEventListener: (type: 'abort', listener: () => void) => void;
  removeEventListener: (type: 'abort', listener: () => void) => void;
}

export type LoadModelConfig = {
  modelPath?: string;
  contextLength?: number;
  gpuLayers?: number;
  batchSize?: number;
  threads?: number;
  minBatteryLevel?: number;
};

export type GenerateConfig = {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  stream?: boolean;
  signal?: AbortSignalLike;
  onToken?: (token: string) => void;
};

export type GenerateResult = {
  text: string;
  durationMs: number;
  tokensGenerated: number;
};

const DEFAULT_MODEL_PATH = Platform.select({
  ios: 'models/phi-3-mini-4k-instruct-q4.gguf',
  android: 'models/phi-3-mini-4k-instruct-q4.gguf',
  default: 'models/phi-3-mini-4k-instruct-q4.gguf',
});

const DEFAULT_CONTEXT = 4096;
const DEFAULT_GPU_LAYERS = Platform.select({ ios: 2, android: 2, default: 0 });

export class LocalModelManager {
  private static shared?: LocalModelManager;

  static getInstance(): LocalModelManager {
    if (!this.shared) {
      this.shared = new LocalModelManager();
    }
    return this.shared;
  }

  private loaded = false;
  private loadingPromise: Promise<void> | null = null;
  private enabled = true;
  private lastConfig: LoadModelConfig | null = null;
  private subscriptions: EmitterSubscription[] = [];
  private emitter: NativeEventEmitter | null = LlamaBridge ? new NativeEventEmitter(LlamaBridge) : null;

  private constructor() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  isSupported(): boolean {
    return Boolean(LlamaBridge?.loadModel && LlamaBridge?.generate);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      void this.unload();
    }
  }

  async ensureLoaded(config: LoadModelConfig = {}): Promise<void> {
    if (!this.enabled) {
      throw new Error('Local model disabled by user preference');
    }
    if (this.loaded) {
      return;
    }
    if (!this.loadingPromise) {
      this.loadingPromise = this.loadModel(config);
    }
    return this.loadingPromise;
  }

  private async loadModel(config: LoadModelConfig): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Local llama bridge is not available');
    }

    const minBatteryLevel = config.minBatteryLevel ?? 0.2;
    if (typeof LlamaBridge?.getBatteryLevel === 'function') {
      try {
        const batteryLevel = await LlamaBridge.getBatteryLevel();
        if (typeof batteryLevel === 'number' && batteryLevel < minBatteryLevel) {
          throw new Error('Battery level below minimum threshold for local inference');
        }
      } catch (error) {
        console.warn('[LocalModelManager] Unable to read battery level', error);
      }
    }

    const payload = {
      modelPath: config.modelPath ?? DEFAULT_MODEL_PATH,
      contextLength: config.contextLength ?? DEFAULT_CONTEXT,
      gpuLayers: config.gpuLayers ?? DEFAULT_GPU_LAYERS,
      batchSize: config.batchSize ?? 512,
      threads: config.threads,
    };

    await LlamaBridge!.loadModel!(payload);
    this.lastConfig = config;
    this.loaded = true;
  }

  async unload(): Promise<void> {
    if (!this.loaded) {
      this.loadingPromise = null;
      return;
    }
    try {
      await LlamaBridge?.unloadModel?.();
    } finally {
      this.loaded = false;
      this.loadingPromise = null;
      this.lastConfig = null;
      this.removeAllSubscriptions();
    }
  }

  async generate(config: GenerateConfig, loadConfig: LoadModelConfig = {}): Promise<GenerateResult> {
    const startedAt = Date.now();

    await this.ensureLoaded({ ...this.lastConfig, ...loadConfig });

    if (config.signal?.aborted) {
      throw new Error('Request aborted');
    }

    const payload = {
      prompt: config.prompt,
      maxTokens: config.maxTokens ?? 256,
      temperature: config.temperature ?? 0.7,
      topP: config.topP ?? 0.9,
      topK: config.topK ?? 40,
      stopSequences: config.stopSequences ?? ['</s>'],
    };

    if (config.stream && typeof config.onToken === 'function') {
      if (!LlamaBridge?.streamGenerate || !this.emitter) {
        console.warn('[LocalModelManager] streamGenerate is not supported by native module, falling back to non-streaming');
      } else {
        const subscription = this.emitter.addListener('llamaToken', (event: { token: string }) => {
          config.onToken?.(event.token);
        });
        this.subscriptions.push(subscription);

        const executeStream = async () => {
          await LlamaBridge.streamGenerate?.({ ...payload, stream: true });
        };

        if (config.signal) {
          const abortListener = () => {
            void LlamaBridge?.cancel?.();
          };
          config.signal.addEventListener('abort', abortListener);
          try {
            await executeStream();
          } finally {
            config.signal.removeEventListener('abort', abortListener);
            this.dropSubscription(subscription);
          }
        } else {
          try {
            await executeStream();
          } finally {
            this.dropSubscription(subscription);
          }
        }
        const finishedAt = Date.now();
        return {
          text: '',
          durationMs: finishedAt - startedAt,
          tokensGenerated: 0,
        };
      }
    }

    if (config.signal) {
      const abortListener = () => {
        void LlamaBridge?.cancel?.();
      };
      config.signal.addEventListener('abort', abortListener);
      try {
        const response = await LlamaBridge?.generate?.(payload);
        const finishedAt = Date.now();
        return {
          text: response ?? '',
          durationMs: finishedAt - startedAt,
          tokensGenerated: this.estimateTokens(response ?? ''),
        };
      } finally {
        config.signal.removeEventListener('abort', abortListener);
      }
    }

    const response = await LlamaBridge?.generate?.(payload);
    const finishedAt = Date.now();
    return {
      text: response ?? '',
      durationMs: finishedAt - startedAt,
      tokensGenerated: this.estimateTokens(response ?? ''),
    };
  }

  private handleAppStateChange = (status: AppStateStatus) => {
    if (status !== 'active') {
      void this.unload();
    }
  };

  private estimateTokens(text: string): number {
    if (!text) {
      return 0;
    }
    const approxTokens = Math.ceil(text.trim().split(/\s+/).length * 1.3);
    return approxTokens;
  }

  private dropSubscription(subscription: EmitterSubscription) {
    subscription.remove();
    this.subscriptions = this.subscriptions.filter((item) => item !== subscription);
  }

  private removeAllSubscriptions() {
    this.subscriptions.forEach((subscription) => subscription.remove());
    this.subscriptions = [];
  }
}

export const localModelManager = LocalModelManager.getInstance();
