#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const prompt = process.argv[2] ?? 'Summarise on-device AI advantages.';
const maxTokens = process.env.MAX_TOKENS ?? '128';
const modelPath = process.env.PHI3_MODEL_PATH ?? path.resolve(__dirname, '../models/phi-3-mini-4k-instruct-q4.gguf');
const binary = process.env.LLAMA_CPP_CLI ?? path.resolve(__dirname, '../../llama.cpp/main');

if (!fs.existsSync(binary)) {
  console.error(`llama.cpp CLI not found at ${binary}. Set LLAMA_CPP_CLI to the compiled binary.`);
  process.exit(1);
}

if (!fs.existsSync(modelPath)) {
  console.error(`Phi-3-mini model not found at ${modelPath}. Set PHI3_MODEL_PATH to the GGUF file.`);
  process.exit(1);
}

const args = ['-m', modelPath, '-n', maxTokens, '-p', prompt];
const startedAt = Date.now();

const job = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });

let output = '';
job.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stdout.write(text);
});

job.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

job.on('close', (code) => {
  const durationSec = (Date.now() - startedAt) / 1000;
  const normalized = output.slice(0, 160).replace(/\s+/g, ' ');
  console.log('\n--- Benchmark Summary ---');
  console.log(`Elapsed: ${durationSec.toFixed(2)}s`);
  console.log(`Tokens requested: ${maxTokens}`);
  console.log(`Model: ${modelPath}`);
  console.log(`Prompt: ${prompt}`);
  console.log(`Output preview: ${normalized}${output.length > 160 ? '…' : ''}`);

  if (durationSec > 5) {
    console.error('❌ Offline latency exceeds 5s acceptance threshold.');
    process.exit(code || 1);
  } else if (code && code !== 0) {
    process.exit(code);
  } else {
    console.log('✅ Offline latency within 5s acceptance threshold.');
    process.exit(0);
  }
});
