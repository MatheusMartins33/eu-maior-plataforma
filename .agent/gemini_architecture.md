---
description: Estrutura de camadas, modularidade e padrões de arquitetura backend/frontend
---

# 🏗️ Gemini Architecture - Estrutura & Modularidade

## 1. Estrutura de Camadas (Backend - NestJS)

```
src/
├── [module]/
│   ├── dto/                    # Data Transfer Objects (validação)
│   ├── entities/               # Tipos/interfaces do domínio
│   ├── helpers/                # Funções auxiliares do módulo
│   ├── [module].controller.ts  # Endpoints HTTP (thin layer)
│   ├── [module].service.ts     # Lógica de negócio principal
│   ├── [module].module.ts      # Configuração do módulo NestJS
│   └── [module].spec.ts        # Testes unitários
├── common/                     # Código compartilhado
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── utils/
└── config/                     # Configurações centralizadas
```

### Responsabilidades por Camada

| Camada | Responsabilidade | Não Deve |
|--------|------------------|----------|
| **Controller** | Receber HTTP, validar input, retornar response | Conter lógica de negócio |
| **Service** | Lógica de negócio, orquestração | Acessar HTTP diretamente |
| **Helper** | Funções utilitárias puras | Ter dependências de infra |
| **DTO** | Validação de entrada/saída | Conter lógica |

---

## 2. Estrutura de Camadas (Frontend - Next.js)

```
frontend/src/
├── app/                        # App Router (páginas e layouts)
│   └── [route]/
│       ├── page.tsx            # Página principal
│       ├── layout.tsx          # Layout da rota
│       └── loading.tsx         # Estado de loading
├── components/
│   ├── ui/                     # Componentes base (Shadcn/ui)
│   └── [feature]/              # Componentes por feature
├── hooks/                      # Custom hooks reutilizáveis
├── lib/                        # Utilitários e configurações
├── services/                   # Chamadas de API
└── types/                      # Tipos TypeScript globais
```

### Responsabilidades por Camada

| Camada | Responsabilidade |
|--------|------------------|
| **app/** | Roteamento, layouts, páginas (Server Components) |
| **components/ui/** | Componentes base reutilizáveis |
| **components/[feature]/** | Componentes específicos da feature |
| **hooks/** | Lógica reutilizável com estado |
| **services/** | Chamadas HTTP, integração com API |
| **types/** | Interfaces e tipos compartilhados |

---

## 3. Regras de Modularidade

| Regra | Descrição |
|-------|-----------|
| **Coesão Alta** | Cada módulo agrupa funcionalidades relacionadas |
| **Acoplamento Baixo** | Módulos dependem minimamente uns dos outros |
| **Dependência Unidirecional** | Evite dependências circulares |
| **Encapsulamento** | Exporte apenas o necessário via `index.ts` |
| **Injeção de Dependência** | Use DI do NestJS, evite instanciação direta |

### Exemplo de Encapsulamento

```typescript
// src/campaigns/index.ts - Exporta apenas o público
export { CampaignsModule } from './campaigns.module';
export { CampaignsService } from './campaigns.service';
export { CreateCampaignDto } from './dto/create-campaign.dto';
// NÃO exportar helpers internos
```

---

## 4. Comunicação Entre Módulos

### ✅ Correto: Injeção de Dependência

```typescript
@Injectable()
export class CampaignsService {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly evolutionService: EvolutionService,
    private readonly billingService: BillingService,
  ) {}

  async launch(id: string) {
    // Usa os services injetados
    await this.billingService.checkLimits();
    await this.evolutionService.createGroup();
  }
}
```

### ❌ Incorreto: Acoplamento Direto

```typescript
export class CampaignsService {
  async launch(id: string) {
    // NÃO faça isso
    const billing = new BillingService();
    const evolution = new EvolutionService();
  }
}
```

---

## 5. Padrões de Organização de Código

### 5.1 Ordem de Imports

```typescript
// 1. Bibliotecas externas
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// 2. Imports internos absolutos
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@/config/config.service';

// 3. Imports relativos
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignEntity } from './entities/campaign.entity';
```

### 5.2 Ordem de Membros da Classe

```typescript
@Injectable()
export class CampaignsService {
  // 1. Propriedades estáticas
  private static readonly MAX_RETRIES = 3;

  // 2. Propriedades de instância
  private readonly logger = new Logger(CampaignsService.name);

  // 3. Constructor
  constructor(private readonly prisma: PrismaService) {}

  // 4. Métodos públicos
  async create(dto: CreateCampaignDto) {}
  async findById(id: string) {}

  // 5. Métodos privados
  private async validateLimits() {}
  private formatResponse() {}
}
```

---

## 6. Stack Tecnológica

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 18+ | Runtime |
| NestJS | 10+ | Framework |
| TypeScript | 5+ | Linguagem |
| Prisma | 5+ | ORM |
| PostgreSQL | 15+ | Banco de Dados |
| Redis | 7+ | Cache/Filas |

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14+ | Framework (App Router) |
| React | 18+ | UI Library |
| TailwindCSS | 3+ | Styling |
| Shadcn/ui | Latest | Componentes base |
| React Query | 5+ | Data fetching |
| Zustand | 4+ | State management |

---

## 📌 Próximos Módulos

- `/gemini_core` - Princípios fundamentais
- `/gemini_quality` - Padrões de código e segurança
- `/gemini_performance` - Otimização e escalabilidade
- `/gemini_validation` - Testes e checklists
