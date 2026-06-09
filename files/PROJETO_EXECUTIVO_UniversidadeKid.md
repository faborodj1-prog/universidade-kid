# Universidade Kid 1.0 — Projeto Executivo MVP
### Plataforma de Treinamento, Certificação e Gamificação para a Força de Vendas

**Versão:** 1.0 — MVP 90 dias  
**Perfis atendidos:** Representante · Lojista · Vendedor PDV · Gestor · Admin  
**Stack:** React PWA + Node.js + PostgreSQL + Render.com + GitHub

---

## 1. Visão Geral e Objetivo

A Universidade Kid 1.0 é uma plataforma mobile-first de aprendizagem corporativa voltada à capacitação de representantes comerciais, lojistas e vendedores. O MVP foca em entregar valor imediato em **90 dias** com:

- Trilhas de aprendizagem estruturadas por perfil
- Certificações digitais validadas
- Gamificação com ranking e XP
- Registro fotográfico de visitas de campo
- Dashboards gerenciais responsivos

O que **não** está no escopo do MVP: CRM, ERP, BI avançado, IA/ML, integrações externas complexas.

---

## 2. Arquitetura Técnica

### 2.1 Stack Completa

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | React 18 + Vite + TailwindCSS | PWA mobile-first, rápido |
| Roteamento | React Router v6 | SPA com deep links |
| Estado | Zustand + React Query | Leve, sem Redux boilerplate |
| Câmera/Upload | MediaDevices API (WebRTC) | Acesso nativo câmera iOS/Android |
| Offline | Service Worker (Workbox) | Cursos acessíveis sem internet |
| Backend | Node.js 20 + Express 5 | Familiar, fácil deploy |
| Auth | JWT + bcrypt + refresh tokens | Stateless, mobile-safe |
| ORM | Prisma | Migrações, type-safe queries |
| Banco | PostgreSQL 15 (Neon.tech) | Serverless, free tier generoso |
| Cache | Redis (Upstash) | Ranking em tempo real |
| Mídia | Cloudinary | CDN + compressão automática de fotos |
| Vídeo | Cloudflare R2 / Stream | Custo mínimo para vídeos de aula |
| CI/CD | GitHub Actions | Deploy automático no push |
| Hosting API | Render.com | Free/starter tier, fácil |
| Hosting Web | Vercel ou Netlify | CDN global, preview por PR |
| Monitoramento | Sentry (free) | Erros em produção |

### 2.2 Repositório Git — Estrutura Monorepo

```
universidade-kid/
├── README.md
├── .github/
│   └── workflows/
│       ├── deploy-api.yml
│       └── deploy-web.yml
├── packages/
│   ├── api/                    ← Backend Node.js
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.js
│   │   │   │   ├── courses.js
│   │   │   │   ├── progress.js
│   │   │   │   ├── gamification.js
│   │   │   │   ├── uploads.js
│   │   │   │   ├── visits.js
│   │   │   │   ├── certificates.js
│   │   │   │   └── reports.js
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.js
│   │   │   │   ├── upload.js        ← multer + cloudinary
│   │   │   │   └── rateLimit.js
│   │   │   ├── services/
│   │   │   │   ├── xpEngine.js
│   │   │   │   ├── rankingService.js
│   │   │   │   └── certificateGen.js
│   │   │   └── prisma/
│   │   │       └── schema.prisma
│   │   ├── .env.example
│   │   └── package.json
│   └── web/                    ← Frontend React
│       ├── public/
│       │   ├── manifest.json   ← PWA manifest
│       │   └── sw.js           ← Service Worker
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Login.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Trails.jsx
│       │   │   ├── Course.jsx
│       │   │   ├── Quiz.jsx
│       │   │   ├── Camera.jsx      ← Câmera + upload
│       │   │   ├── Visits.jsx
│       │   │   ├── Ranking.jsx
│       │   │   ├── Certificates.jsx
│       │   │   └── Reports.jsx
│       │   ├── components/
│       │   │   ├── CameraCapture.jsx  ← WebRTC component
│       │   │   ├── ProgressBar.jsx
│       │   │   ├── XPBadge.jsx
│       │   │   ├── RankingCard.jsx
│       │   │   └── Charts/
│       │   ├── store/
│       │   │   └── useAppStore.js
│       │   ├── hooks/
│       │   │   ├── useCamera.js
│       │   │   └── useOffline.js
│       │   └── api/
│       │       └── client.js
│       ├── vite.config.js
│       └── package.json
└── package.json                ← workspaces
```

