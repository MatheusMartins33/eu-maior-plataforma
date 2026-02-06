---
description: Princípios fundamentais, verificação pré-desenvolvimento e análise de impacto
---

# 🎯 Gemini Core - Princípios Fundamentais

## 1. Princípios SOLID

### Single Responsibility (SRP)
Cada classe/função deve ter apenas **uma responsabilidade**.

```typescript
// ✅ CORRETO: Responsabilidades separadas
class CampaignService { /* lógica de campanhas */ }
class CampaignValidator { /* validação de campanhas */ }
class CampaignNotifier { /* notificações de campanhas */ }

// ❌ INCORRETO: Múltiplas responsabilidades
class CampaignService {
  create() { /* cria */ }
  validate() { /* valida */ }
  sendEmail() { /* envia email */ }
  generateReport() { /* gera relatório */ }
}
```

### Open/Closed (OCP)
Código **aberto para extensão**, fechado para modificação.

### Liskov Substitution (LSP)
Subtipos devem ser **substituíveis** por seus tipos base.

### Interface Segregation (ISP)
Interfaces **específicas** são melhores que uma interface geral.

### Dependency Inversion (DIP)
Dependa de **abstrações**, não de implementações concretas.

```typescript
// ✅ CORRETO: Injeção de dependência
@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evolution: EvolutionService,
  ) {}
}

// ❌ INCORRETO: Instanciação direta
export class CampaignsService {
  private prisma = new PrismaService(); // NÃO FAÇA
}
```

---

## 2. Princípios Adicionais

| Princípio | Descrição |
|-----------|-----------|
| **DRY** | Elimine duplicação de lógica |
| **KISS** | Prefira soluções simples e legíveis |
| **YAGNI** | Não implemente funcionalidades especulativas |
| **Fail Fast** | Detecte e reporte erros o mais cedo possível |
| **Composition > Inheritance** | Prefira composição à herança |

---

## 3. Verificação Pré-Desenvolvimento

### 3.1 Pesquisa de Código Existente
**OBRIGATÓRIO** antes de implementar qualquer funcionalidade:

```
// turbo
1. Buscar funções similares: grep_search com termos relacionados
2. Verificar services existentes reutilizáveis
3. Conferir helpers/utils já implementados
4. Analisar DTOs e interfaces existentes
```

### 3.2 Análise de Impacto

Antes de qualquer alteração, responda:

- [ ] Quais módulos dependem deste código?
- [ ] Existem testes que cobrem esta funcionalidade?
- [ ] A alteração afeta contratos de API (breaking change)?
- [ ] Há migrações de banco necessárias?
- [ ] Impacta outros desenvolvedores/branches?

### 3.3 Mapeamento de Dependências

```typescript
// Antes de alterar um service, verifique quem o consome:
// 1. Controllers que injetam este service
// 2. Outros services que dependem dele
// 3. Testes que fazem mock dele
// 4. Event handlers que o utilizam
```

---

## 4. Zero Regressão

> ⚠️ **JAMAIS edite código sem garantia absoluta de que funcionalidades existentes permanecerão funcionando.**

### Regras de Ouro

1. **Analise todos os pontos de entrada** (controllers, event handlers)
2. **Verifique chamadas** a métodos que serão alterados
3. **Mantenha assinaturas** de métodos públicos quando possível
4. **Se alterar assinatura**, atualize **TODOS** os consumidores

### Exemplo de Análise

```typescript
// Antes de alterar este método:
async createCampaign(dto: CreateCampaignDto): Promise<Campaign>

// Verifique:
// 1. CampaignsController.create() - usa este método
// 2. CampaignsAIDAController.generateAndCreate() - usa este método
// 3. campaigns.service.spec.ts - testa este método
// 4. Integrações externas - webhooks que esperam este retorno
```

---

## 5. Documentação Oficial

Toda implementação deve seguir **estritamente** a documentação oficial:

| Tecnologia | Documentação |
|------------|--------------|
| NestJS | https://docs.nestjs.com |
| Prisma | https://www.prisma.io/docs |
| Next.js | https://nextjs.org/docs |
| React | https://react.dev |
| Evolution API | Documentação interna do projeto |
| TailwindCSS | https://tailwindcss.com/docs |
| Shadcn/ui | https://ui.shadcn.com |

---

## 📌 Próximos Módulos

- `/gemini_architecture` - Estrutura de camadas e modularidade
- `/gemini_quality` - Padrões de código e segurança
- `/gemini_performance` - Otimização e escalabilidade
- `/gemini_validation` - Testes e checklists
