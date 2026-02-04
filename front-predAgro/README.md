# front-predAgro

Aplicação web pública da plataforma PredAgro, desenvolvida com React + Vite + TypeScript.

## Estrutura de pastas

- `src/components`: componentes reutilizáveis de interface.
- `src/pages`: telas principais da aplicação.
- `src/services`: comunicação com API REST.
- `src/hooks`: regras reutilizáveis de estado e autenticação.
- `src/utils`: utilitários de formatação e dados de fallback.
- `src/styles`: tokens visuais e estilos globais.

## Executar localmente

```bash
npm install
cp .env.example .env
npm run dev
```

## Rotas principais

- `/`: tela institucional.
- `/entrar`: login e cadastro.
- `/painel`: dashboard principal autenticado.