---

## 3. Módulos Funcionais Detalhados

### 3.1 Trilhas de Aprendizagem

**Objetivo:** Organizar conteúdos em percursos por perfil, nível e produto.

**Funcionalidades:**
- Trilhas por perfil (Representante, Lojista, Vendedor)
- Módulos sequenciais com desbloqueio por conclusão
- Tipos de conteúdo: vídeo, texto, PDF, quiz
- Progresso persistido (inclusive offline via Service Worker)
- Estimativa de tempo por módulo
- Marcação de favoritos

**Fluxo:** `Login → Trilhas do perfil → Selecionar módulo → Consumir conteúdo → Quiz → XP creditado`

**Modelo de dados:**
```sql
Trail (id, title, profile_type, description, thumbnail)
Module (id, trail_id, order, title, content_type, content_url, duration_min, xp_reward)
UserProgress (id, user_id, module_id, status, score, completed_at)
```

---

### 3.2 Upload de Fotos — Câmera e Galeria

**Prioridade 1 — Câmera direta:**
```javascript
// CameraCapture.jsx
const openCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }, // câmera traseira
    audio: false
  });
  videoRef.current.srcObject = stream;
};

const capture = () => {
  const canvas = canvasRef.current;
  canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
  canvas.toBlob(blob => uploadPhoto(blob), 'image/jpeg', 0.85);
};
```

**Prioridade 2 — Upload da galeria:**
```jsx
<input
  type="file"
  accept="image/*"
  capture="environment"    // sugere câmera no mobile
  onChange={handleFileSelect}
  style={{ display: 'none' }}
  ref={fileInputRef}
/>
```

**Fluxo de upload:**
1. Usuário abre câmera ou seleciona da galeria
2. Preview imediato no app
3. Compressão client-side (canvas, max 1200px, 85% qualidade)
4. Upload para `/api/uploads` → Cloudinary via Multer
5. URL retornada salva no banco vinculada ao registro de visita

**Cloudinary config (compressão automática):**
```javascript
cloudinary.uploader.upload(file.path, {
  folder: 'kid-visitas',
  transformation: [
    { width: 1200, crop: 'limit' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' }
  ]
});
```

---

### 3.3 Certificações

**Funcionalidades:**
- Critério configurável: % de acerto no quiz + conclusão de todos módulos
- Geração de PDF do certificado com nome, trilha, data e código verificável
- QR Code para validação externa
- Download e compartilhamento pelo celular
- Histórico de certificados por usuário

**Geração do PDF (backend):**
```javascript
// certificateGen.js — usa PDFKit
const generateCertificate = async (user, trail) => {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  doc.font('fonts/Kid-Bold.ttf')
     .fontSize(32).text(user.name, { align: 'center' });
  // ... layout completo
  const verifyCode = nanoid(10);
  await saveCertificate({ userId: user.id, trailId: trail.id, code: verifyCode });
  return doc;
};
```

---

### 3.4 Gamificação

**Sistema de XP:**
| Ação | XP |
|------|----|
| Completar módulo | 50 XP |
| Quiz ≥ 80% | +30 XP |
| Quiz 100% | +60 XP |
| Certificado obtido | 200 XP |
| Visita registrada com foto | 40 XP |
| Login 7 dias seguidos | 100 XP |

**Níveis:**
| Nível | XP necessário | Badge |
|-------|--------------|-------|
| Aprendiz | 0–500 | 🥉 |
| Profissional | 501–1500 | 🥈 |
| Expert | 1501–3500 | 🥇 |
| Mestre Kid | 3501+ | 👑 |

**Ranking:**
- Global, por região e por trilha
- Top 10 visível para todos
- Posição do usuário sempre visível
- Reset mensal opcional (configurável pelo admin)
- Cache Redis para consultas em tempo real

