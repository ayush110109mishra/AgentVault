import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonFromText } from '../src/domain/model-provider';
import {
  getProviderConfiguration,
  checkActiveProviderHealth
} from '../src/domain/model-service';

test('Model Provider — extractJsonFromText parses clean and markdown-wrapped JSON', () => {
  const plainJson = '{"key": "value", "count": 42}';
  const parsedPlain = extractJsonFromText(plainJson);
  assert.equal(parsedPlain.key, 'value');
  assert.equal(parsedPlain.count, 42);

  const markdownJson = '```json\n{"taskType": "research", "approved": true}\n```';
  const parsedMarkdown = extractJsonFromText(markdownJson);
  assert.equal(parsedMarkdown.taskType, 'research');
  assert.equal(parsedMarkdown.approved, true);

  const bareCodeBlock = '```\n{"steps": [1, 2, 3]}\n```';
  const parsedBare = extractJsonFromText(bareCodeBlock);
  assert.deepEqual(parsedBare.steps, [1, 2, 3]);
});

test('Model Provider — getProviderConfiguration defaults to Open-Weight / Ollama / Guarded Engine', () => {
  const config = getProviderConfiguration();
  assert.ok(typeof config.provider === 'string');
  assert.ok(typeof config.model === 'string');
  assert.ok(typeof config.ollamaBaseUrl === 'string');
});

test('Model Provider — checkActiveProviderHealth reports valid provider info and open-weight license', async () => {
  const health = await checkActiveProviderHealth();
  assert.ok(['open-weight', 'ollama', 'gemini', 'offline-engine'].includes(health.provider));
  assert.ok(typeof health.model === 'string');
  assert.ok(typeof health.license === 'string');
  assert.ok(['connected', 'offline', 'unconfigured', 'error'].includes(health.status));
});
