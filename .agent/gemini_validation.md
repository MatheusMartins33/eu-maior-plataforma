---
description: Estratégias de testes, checklists de validação e versionamento semântico
---

# ✅ Gemini Validation - Testes & Checklists

## 1. Estratégia de Testes

| Tipo | Cobertura | Quando Obrigatório |
|------|-----------|---------------------|
| **Unitários** | 80%+ para services | Toda lógica de negócio |
| **Integração** | Endpoints críticos | CRUD principal, auth |
| **E2E** | Fluxos principais | Checkout, signup, core flows |

---

## 2. Testes Unitários

### 2.1 Estrutura Padrão

```typescript
// campaigns.service.spec.ts
describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
      ],
    }).compile();

    service = module.get(CampaignsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a campaign with valid data', async () => {
      const dto = { name: 'Test', organizationId: 'org-1' };
      const expected = { id: 'camp-1', ...dto };
      
      prisma.campaign.create.mockResolvedValue(expected);
      
      const result = await service.create(dto);
      
      expect(result).toEqual(expected);
    });

    it('should throw when limit is exceeded', async () => {
      prisma.campaign.count.mockResolvedValue(100);
      
      await expect(service.create({ name: 'Test', organizationId: 'org-1' }))
        .rejects.toThrow(CampaignLimitExceededException);
    });
  });
});
```

### 2.2 Padrão AAA

```typescript
it('should update campaign status', async () => {
  // Arrange
  const campaignId = 'camp-1';
  prisma.campaign.update.mockResolvedValue({ status: 'ACTIVE' });
  
  // Act
  const result = await service.launch(campaignId);
  
  // Assert
  expect(result.status).toBe('ACTIVE');
});
```

---

## 3. Validação Manual Pré-Commit

```
// turbo
1. Verificar se o servidor inicia sem erros: npm run start:dev
2. Testar endpoint/feature manualmente
3. Verificar logs por warnings ou erros
4. Conferir console do navegador (frontend)
```

---

## 4. Validação de Tipos

```bash
# Backend
npm run build  # Compila TypeScript, detecta erros

# Frontend
npm run type-check  # ou npx tsc --noEmit
```

---

## 5. Checklists de Validação

### 5.1 Pré-Implementação

- [ ] Li e entendi completamente o requisito
- [ ] Pesquisei código existente que pode ser reutilizado
- [ ] Analisei impactos em outros módulos
- [ ] Consultei documentação oficial das tecnologias

### 5.2 Durante Implementação

- [ ] Segui os padrões de nomenclatura
- [ ] Código está tipado corretamente (sem `any`)
- [ ] Tratei erros adequadamente
- [ ] Adicionei logs em pontos críticos
- [ ] Validei inputs com DTOs
- [ ] Verifiquei autorização/propriedade

### 5.3 Pós-Implementação

- [ ] Servidor inicia sem erros
- [ ] Funcionalidade funciona como esperado
- [ ] Funcionalidades existentes continuam funcionando
- [ ] Não há erros no console (backend e frontend)
- [ ] Código está formatado (Prettier/ESLint)
- [ ] Commit segue padrão semântico

### 5.4 Antes de Merge/PR

- [ ] Testes passando
- [ ] Build de produção funciona
- [ ] Documentação atualizada (se necessário)
- [ ] Migrations aplicadas corretamente
- [ ] Variáveis de ambiente documentadas

---

## 6. Commits Semânticos

### 6.1 Formato

```
<tipo>(<escopo>): <descrição curta>

[corpo opcional]

[footer opcional]
```

### 6.2 Tipos Permitidos

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (não afeta lógica) |
| `refactor` | Refatoração |
| `perf` | Melhoria de performance |
| `test` | Adição/correção de testes |
| `chore` | Tarefas de manutenção |

### 6.3 Exemplos

```
feat(campaigns): add WhatsApp group creation on launch
fix(contacts): resolve duplicate import from Evolution API
refactor(billing): extract usage calculation to helper
perf(dashboard): add Redis cache to stats endpoint
```

---

## 7. Estratégia de Branching & Pull Requests

### 7.1 Nomenclatura de Branches

Siga o padrão **tipo/descrição-curta** baseado em Conventional Commits:

| Tipo | Quando Usar | Exemplo |
|------|-------------|----------|
| `feat/` | Nova funcionalidade | `feat/whatsapp-group-creation` |
| `fix/` | Correção de bug | `fix/campaign-launch-null-check` |
| `refactor/` | Refatoração sem mudança de comportamento | `refactor/extract-billing-helper` |
| `perf/` | Melhoria de performance | `perf/add-redis-cache-dashboard` |
| `docs/` | Apenas documentação | `docs/update-api-readme` |
| `test/` | Adição/correção de testes | `test/campaigns-service-unit` |
| `chore/` | Manutenção (deps, configs) | `chore/upgrade-nestjs-v10` |

**Regras:**
- Use **kebab-case** para a descrição
- Máximo 50 caracteres
- Seja descritivo, mas conciso

```bash
# ✅ Correto
git checkout -b feat/ai-context-correlation-ids
git checkout -b fix/ghost-mode-persistence

# ❌ Incorreto
git checkout -b feature  # Muito genérico
git checkout -b fix_bug  # Use kebab-case, não snake_case
```

### 7.2 Modelo de Pull Request (PR Template)

