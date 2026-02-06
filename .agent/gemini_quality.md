---
description: Padrões de código, nomenclatura, error handling, logging e segurança
---

# ✨ Gemini Quality - Padrões de Código & Segurança

## 1. Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Classes/Interfaces | PascalCase | `CampaignService`, `IUserRepository` |
| Funções/Métodos | camelCase | `createCampaign()`, `getUserById()` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Arquivos (componentes) | PascalCase | `CampaignCard.tsx` |
| Arquivos (outros) | kebab-case | `campaign.service.ts` |
| Variáveis de ambiente | UPPER_SNAKE_CASE | `DATABASE_URL` |

---

## 2. TypeScript Estrito

### ✅ Correto: Tipos Explícitos

```typescript
async function getCampaign(id: string): Promise<Campaign | null> {
  return this.prisma.campaign.findUnique({ where: { id } });
}

interface CreateCampaignParams {
  name: string;
  organizationId: string;
  dailyLimit?: number;
}
```

### ❌ Incorreto: any, tipos implícitos

```typescript
async function getCampaign(id): any {
  return this.prisma.campaign.findUnique({ where: { id } });
}
```

---

## 3. Limites de Complexidade

| Métrica | Limite | Ação |
|---------|--------|------|
| Linhas por função | Máx 20 (ideal < 10) | Extrair para funções menores |
| Níveis de indentação | Máx 3 | Early return, extrair lógica |
| Parâmetros por função | Máx 3 | Usar objeto de parâmetros |
| Linhas por arquivo | Máx 200 | Dividir em módulos |

---

## 4. Tratamento de Erros

### 4.1 Exceções Customizadas

```typescript
// Criar exceções específicas do domínio
export class CampaignNotFoundException extends NotFoundException {
  constructor(campaignId: string) {
    super(`Campaign with ID ${campaignId} not found`);
  }
}

export class CampaignLimitExceededException extends ForbiddenException {
  constructor(limit: number) {
    super(`Campaign limit of ${limit} exceeded`);
  }
}
```

### 4.2 Padrão de Tratamento

```typescript
async launchCampaign(id: string): Promise<Campaign> {
  const campaign = await this.findById(id);
  
  if (!campaign) {
    throw new CampaignNotFoundException(id);
  }
  
  if (campaign.status !== 'DRAFT') {
    throw new BadRequestException('Only draft campaigns can be launched');
  }
  
  try {
    return await this.prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE', launchedAt: new Date() },
    });
  } catch (error) {
    this.logger.error(`Failed to launch campaign ${id}`, error.stack);
    throw new InternalServerErrorException('Failed to launch campaign');
  }
}
```

---

## 5. Sanitização de Dados (Data Sanitization)

### 5.1 Proteção de PII (Personally Identifiable Information)

**NUNCA logue informações sensíveis em logs, analytics ou error tracking:**

| Tipo de Dado | Nunca Logar | Como Lidar |
|--------------|-------------|------------|
| Senhas | ❌ `password: "abc123"` | Omitir completamente |
| Tokens/API Keys | ❌ `token: "sk_live_..."` | Logar apenas últimos 4 dígitos |
| Emails | ❌ `email: "user@domain.com"` | Hash ou mascarar: `u***@d***.com` |
| CPF/Documentos | ❌ `cpf: "12345678900"` | Mascarar: `***.***.***-00` |
| Números de Telefone | ❌ `phone: "+5511999999999"` | Mascarar parcial: `+55***99999` |
| Endereços Completos | ❌ `address: "Rua X, 123"` | Logar apenas cidade/estado |

### 5.2 Helper de Sanitização

```typescript
// src/common/utils/sanitize.util.ts
export class SanitizeUtil {
  /**
   * Remove campos sensíveis de objetos antes de logar
   */
  static sanitizeForLogging<T extends Record<string, any>>(obj: T): Partial<T> {
    const sensitive = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    const result = { ...obj };
    
    sensitive.forEach(key => delete result[key]);
    
    // Mascarar email se presente
    if (result.email) {
      result.email = this.maskEmail(result.email);
    }
    
    return result;
  }
  
  static maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
  }
  
  static maskPhone(phone: string): string {
    return phone.replace(/(\d{2})(\d+)(\d{4})/, '$1***$3');
  }
}
```

### 5.3 Uso em DTOs e Logs

```typescript
async register(dto: RegisterUserDto): Promise<User> {
  // ✅ CORRETO: Sanitizar antes de logar
  const sanitized = SanitizeUtil.sanitizeForLogging(dto);
  this.logger.log('Registering new user', sanitized);
  
  // ❌ INCORRETO: Nunca logar o DTO original com senha
  // this.logger.log('Registering user', dto);
}
```

---

## 6. Observabilidade Estruturada (Structured Observability)

### 6.1 Configuração com Correlation IDs

