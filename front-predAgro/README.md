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

## Variáveis de ambiente

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`

## Google login

O app não restringe domínio de conta Google: qualquer conta Google pode tentar entrar.

Para funcionar em produção, o Firebase Auth ainda exige que o domínio do frontend esteja listado em `Authentication > Settings > Authorized domains`.

## Rotas principais

- `/`: tela institucional.
- `/entrar`: login e cadastro.
- `/painel`: dashboard principal autenticado.