**Toda PR deve seguir este template**. A IA deve gerar este conteúdo automaticamente ao criar PRs:

````markdown
## 📋 Resumo

Descrição breve e direta do que foi alterado e por quê.

**Relacionado a:** #issue-number (se aplicável)

---

## 🔧 Mudanças Realizadas

### Backend
- [ ] Adicionado suporte a Correlation IDs em `BrainService`
- [ ] Criado `CorrelationIdInterceptor` para rastreamento de requisições
- [ ] Atualizado `MetricsService` para logar eventos de negócio

### Frontend
- [ ] Implementado skeleton loading em `CampaignDashboard`
- [ ] Adicionado ARIA labels em `CampaignCard` componentes

### Infraestrutura
- [ ] Nova variável de ambiente: `ENABLE_TRACING` (opcional)

---

## 💥 Impacto e Breaking Changes

> **⚠️ BREAKING CHANGES**: Liste aqui se houver mudanças que quebram compatibilidade

- [ ] **Não há breaking changes** ✅
- [ ] Migration do banco de dados necessária: `npx prisma migrate dev`
- [ ] Nova env var obrigatória: `X_SECRET_KEY`

**Impacto Estimado:**
- Performance: +15% em tempo de resposta (com cache)
- Usuários afetados: Todos (melhoria geral)

---

## 🧪 Como Testar

### Pré-requisitos
```bash
# 1. Aplicar migrations (se houver)
npx prisma migrate dev

# 2. Instalar novas dependências
npm install
```

### Testes Automatizados
```bash
npm run test                  # Testes unitários
npm run test:e2e              # Testes E2E
```

### Testes Manuais
1. Acesse `/campaigns/create`
2. Preencha o formulário de campanha
3. Verifique no console do navegador se `X-Correlation-Id` aparece nos headers de resposta
4. Confirme que o log do backend inclui `correlationId` em todas as entradas

**Endpoints Afetados:**
- `POST /api/campaigns` - Criação de campanha (melhorado)
- `GET /api/campaigns/:id` - Detalhe de campanha (sem mudanças)

---

## 📸 Screenshots / Vídeos (Opcional)

_Adicione capturas de tela para mudanças de UI ou vídeos para fluxos complexos._

---

## ✅ Checklist do Autor

- [ ] Código segue os padrões do `gemini_quality.md`
- [ ] Testes passando localmente
- [ ] Não há logs de PII (senhas, tokens, emails)
- [ ] Documentação atualizada (se necessário)
- [ ] Commit messages seguem padrão semântico
- [ ] Build de produção funciona (`npm run build`)

---

## 👀 Reviewers

@tech-lead @backend-team

**Pontos de Atenção para o Review:**
- Validar se Correlation IDs estão sendo propagados corretamente em operações assíncronas (filas Bull)
- Confirmar que não há overhead perceptível de performance
````

### 7.3 Geração Automática de PR pelo AI

Quando a IA criar uma PR, ela deve:

1. **Analisar os commits** da branch
2. **Identificar arquivos modificados** e categorizar (backend/frontend/infra)
3. **Detectar breaking changes** (alterações em schemas, APIs públicas)
4. **Gerar seção "Como Testar"** baseada nos arquivos alterados
5. **Preencher checklist automaticamente** baseado em análise estática

```typescript
// Exemplo de prompt interno para IA gerar PR description:
// "Analise os seguintes commits e arquivos modificados e gere uma PR description
// seguindo o template de gemini_validation.md. Commits: [lista]. Arquivos: [lista]."
```

### 7.4 Code Review Guidelines

**Responsabilidades do Reviewer:**

- [ ] Código está legível e bem documentado
- [ ] Não há código comentado (dead code)
- [ ] Variáveis e funções têm nomes descritivos
- [ ] Segurança: Sem secrets hardcoded, inputs validados
- [ ] Performance: Queries otimizadas, sem N+1
- [ ] Testes cobrem casos de sucesso E falha

**Aprovação de PR:**
- ✅ **Approve**: Código pronto para merge
- 💬 **Comment**: Sugestões não-bloqueantes
- 🚫 **Request Changes**: Problemas críticos que impedem merge

---

## 8. Documentação de Código

```typescript
/**
 * Launches a campaign and starts sending messages.
 * 
 * @param id - The campaign ID to launch
 * @throws {CampaignNotFoundException} If campaign doesn't exist
 * @throws {BadRequestException} If campaign is not in DRAFT status
 * @returns The updated campaign with ACTIVE status
 * 
 * @example
 * const campaign = await service.launch('camp-123');
 * console.log(campaign.status); // 'ACTIVE'
 */
async launch(id: string): Promise<Campaign> {
  // ...
}
```

---

## 📌 Adesão Obrigatória

> Estas diretrizes são **MANDATÓRIAS** e devem ser verificadas a cada etapa do desenvolvimento.

O não cumprimento pode resultar em:
- Bugs em produção
- Regressões
- Débito técnico
- Problemas de segurança
- Dificuldade de manutenção

---

## 📌 Módulos do Protocolo

- `/gemini_protocol` - Índice principal e quick reference
- `/gemini_core` - Princípios fundamentais
- `/gemini_architecture` - Estrutura e modularidade
- `/gemini_quality` - Padrões de código e segurança
- `/gemini_performance` - Otimização e escalabilidade
