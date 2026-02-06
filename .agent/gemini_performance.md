---
description: Queries otimizadas, caching, processamento assíncrono e escalabilidade
---

# ⚡ Gemini Performance - Otimização & Escalabilidade

## 1. Queries Otimizadas (Prisma)

### ✅ Correto: Select Específico

```typescript
const campaigns = await this.prisma.campaign.findMany({
  where: { organizationId },
  select: {
    id: true,
    name: true,
    status: true,
    _count: { select: { contacts: true } },
  },
});
```

### ❌ Incorreto: Include Desnecessário

```typescript
const campaigns = await this.prisma.campaign.findMany({
  where: { organizationId },
  include: { 
    contacts: true,      // Pode ser milhares!
    messages: true,      // Ainda mais!
    organization: true,  // Desnecessário
  },
});
```

---

## 2. Paginação Obrigatória

**Endpoints de listagem DEVEM suportar paginação:**

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async findAll(params: {
  organizationId: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<Campaign>> {
  const { organizationId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.campaign.findMany({
      where: { organizationId },
      skip,
      take: Math.min(limit, 100), // Limite máximo
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.campaign.count({ where: { organizationId } }),
  ]);

  return { 
    data, 
    total, 
    page, 
    limit, 
    totalPages: Math.ceil(total / limit) 
  };
}
```

---

## 3. Caching Strategy

### 3.1 Backend: Redis

```typescript
@Injectable()
export class CampaignsService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async findById(id: string): Promise<Campaign | null> {
    const cacheKey = `campaign:${id}`;
    
    // Tentar cache primeiro
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // Buscar do banco
    const campaign = await this.prisma.campaign.findUnique({ 
      where: { id } 
    });
    
    // Armazenar no cache (TTL 5 min)
    if (campaign) {
      await this.redis.set(cacheKey, JSON.stringify(campaign), 'EX', 300);
    }
    
    return campaign;
  }

  // Invalidar cache ao atualizar
  async update(id: string, data: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.prisma.campaign.update({
      where: { id },
      data,
    });
    
    await this.redis.del(`campaign:${id}`);
    return campaign;
  }
}
```

### 3.2 Frontend: React Query

```typescript
const { data: campaigns } = useQuery({
  queryKey: ['campaigns', organizationId],
  queryFn: () => fetchCampaigns(organizationId),
  staleTime: 5 * 60 * 1000,  // 5 minutos
  gcTime: 30 * 60 * 1000,    // 30 minutos
});

// Invalidar após mutação
const mutation = useMutation({
  mutationFn: createCampaign,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  },
});
```

---

## 4. Processamento Assíncrono

### 4.1 Filas com Bull/Redis

```typescript
@Injectable()
export class CampaignsService {
  constructor(
    @InjectQueue('campaigns') private campaignsQueue: Queue,
  ) {}

  async launchCampaign(id: string): Promise<void> {
    // Enfileirar ao invés de processar sincronamente
    await this.campaignsQueue.add('send-messages', {
      campaignId: id,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}

// Processor separado
@Processor('campaigns')
export class CampaignsProcessor {
  @Process('send-messages')
  async handleSendMessages(job: Job<{ campaignId: string }>) {
    // Lógica de envio aqui
  }
}
```

### 4.2 Quando Usar Filas

| Operação | Síncrono | Assíncrono (Fila) |
|----------|----------|-------------------|
| Criar campanha | ✅ | |
| Enviar mensagens em massa | | ✅ |
| Gerar relatório | | ✅ |
| Importar contatos | | ✅ |
| Processar webhook | | ✅ |

---

## 5. Distributed Tracing (Rastreamento Distribuído)

### 5.1 Conceito e Necessidade

Em arquiteturas que envolvem **filas (Bull/Redis)** e **APIs externas** (Evolution API, gateways de pagamento), uma única operação de negócio pode atravessar múltiplos serviços. **Distributed Tracing** permite rastrear o caminho completo de uma requisição e identificar gargalos.

**Casos de Uso:**
- Mensagem WhatsApp: Controller → Fila Bull → Processor → Evolution API
- Campanha: Create → Enqueue "send-messages" → Process → Envio em batch
- Billing: API Call → Stripe Webhook → Fila de processamento → Atualização de DB

### 5.2 Implementação com Correlation IDs

**Passo 1:** Injetar Correlation ID no início da requisição (já implementado em `gemini_quality.md`).

**Passo 2:** Propagar o Correlation ID através de filas e serviços externos.

```typescript
// src/brain/brain.service.ts
async processInboundMessage(
  dto: ProcessMessageDto,
  correlationId: string, // ← Recebido do controller
): Promise<void> {
  this.logger.log({
    message: 'Processing inbound message',
    correlationId,
    phone: dto.phone,
  });
  
  // Enfileirar com correlationId no payload
  await this.messagesQueue.add('send-reply', {
    correlationId, // ← Propagar para o worker
    phone: dto.phone,
    content: dto.content,
  });
}
```

**Passo 3:** No Processor, resgatar e logar o Correlation ID.

```typescript
// src/brain/processors/messages.processor.ts
@Processor('messages')
export class MessagesProcessor {
  private readonly logger = new Logger(MessagesProcessor.name);
  
  @Process('send-reply')
  async handleSendReply(job: Job<{ correlationId: string; phone: string; content: string }>) {
    const { correlationId, phone, content } = job.data;
    
    this.logger.log({
      message: 'Worker: Sending reply',
      correlationId, // ← Mesmo ID da requisição original
      jobId: job.id,
      phone,
    });
    
    try {
      // Chamar API externa
      const startTime = Date.now();
      await this.evolutionService.sendText(phone, content);
      const duration = Date.now() - startTime;
      
      this.logger.log({
        message: 'evolution_api_call_success',
        correlationId,
        duration,
        phone,
      });
    } catch (error) {
      this.logger.error({
        message: 'evolution_api_call_failed',
        correlationId,
        error: error.message,
        phone,
      });
      throw error; // Bull vai tentar retry
    }
  }
}
```

### 5.3 Monitoramento de Gargalos

#### Métricas Críticas para Filas Bull/Redis

```typescript
// src/common/services/queue-metrics.service.ts
@Injectable()
export class QueueMetricsService implements OnModuleInit {
  private readonly logger = new Logger('QueueMetrics');
  
  constructor(
    @InjectQueue('messages') private messagesQueue: Queue,
    @InjectQueue('campaigns') private campaignsQueue: Queue,
  ) {}
  
  async onModuleInit() {
    // Monitorar métricas a cada 30s
    setInterval(() => this.logQueueMetrics(), 30_000);
  }
  
  private async logQueueMetrics() {
    const queues = [
      { name: 'messages', queue: this.messagesQueue },
      { name: 'campaigns', queue: this.campaignsQueue },
    ];
    
    for (const { name, queue } of queues) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      
      this.logger.log({
        message: 'queue_metrics',
        queueName: name,
        waiting,
        active,
        completed,
        failed,
      });
      
      // Alerta se fila está acumulando
      if (waiting > 1000) {
        this.logger.warn({
          message: 'queue_backlog_alert',
          queueName: name,
          waiting,
        });
      }
    }
  }
}
```

#### Métricas de Performance para APIs Externas

```typescript
// src/evolution/evolution.service.ts
async sendText(to: string, text: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    await this.httpService.post('/message/sendText', { to, text }).toPromise();
    
    const duration = Date.now() - startTime;
    
    // Log de performance
    this.logger.log({
      message: 'external_api_call',
      service: 'evolution_api',
      operation: 'sendText',
      duration,
      success: true,
    });
    
    // Alerta se chamada demorou mais de 3s
    if (duration > 3000) {
      this.logger.warn({
        message: 'slow_external_api',
        service: 'evolution_api',
        duration,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    this.logger.error({
      message: 'external_api_call',
      service: 'evolution_api',
      operation: 'sendText',
      duration,
      success: false,
      error: error.message,
    });
    
    throw error;
  }
}
```

### 5.4 Dashboards e Alertas

Com logs estruturados, você pode criar dashboards no **Grafana**, **Datadog** ou **CloudWatch**:

**KPIs Críticos:**

| Métrica | Fonte | Alerta se |
|---------|-------|----------|
| Taxa de erro da Evolution API | `external_api_call.success=false` | > 5% |
| Tempo médio de resposta API | `external_api_call.duration` | > 2s |
| Jobs falhados em filas | `queue_metrics.failed` | > 100/hora |
| Backlog de fila | `queue_metrics.waiting` | > 1000 |
| Duração média de processamento | Job completion time | > 10s |

**Query de Exemplo (para ferramentas de log agregation):**

```sql
-- Encontrar Correlation IDs com erros
SELECT correlationId, COUNT(*) as error_count
FROM logs
WHERE level = 'error' AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY correlationId
ORDER BY error_count DESC
LIMIT 10;
```

### 5.5 Exemplo Completo: Rastreamento de Ponta a Ponta

**Cenário:** Usuário envia mensagem WhatsApp → AI responde

```
1. [Controller] POST /webhooks/evolution → correlationId: abc-123
2. [BrainService] Processar mensagem → correlationId: abc-123
3. [Bull Queue] Enfileirar job "send-reply" → correlationId: abc-123
4. [Worker] Processar job → correlationId: abc-123, jobId: 456
5. [EvolutionService] Enviar mensagem via API → correlationId: abc-123, duration: 850ms
6. [Worker] Job completo → correlationId: abc-123, totalDuration: 1.2s
```

Com logs estruturados, você pode buscar `correlationId: abc-123` e ver **todo o fluxo** em uma única visualização.

---

## 6. Lazy Loading (Frontend)

### 6.1 Componentes Pesados

```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('@/components/charts/HeavyChart'),
  { 
    loading: () => <Skeleton className="h-64" />,
    ssr: false,
  }
);
```

### 6.2 Imagens Otimizadas

```typescript
import Image from 'next/image';

<Image
  src="/campaign-banner.jpg"
  alt="Campaign"
  width={800}
  height={400}
  loading="lazy"
  placeholder="blur"
/>
```

---

## 7. Otimizações de Banco

### 7.1 Índices Necessários

```prisma
model Campaign {
  id             String   @id @default(uuid())
  organizationId String
  status         CampaignStatus
  createdAt      DateTime @default(now())

  // Índices para queries frequentes
  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, createdAt])
}
```

### 7.2 Evitar N+1

```typescript
// ❌ N+1: Uma query por campanha
const campaigns = await this.prisma.campaign.findMany();
for (const campaign of campaigns) {
  const contacts = await this.prisma.contact.count({
    where: { campaignId: campaign.id }
  });
}

// ✅ Uma única query com agregação
const campaigns = await this.prisma.campaign.findMany({
  include: {
    _count: { select: { contacts: true } }
  }
});
```

---

## 8. Métricas de Performance

| Métrica | Target | Ação se Exceder |
|---------|--------|-----------------|
| Tempo de resposta API | < 200ms | Adicionar cache, otimizar query |
| First Contentful Paint | < 1.5s | Lazy load, code splitting |
| Time to Interactive | < 3s | Reduzir bundle, prefetch |
| Query de banco | < 50ms | Adicionar índice, revisar query |

---

## 📌 Próximos Módulos

- `/gemini_core` - Princípios fundamentais
- `/gemini_architecture` - Estrutura e modularidade
- `/gemini_quality` - Padrões de código e segurança
- `/gemini_validation` - Testes e checklists
