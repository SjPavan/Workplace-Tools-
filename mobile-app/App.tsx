import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getAssistantResponse } from './src/ai/AssistantClient';
import { localModelManager } from './src/ai/LocalModelManager';

const DEFAULT_PROMPT = 'Explain how on-device AI enhances privacy in less than three sentences.';

function App(): JSX.Element {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localEnabled, setLocalEnabled] = useState(true);
  const [source, setSource] = useState<'local' | 'cloud' | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    localModelManager.setEnabled(localEnabled);
  }, [localEnabled]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResponse('');
    setLatencyMs(null);
    setSource(null);

    let streamed = '';

    try {
      const result = await getAssistantResponse({
        prompt,
        disableLocal: !localEnabled,
        stream: true,
        onToken: (token) => {
          streamed += token;
          setResponse((prev) => prev + token);
        },
      });

      setSource(result.source);
      setLatencyMs(result.durationMs);

      if (!streamed && result.text) {
        setResponse(result.text);
      } else if (result.text && streamed && result.text.trim() !== streamed.trim()) {
        setResponse(result.text);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [localEnabled, prompt]);

  const handleToggle = useCallback(
    (value: boolean) => {
      setLocalEnabled(value);
    },
    [setLocalEnabled]
  );

  const formattedLatency = latencyMs !== null ? `${latencyMs.toFixed(0)} ms` : '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>On-device AI Assistant</Text>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Enable Local Model</Text>
            <Switch value={localEnabled} onValueChange={handleToggle} testID="local-model-toggle" />
          </View>
        </View>

        <Text style={styles.description}>
          Run small Phi-3-mini inference locally with llama.cpp for offline resilience. When disabled or unavailable, the
          assistant falls back to the cloud provider.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Prompt</Text>
          <TextInput
            multiline
            style={styles.promptInput}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask me something..."
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonLabel}>Generate</Text>}
        </TouchableOpacity>

        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultLabel}>Response</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Source: {source ?? '—'}</Text>
              <Text style={styles.metaText}>Latency: {formattedLatency}</Text>
            </View>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : <Text style={styles.resultText}>{response || '—'}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  description: {
    color: '#cbd5f5',
    fontSize: 16,
    lineHeight: 22,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    minHeight: 160,
    color: '#e2e8f0',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    color: '#64748b',
  },
  resultText: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 22,
  },
  errorText: {
    color: '#f97316',
    fontSize: 16,
    lineHeight: 22,
  },
});

export default App;