```typescript
@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);
}

// Interceptor para injetar Correlation ID em todas as requisições
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.headers['x-correlation-id'] || uuidv4();
    
    request.correlationId = correlationId;
    
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-Correlation-Id', correlationId);
      })
    );
  }
}
```

### 6.2 Níveis de Log

| Nível | Quando Usar |
|-------|-------------|
| `error` | Falhas que requerem atenção imediata |
| `warn` | Situações anômalas, mas recuperáveis |
| `log` | Eventos importantes de negócio |
| `debug` | Informações úteis para debugging |
| `verbose` | Detalhes granulares (apenas em dev) |

### 6.3 Logging com Contexto e Correlation

```typescript
async create(
  dto: CreateCampaignDto,
  @Req() request: Request,
): Promise<Campaign> {
  const correlationId = request['correlationId'];
  
  // Log estruturado com contexto completo
  this.logger.log({
    message: 'Creating campaign',
    correlationId,
    organizationId: dto.organizationId,
    campaignName: dto.name,
    userId: request.user.id,
  });
  
  try {
    const campaign = await this.prisma.campaign.create({ data: dto });
    
    // Log de evento de negócio
    this.logger.log({
      message: 'campaign_created', // <- Evento rastreável
      correlationId,
      campaignId: campaign.id,
      metadata: { status: campaign.status },
    });
    
    return campaign;
  } catch (error) {
    this.logger.error({
      message: 'Failed to create campaign',
      correlationId,
      error: error.message,
      stack: error.stack,
      context: SanitizeUtil.sanitizeForLogging(dto),
    });
    throw error;
  }
}
```

### 6.4 Métricas de Negócio (Business Events)

Além de logs técnicos, rastreie eventos de negócio para analytics:

```typescript
// src/common/services/metrics.service.ts
@Injectable()
export class MetricsService {
  private readonly logger = new Logger('BusinessMetrics');
  
  trackEvent(event: {
    name: string;
    organizationId: string;
    userId?: string;
    metadata?: Record<string, any>;
  }): void {
    this.logger.log({
      event: event.name,
      timestamp: new Date().toISOString(),
      ...event,
    });
  }
}

// Uso em services
async launchCampaign(id: string): Promise<Campaign> {
  const campaign = await this.update(id, { status: 'ACTIVE' });
  
  // Rastrear evento de negócio
  this.metricsService.trackEvent({
    name: 'campaign_launched',
    organizationId: campaign.organizationId,
    metadata: {
      campaignId: id,
      dailyLimit: campaign.dailyMessageLimit,
      contactCount: campaign.contacts.length,
    },
  });
  
  return campaign;
}
```

### 6.5 Eventos de Negócio Recomendados

| Evento | Quando Rastrear | Dados Importantes |
|--------|-----------------|-------------------|
| `campaign_launched` | Campanha ativada | `campaignId`, `contactCount` |
| `payment_gateway_error` | Falha no gateway | `gateway`, `errorCode`, `amount` |
| `whatsapp_connection_failed` | WhatsApp desconectou | `instanceId`, `reason` |
| `lead_converted` | Lead virou cliente | `leadId`, `dealValue` |
| `plan_limit_exceeded` | Limite de plano atingido | `planName`, `limitType` |

---

## 7. Segurança

### 6.1 Validação de Entrada (DTOs)

```typescript
export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  dailyMessageLimit: number;

  @IsUUID()
  organizationId: string;
}
```

### 6.2 Checklist de Segurança

- [ ] **Autenticação**: Endpoints exigem JWT válido
- [ ] **Autorização**: Verificar permissão para o recurso
- [ ] **Rate Limiting**: Limitar requisições por IP/usuário
- [ ] **CORS**: Configurar origens permitidas
- [ ] **Secrets**: Nunca hardcode, usar env vars
- [ ] **SQL Injection**: Usar Prisma (queries parametrizadas)
- [ ] **XSS**: Sanitizar inputs do usuário

### 6.3 Verificação de Propriedade

```typescript
// SEMPRE verifique se o recurso pertence à organização
async findById(id: string, organizationId: string): Promise<Campaign> {
  return this.prisma.campaign.findFirst({
    where: { 
      id,
      organizationId, // ← Filtro obrigatório
    },
  });
}
```

---

## 8. Funções Puras e Imutabilidade

### ✅ Correto: Função Pura

```typescript
function addTag(campaign: Campaign, tag: string): Campaign {
  return { ...campaign, tags: [...campaign.tags, tag] };
}
```

### ❌ Incorreto: Mutação

```typescript
function addTag(campaign: Campaign, tag: string): void {
  campaign.tags.push(tag); // Efeito colateral
}
```

---

## 📌 Próximos Módulos

- `/gemini_core` - Princípios fundamentais
- `/gemini_architecture` - Estrutura e modularidade
- `/gemini_performance` - Otimização e escalabilidade
- `/gemini_validation` - Testes e checklists
