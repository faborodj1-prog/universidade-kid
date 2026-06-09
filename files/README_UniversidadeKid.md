# Universidade Kid 1.0

Plataforma mobile-first de treinamento, certificação e gamificação para representantes, lojistas e vendedores.

## Requisitos

- Node.js 20+
- npm 9+
- Conta no Render.com (deploy API)
- Conta no Neon.tech (banco PostgreSQL gratuito)
- Conta no Cloudinary (upload de fotos)
- Conta no Upstash (Redis gratuito)

## Setup Local

```bash
# 1. Clone
git clone https://github.com/sua-org/universidade-kid.git
cd universidade-kid

# 2. Instale dependências (monorepo)
npm install

# 3. Configure variáveis de ambiente
cp packages/api/.env.example packages/api/.env
cp packages/web/.env.example packages/web/.env
# Edite os arquivos .env com suas credenciais

# 4. Crie o banco e rode as migrations
cd packages/api
npx prisma migrate dev
npx prisma db seed

# 5. Suba API + Web em paralelo
cd ../..
npm run dev
```

A API sobe em `http://localhost:3001` e o web em `http://localhost:5173`.

## Variáveis de Ambiente (API)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=seu-secret-aqui
JWT_REFRESH_SECRET=outro-secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
REDIS_URL=redis://...
PORT=3001
NODE_ENV=development
```

## Deploy no Render.com

1. Fork este repositório
2. Acesse render.com → New → Blueprint
3. Conecte seu repositório
4. O arquivo `render.yaml` configura tudo automaticamente
5. Adicione as variáveis de ambiente secretas no painel do Render

## Estrutura

```
packages/
├── api/     ← Backend Node.js + Express + Prisma
└── web/     ← Frontend React + Vite + TailwindCSS
```

## Funcionalidades MVP

- Trilhas de aprendizagem por perfil
- Upload de fotos via câmera ou galeria
- Certificações com PDF e QR Code
- Gamificação com XP, badges e ranking
- Registro de visitas de campo com geolocalização
- Dashboards gerenciais responsivos
