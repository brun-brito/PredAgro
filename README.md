# PredAgro

Base inicial da plataforma PredAgro com separação entre front-end e back-end no mesmo repositório.

## Estrutura

- `front-predAgro`: Aplicação React + Vite + TypeScript.
- `back-predAgro`: API REST com Node.js + Express + Firebase.

## Como executar

### 1) Back-end

```bash
cd back-predAgro
cp .env.example .env
npm install
npm run dev
```

Servidor padrão: `http://localhost:3333`

### 2) Front-end

```bash
cd front-predAgro
cp .env.example .env
npm install
npm run dev
```

Aplicação padrão: `http://localhost:5173`

## Fluxo inicial disponível

- Cadastro e login de usuário com Firebase Auth.
- Persistência de dados com Cloud Firestore.
- Dashboard com visão climática, resumo de previsão e alertas.
- Endpoint para perfil agrícola.
- Endpoint para ingestão e consulta de registros climáticos.
- Endpoints preparados para consumo agrometeorológico e resumo de predição.
