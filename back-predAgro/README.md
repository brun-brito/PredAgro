# back-predAgro

API REST da plataforma PredAgro com arquitetura em camadas orientada a domínio.

## Organização

- `src/routes`: definição dos endpoints.
- `src/controllers`: orquestração de entrada e saída HTTP.
- `src/services`: regras de negócio.
- `src/repositories`: acesso aos dados no Cloud Firestore.
- `src/middlewares`: autenticação, log e tratamento de erros.
- `src/utils`: utilitários, validações e objetos de suporte.

## Integração Firebase

- Chave de serviço: `pred-agro-firebase-adminsdk-fbsvc-3e36bd3970.json`
- Auth: Firebase Authentication (registro/login)
- Database: Cloud Firestore

## Executar

```bash
npm install
cp .env.example .env
npm run dev
```

## Variáveis de ambiente

- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `FIREBASE_WEB_API_KEY`

## Endpoints iniciais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/agricultural-profile/me`
- `PUT /api/agricultural-profile/me`
- `GET /api/climate/records`
- `POST /api/climate/records`
- `GET /api/agromet/sources`
- `GET /api/agromet/latest`
- `GET /api/predictions/summary`
- `GET /api/dashboard/overview`
