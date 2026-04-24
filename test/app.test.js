import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

const nativeFetch = global.fetch;
const nativeConsoleError = console.error;
const nativeDocument = global.document;

class FakeClassList {
  constructor(initial = []) {
    this.tokens = new Set(initial);
  }

  add(...names) {
    names.forEach(name => this.tokens.add(name));
  }

  remove(...names) {
    names.forEach(name => this.tokens.delete(name));
  }

  contains(name) {
    return this.tokens.has(name);
  }
}

class FakeElement {
  constructor(id, { hidden = false } = {}) {
    this.id = id;
    this.listeners = new Map();
    this.classList = new FakeClassList(hidden ? ['hidden'] : []);
    this.resetState();
  }

  resetState() {
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.disabled = false;
    this.focusCalls = 0;
    this.scrollCalls = [];
  }

  addEventListener(type, handler) {
    this.listeners.set(type, handler);
  }

  async dispatch(type, overrides = {}) {
    const handler = this.listeners.get(type);
    return handler({
      preventDefault() {},
      ...overrides,
    });
  }

  focus() {
    this.focusCalls += 1;
  }

  scrollIntoView(options) {
    this.scrollCalls.push(options);
  }
}

class FakeForm extends FakeElement {
  constructor(id, fields) {
    super(id);
    this.fields = fields;
    this.resetCalls = 0;
  }

  resetState() {
    super.resetState();
    this.resetCalls = 0;
  }

  reset() {
    this.resetCalls += 1;
    this.fields.forEach(field => {
      field.value = '';
    });
  }
}

const elements = {
  word1: new FakeElement('word1'),
  word2: new FakeElement('word2'),
  word3: new FakeElement('word3'),
  submitBtn: new FakeElement('submitBtn'),
  resetBtn: new FakeElement('resetBtn'),
  errorMessage: new FakeElement('errorMessage', { hidden: true }),
  errorText: new FakeElement('errorText'),
  resultContainer: new FakeElement('resultContainer', { hidden: true }),
  loadingContainer: new FakeElement('loadingContainer', { hidden: true }),
  phraseDisplay: new FakeElement('phraseDisplay'),
  satiricalDisplay: new FakeElement('satiricalDisplay'),
  wordsDisplay: new FakeElement('wordsDisplay'),
  timestamp: new FakeElement('timestamp'),
  submitText: new FakeElement('submitText'),
  spinner: new FakeElement('spinner', { hidden: true }),
  starsMotivational: new FakeElement('starsMotivational'),
  starsSatirical: new FakeElement('starsSatirical'),
  ratingMsgMotivational: new FakeElement('ratingMsgMotivational'),
  ratingMsgSatirical: new FakeElement('ratingMsgSatirical'),
  'average-rating': new FakeElement('average-rating'),
};

elements.motivationalForm = new FakeForm('motivationalForm', [elements.word1, elements.word2, elements.word3]);

function resetDomState() {
  Object.values(elements).forEach(element => element.resetState());
  elements.errorMessage.classList = new FakeClassList(['hidden']);
  elements.resultContainer.classList = new FakeClassList(['hidden']);
  elements.loadingContainer.classList = new FakeClassList(['hidden']);
  elements.submitText.classList = new FakeClassList();
  elements.spinner.classList = new FakeClassList(['hidden']);
}

before(async () => {
  global.document = {
    getElementById(id) {
      return elements[id];
    },
  };

  await import('../public/app.js');
});

beforeEach(() => {
  resetDomState();
  global.fetch = nativeFetch;
  console.error = nativeConsoleError;
});

after(() => {
  global.fetch = nativeFetch;
  console.error = nativeConsoleError;
  global.document = nativeDocument;
});

test('app.js valida a primeira palavra vazia antes de chamar a API', async () => {
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error('não deveria chamar fetch');
  };

  elements.word1.value = '   ';
  elements.word2.value = 'fé';
  elements.word3.value = 'foco';

  await elements.motivationalForm.dispatch('submit');

  assert.equal(fetchCalled, false);
  assert.equal(elements.errorText.textContent, 'Palavra 1 é inválida. Use apenas letras portuguesas.');
  assert.equal(elements.errorMessage.classList.contains('hidden'), false);
});

test('app.js valida a segunda palavra com caracteres inválidos', async () => {
  elements.word1.value = 'coragem';
  elements.word2.value = 'abc123';
  elements.word3.value = 'foco';

  await elements.motivationalForm.dispatch('submit');
  assert.equal(elements.errorText.textContent, 'Palavra 2 é inválida. Use apenas letras portuguesas.');
});