**Conquistas (badges):**
- Primeira aula concluída
- 5 trilhas completadas
- 30 dias consecutivos
- 10 visitas registradas
- Indicou colega que se cadastrou

---

### 3.5 Visitas de Campo

**Objetivo:** Registrar presença e evidências do representante/vendedor em pontos de venda.

**Funcionalidades:**
- Geolocalização automática (latitude/longitude) no momento do registro
- Foto obrigatória via câmera (ou galeria como fallback)
- Categorias de visita (treinamento, auditoria de gôndola, inauguração etc.)
- Checklist customizável por tipo de visita
- Comentários de texto livre
- Histórico de visitas com timeline

**Modelo:**
```sql
Visit (
  id, user_id, store_id,
  latitude, longitude,
  photo_url, category,
  checklist_answers JSON,
  notes, visited_at
)
```

---

### 3.6 Dashboards Gerenciais

**Perfil Gestor / Admin:**
- Total de usuários ativos por região
- % conclusão de trilhas por equipe
- Visitas realizadas vs meta
- Ranking geral e por equipe
- Certificados emitidos no período
- Heatmap de atividade semanal

**Perfil Individual:**
- Meu progresso por trilha
- Minha posição no ranking
- Certificados obtidos
- Histórico de visitas
- XP acumulado e nível atual

**Tecnologia:** Recharts (gráficos leves, responsivos, zero dependência pesada)

---

## 4. Design Mobile-First

### 4.1 Responsividade

- Breakpoints: mobile 375px → tablet 768px → desktop 1280px
- Layout em coluna única no mobile, grid 2 colunas no tablet
- Tamanho mínimo de toque: 44×44px (Apple HIG)
- Fonte mínima: 16px (evita zoom automático no iOS)
- Bottom navigation no mobile (5 itens principais)

### 4.2 PWA (Progressive Web App)

```json
// manifest.json
{
  "name": "Universidade Kid",
  "short_name": "Kid Univ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#E53E3E",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Benefícios PWA:**
- Instalável na tela home (sem App Store)
- Funciona offline (conteúdo em cache)
- Push notifications (engajamento)
- Câmera via browser nativo

---

## 5. Banco de Dados — Schema Prisma

```prisma
model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  role        Role     @default(SELLER)
  region      String?
  xp          Int      @default(0)
  level       Int      @default(1)
  createdAt   DateTime @default(now())
  progress    UserProgress[]
  visits      Visit[]
  certificates Certificate[]
}

enum Role { ADMIN MANAGER REPRESENTATIVE RETAILER SELLER }

model Trail {
  id          String   @id @default(cuid())
  title       String
  description String
  profileType Role[]
  thumbnail   String?
  modules     Module[]
}

model Module {
  id           String      @id @default(cuid())
  trailId      String
  trail        Trail       @relation(fields: [trailId], references: [id])
  order        Int
  title        String
  contentType  ContentType
  contentUrl   String
  durationMin  Int
  xpReward     Int         @default(50)
  progress     UserProgress[]
}

enum ContentType { VIDEO TEXT PDF QUIZ }

model UserProgress {
  id          String   @id @default(cuid())
  userId      String
  moduleId    String
  status      Status   @default(NOT_STARTED)
  score       Int?
  completedAt DateTime?
  user        User     @relation(fields: [userId], references: [id])
  module      Module   @relation(fields: [moduleId], references: [id])
  @@unique([userId, moduleId])
}

enum Status { NOT_STARTED IN_PROGRESS COMPLETED }

model Certificate {
  id         String   @id @default(cuid())
  userId     String
  trailId    String
  code       String   @unique
  issuedAt   DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}

model Visit {
  id         String   @id @default(cuid())
  userId     String
  storeId    String?
  latitude   Float
  longitude  Float
  photoUrl   String
  category   String
  notes      String?
  visitedAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}

