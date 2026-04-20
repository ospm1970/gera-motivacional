import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  __resetOpenAiTestDoubles,
  __setOpenAiClientForTests,
  __setOpenAiFactoryForTests,
  __createDefaultOpenAiClientForTests,
  generateSatiricalPhrase,
} from '../satiricalGenerator.js';

const nativeConsoleError = console.error;
const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

process.env.OPENAI_API_KEY = originalOpenAiApiKey || 'dummy-key';
const bootstrapClient = __createDefaultOpenAiClientForTests();
void bootstrapClient;
__resetOpenAiTestDoubles();

if (originalOpenAiApiKey === undefined) {
  delete process.env.OPENAI_API_KEY;
} else {
  process.env.OPENAI_API_KEY = originalOpenAiApiKey;
}

beforeEach(() => {
  __resetOpenAiTestDoubles();
});

afterEach(() => {
  __resetOpenAiTestDoubles();
  console.error = nativeConsoleError;

  if (originalOpenAiApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  }
});


test('satiricalGenerator executa a factory padrão antes e depois do reset', async () => {
  process.env.OPENAI_API_KEY = 'dummy-key';

  const firstClient = __createDefaultOpenAiClientForTests();
  assert.ok(firstClient);

  __resetOpenAiTestDoubles();
  const secondClient = __createDefaultOpenAiClientForTests();
  assert.ok(secondClient);
});

test('satiricalGenerator cria o cliente sob demanda e sanitiza a resposta', async () => {
  __setOpenAiFactoryForTests(() => ({
    chat: {
      completions: {
        async create() {
          return {
            choices: [{ message: { content: '<script>alert(1)</script>Sátira elegante' } }],
          };
        },
      },
    },
  }));

  const phrase = await generateSatiricalPhrase(['foco', 'disciplina', 'coragem']);
  assert.equal(phrase, 'Sátira elegante');
});

test('satiricalGenerator reutiliza cliente injetado e lança erro padronizado com choices vazias', async () => {
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));

  __setOpenAiClientForTests({
    chat: {
      completions: {
        async create() {
          return { choices: [] };
        },
      },
    },
  });

  await assert.rejects(
    () => generateSatiricalPhrase(['foco', 'disciplina', 'coragem']),
    /Falha ao gerar frase satírica\./
  );

  assert.ok(errors.some(message => message.includes('Resposta inválida do ChatGPT')));
});

test('satiricalGenerator lança erro padronizado quando a chamada externa falha', async () => {
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));

  __setOpenAiClientForTests({
    chat: {
      completions: {
        async create() {
          throw new Error('falha de rede');
        },
      },
    },
  });

  await assert.rejects(
    () => generateSatiricalPhrase(['foco', 'disciplina', 'coragem']),
    /Falha ao gerar frase satírica\./
  );

  assert.ok(errors.some(message => message.includes('falha de rede')));
});