test('app.js valida a terceira palavra antes de prosseguir', async () => {
  elements.word1.value = 'coragem';
  elements.word2.value = 'disciplina';
  elements.word3.value = 'abc123';

  await elements.motivationalForm.dispatch('submit');
  assert.equal(elements.errorText.textContent, 'Palavra 3 é inválida. Use apenas letras portuguesas.');
});

test('app.js renderiza o resultado quando a API responde com sucesso', async () => {
  global.fetch = async (url, init) => {
    assert.equal(url, '/api/phrases');
    assert.equal(init.method, 'POST');

    return {
      ok: true,
      async json() {
        return {
          motivationalPhrase: 'Você consegue.',
          satiricalPhrase: 'Até o café rende mais que a desculpa.',
          words: ['fé', 'foco', 'força'],
          timestamp: '2026-01-01T12:34:56.000Z',
        };
      },
    };
  };

  elements.word1.value = ' fé ';
  elements.word2.value = 'foco';
  elements.word3.value = 'força';

  await elements.motivationalForm.dispatch('submit');

  assert.equal(elements.phraseDisplay.textContent, 'Você consegue.');
  assert.equal(elements.satiricalDisplay.textContent, 'Até o café rende mais que a desculpa.');
  assert.match(elements.wordsDisplay.innerHTML, /fé/);
  assert.match(elements.timestamp.textContent, /^Gerado em /);
  assert.equal(elements.resultContainer.classList.contains('hidden'), false);
  assert.equal(elements.loadingContainer.classList.contains('hidden'), true);
  assert.equal(elements.submitBtn.disabled, false);
  assert.equal(elements.resetBtn.disabled, false);
  assert.equal(elements.submitText.classList.contains('hidden'), false);
  assert.equal(elements.spinner.classList.contains('hidden'), true);
  assert.equal(elements.resultContainer.scrollCalls.length, 1);
});

test('app.js mostra o erro retornado pela API quando a resposta não é ok', async () => {
  global.fetch = async () => ({
    ok: false,
    async json() {
      return { error: 'Falha da API' };
    },
  });

  elements.word1.value = 'fé';
  elements.word2.value = 'foco';
  elements.word3.value = 'força';

  await elements.motivationalForm.dispatch('submit');

  assert.equal(elements.errorText.textContent, 'Falha da API');
  assert.equal(elements.loadingContainer.classList.contains('hidden'), true);
  assert.equal(elements.submitBtn.disabled, false);
});


test('app.js usa a mensagem padrão quando a API falha sem detalhar o erro', async () => {
  global.fetch = async () => ({
    ok: false,
    async json() {
      return {};
    },
  });

  elements.word1.value = 'fé';
  elements.word2.value = 'foco';
  elements.word3.value = 'força';

  await elements.motivationalForm.dispatch('submit');

  assert.equal(elements.errorText.textContent, 'Erro ao gerar frase motivacional');
});

test('app.js trata falhas de conexão e restaura o estado visual', async () => {
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));
  global.fetch = async () => {
    throw new Error('offline');
  };

  elements.word1.value = 'fé';
  elements.word2.value = 'foco';
  elements.word3.value = 'força';

  await elements.motivationalForm.dispatch('submit');

  assert.equal(elements.errorText.textContent, 'Erro de conexão. Verifique sua internet e tente novamente.');
  assert.equal(elements.loadingContainer.classList.contains('hidden'), true);
  assert.equal(elements.submitBtn.disabled, false);
  assert.ok(errors.some(message => message.includes('offline')));
});

test('app.js limpa o formulário e volta o foco para o primeiro campo', async () => {
  elements.word1.value = 'fé';
  elements.word2.value = 'foco';
  elements.word3.value = 'força';
  elements.errorMessage.classList.remove('hidden');
  elements.errorText.textContent = 'Erro anterior';
  elements.resultContainer.classList.remove('hidden');
  elements.loadingContainer.classList.remove('hidden');

  await elements.resetBtn.dispatch('click');

  assert.equal(elements.motivationalForm.resetCalls, 1);
  assert.equal(elements.word1.value, '');
  assert.equal(elements.resultContainer.classList.contains('hidden'), true);
  assert.equal(elements.loadingContainer.classList.contains('hidden'), true);
  assert.equal(elements.errorMessage.classList.contains('hidden'), true);
  assert.equal(elements.errorText.textContent, '');
  assert.equal(elements.word1.focusCalls, 1);
});
