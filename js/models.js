// models.js — AI model pricing data
// Input/output prices are per 1 million tokens (USD)
// Updated: May 2026

const MODELS = [
  { name: "GPT-4o Mini",      provider: "OpenAI",           input: 0.15,  output: 0.60  },
  { name: "Gemini 2.5 Flash", provider: "Google",           input: 0.15,  output: 0.60  },
  { name: "Grok 4.1",         provider: "xAI",              input: 0.20,  output: 0.50  },
  { name: "Mistral Small",    provider: "Mistral",          input: 0.10,  output: 0.30  },
  { name: "DeepSeek V3.2",    provider: "DeepSeek",         input: 0.28,  output: 1.10  },
  { name: "Llama 4 (API)",    provider: "Meta / 3rd party", input: 0.18,  output: 0.59  },
  { name: "Gemini 3 Flash",   provider: "Google",           input: 0.50,  output: 3.00  },
  { name: "DeepSeek R1",      provider: "DeepSeek",         input: 0.55,  output: 2.19  },
  { name: "Claude Haiku 4.5", provider: "Anthropic",        input: 0.80,  output: 4.00  },
  { name: "GPT-4o",           provider: "OpenAI",           input: 2.50,  output: 10.00 },
  { name: "Gemini 3.1 Pro",   provider: "Google",           input: 2.00,  output: 12.00 },
  { name: "Gemini 2.5 Pro",   provider: "Google",           input: 1.25,  output: 10.00 },
  { name: "o4-mini",          provider: "OpenAI",           input: 1.10,  output: 4.40  },
  { name: "Mistral Large",    provider: "Mistral",          input: 2.00,  output: 6.00  },
  { name: "Grok 3",           provider: "xAI",              input: 3.00,  output: 15.00 },
  { name: "Claude Sonnet 4.6",provider: "Anthropic",        input: 3.00,  output: 15.00 },
  { name: "GPT-5.4",          provider: "OpenAI",           input: 2.50,  output: 15.00 },
  { name: "Claude Opus 4.6",  provider: "Anthropic",        input: 15.00, output: 75.00 },
];
