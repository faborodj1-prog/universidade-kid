# Universidade Kid 1.0

Plataforma mobile-first de treinamento, certificação e gamificação para representantes, lojistas e vendedores.

## Stack

- **Frontend**: React 18 + Vite + TailwindCSS + PWA instalável
- **Backend**: Node.js + Express + Prisma
- **Banco**: PostgreSQL (Neon.tech — grátis)
- **Fotos**: Cloudinary (grátis)
- **Deploy**: Vercel (grátis, sem cartão)

---

## Deploy gratuito — passo a passo

### 1. Banco de dados — Neon.tech (grátis, sem cartão)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um novo projeto
3. Copie a **Connection string** (formato: `postgresql://user:pass@host/db?sslmode=require`)

---

### 2. Fotos — Cloudinary (grátis, sem cartão)

1. Acesse [cloudinary.com](https://cloudinary.com) e crie uma conta
2. No Dashboard copie: **Cloud Name**, **API Key**, **API Secret**

---

### 3. API — Vercel (projeto 1)

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório `universidade-kid`
3. Configure:
   - **Root Directory**: `packages/api`
   - **Framework Preset**: Other
   - **Build Command**: `npm install && npx prisma generate`
   - **Output Directory**: _(deixar vazio)_
4. Adicione as **Environment Variables**:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | string do Neon.tech |
| `JWT_SECRET` | string aleatória longa |
| `JWT_REFRESH_SECRET` | outra string aleatória |
| `CLOUDINARY_CLOUD_NAME` | do Cloudinary |
| `CLOUDINARY_API_KEY` | do Cloudinary |
| `CLOUDINARY_API_SECRET` | do Cloudinary |
| `ALLOWED_ORIGIN` | _(preencher depois com URL do frontend)_ |
| `NODE_ENV` | `production` |

5. Clique em **Deploy** e copie a URL gerada (ex: `https://universidade-kid-api.vercel.app`)

6. Rode as migrations pelo terminal do seu computador (uma vez só):
```bash
cd packages/api
npx prisma migrate deploy
node src/prisma/seed.js
```

---

### 4. Frontend — Vercel (projeto 2)

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o **mesmo repositório** `universidade-kid`
3. Configure:
   - **Root Directory**: `packages/web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicione a variável de ambiente:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `https://SUA-API.vercel.app/api` |

5. Clique em **Deploy** e copie a URL (ex: `https://universidade-kid.vercel.app`)

---

### 5. Conectar frontend ↔ API (CORS)

1. Volte ao projeto da **API** no Vercel
2. Vá em Settings → Environment Variables
3. Atualize `ALLOWED_ORIGIN` com a URL do frontend (ex: `https://universidade-kid.vercel.app`)
4. Faça **Redeploy** da API

---

## Desenvolvimento local

```bash
# 1. Copie e preencha os .env
cp packages/api/.env.example packages/api/.env
# edite packages/api/.env com as credenciais do Neon.tech e Cloudinary

# 2. Instale dependências e prepare o banco
cd packages/api
npm install
npx prisma migrate dev --name init
node src/prisma/seed.js

# 3. Frontend
cd ../web
npm install
npm run dev   # http://localhost:5173
# A API roda em :3001 e o Vite já faz proxy automaticamente
```

**Login de demonstração**: `admin@universidadekid.com` / `admin123`

---

## Estrutura

```
packages/
├── api/      ← Backend Node.js + Express + Prisma
└── web/      ← Frontend React + Vite + TailwindCSS
```
