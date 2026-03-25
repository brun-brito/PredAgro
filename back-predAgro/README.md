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

- `CORS_ORIGIN`: use `*` para liberar acesso público de qualquer origem.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON completo da service account em uma única variável.
- `FIREBASE_SERVICE_ACCOUNT_BASE64`: mesma credencial em base64.
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_SERVICE_ACCOUNT_PATH`: opcional, usado só como fallback local.
- `FIREBASE_WEB_API_KEY`

## Deploy sem arquivo JSON

Para Vercel e outras hospedagens gratuitas, não é necessário subir o arquivo `.json` do Firebase Admin.

Use uma destas opções:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"..."}
```

ou

```env
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

O backend já converte `\\n` da chave privada para quebra de linha real.

## Endpoints iniciais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/agricultural-profile/me`
- `PUT /api/agricultural-profile/me`
- `GET /api/climate/records`
- `POST /api/climate/records`
- `GET /api/agromet/sources`
- `GET /api/agromet/latest`
- `GET /api/predictions/summary`
- `GET /api/dashboard/overview`