model Achievement {
  id          String   @id @default(cuid())
  userId      String
  badge       String
  awardedAt   DateTime @default(now())
}
```

---

## 6. Deploy no Render.com

### 6.1 Configuração render.yaml

```yaml
services:
  - type: web
    name: kid-api
    env: node
    buildCommand: cd packages/api && npm install && npx prisma migrate deploy
    startCommand: cd packages/api && node src/index.js
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: kid-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: CLOUDINARY_URL
        sync: false
      - key: REDIS_URL
        sync: false

  - type: static
    name: kid-web
    buildCommand: cd packages/web && npm install && npm run build
    staticPublishPath: packages/web/dist
    headers:
      - path: /*
        name: Cache-Control
        value: no-cache
      - path: /assets/*
        name: Cache-Control
        value: public, max-age=31536000

databases:
  - name: kid-db
    databaseName: kiduniv
    user: kid
    plan: free
```

### 6.2 GitHub Actions — CI/CD

```yaml
# .github/workflows/deploy-api.yml
name: Deploy API
on:
  push:
    branches: [main]
    paths: ['packages/api/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Render
        uses: JorgeLNJunior/render-deploy@v1.4.4
        with:
          service_id: ${{ secrets.RENDER_SERVICE_ID }}
          api_key: ${{ secrets.RENDER_API_KEY }}
          wait_deploy: true
```

---

## 7. Cronograma 90 Dias

### Sprint 1 — Semanas 1–3: Fundação
- [ ] Setup monorepo + GitHub + CI/CD básico
- [ ] Auth (registro, login, JWT, refresh)
- [ ] Modelos de banco + Prisma migrations
- [ ] Deploy inicial no Render
- [ ] Layout mobile base (bottom nav, temas)

### Sprint 2 — Semanas 4–6: LMS Core
- [ ] CRUD de Trilhas e Módulos (admin)
- [ ] Player de vídeo mobile-first
- [ ] Leitor de PDF inline
- [ ] Sistema de progresso (UserProgress)
- [ ] Quiz com múltipla escolha

### Sprint 3 — Semanas 7–9: Câmera e Visitas
- [ ] Componente CameraCapture (WebRTC)
- [ ] Fallback upload por galeria
- [ ] Integração Cloudinary
- [ ] Módulo de visitas com geolocalização
- [ ] Checklist de visita

### Sprint 4 — Semanas 10–12: Gamificação e Relatórios
- [ ] Engine de XP + cálculo automático
- [ ] Ranking com Redis cache
- [ ] Sistema de badges/conquistas
- [ ] Geração de certificados PDF
- [ ] Dashboards com Recharts
- [ ] Testes com representantes piloto
- [ ] Ajustes de UX pós-feedback

---

## 8. Segurança e Performance

### Segurança
- JWT com expiração curta (15min) + refresh token (7d)
- Rate limiting por IP e por usuário
- Sanitização de inputs (express-validator)
- HTTPS obrigatório (Render provê SSL automático)
- Upload: validação de tipo MIME + tamanho máximo 10MB
- CORS configurado apenas para domínios aprovados

### Performance Mobile
- Lazy loading de rotas (React.lazy)
- Imagens servidas via Cloudinary CDN
- Vídeos com lazy load + poster image
- Bundle splitting automático via Vite
- Service Worker para cache de assets estáticos
- Skeleton loading para evitar layout shift

---

## 9. Estimativa de Custo Mensal (MVP)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Render.com API | Starter | $7/mês |
| Neon.tech PostgreSQL | Free / Pro | $0–$19/mês |
| Upstash Redis | Free (10k req/dia) | $0 |
| Cloudinary | Free (25GB) | $0 |
| Cloudflare R2 | Free (10GB) | $0 |
| Vercel Web | Free | $0 |
| Sentry | Free | $0 |
| **Total estimado** | | **$7–$26/mês** |

---

## 10. Checklist de Validação com Usuários

Ao final do sprint 4, validar com representantes, lojistas e vendedores:

- [ ] Consigo me cadastrar em menos de 2 minutos no celular?
- [ ] O app instala na tela home sem App Store?
- [ ] Consigo tirar foto diretamente pelo app?
- [ ] O conteúdo carrega rápido (< 3s) em 4G?
- [ ] O quiz funciona offline?
- [ ] Meu certificado foi gerado e consigo baixar?
- [ ] Consigo ver minha posição no ranking?
- [ ] O gestor consegue ver o progresso da equipe?

---

*Documento gerado para planejamento interno. Universidade Kid 1.0 — MVP 90 dias.*
