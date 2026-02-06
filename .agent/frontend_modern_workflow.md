---
description: Workflow moderno de Frontend 2026 com Neurodesign, Gamificação e Arquitetura Plug & Play.
---

# 🧠 Workflow Frontend 2026: Neuro-Experience, Gamification & A11y

Este workflow define o padrão para criação de interfaces modernas baseado em **3 Pilares Fundamentais**:
1. **Neurodesign**: Redução da carga cognitiva e maximização do "delight"
2. **Gamificação**: Feedbacks dopaminérgicos e estado de fluxo
3. **Acessibilidade Universal (A11y)**: Inclusão para todos os usuários, independente de habilidades

> **Princípio:** Uma interface inacessível é uma interface incompleta. A11y não é optional, é obrigatório.

**Stack Base:** Next.js 16, React 19, Tailwind v4, Framer Motion, Radix UI.
**Stack Experiência:** `canvas-confetti`, `use-sound`, `react-joyride`, `lottie`.

---

## 1. 🧬 Fase 1: Neuro-Design & Planejamento Cognitivo

Antes de codificar, defina a "Jornada Química" do usuário. O objetivo é manter o usuário em "Estado de Fluxo".

### 1.1 Mapeamento de Dopamina
Identifique os momentos chave para recompensar o usuário.
- [ ] **Micro-Vitórias:** Checkboxes, salvar formulários, completar etapas (Usar `confetti` ou sons sutis).
- [ ] **Feedback Tátil/Visual:** Hover effects, active states (Usar `framer-motion` `whileHover`, `whileTap`).
- [ ] **Antecipação:** Loaders animados (Lottie) que mostram progresso real, reduzindo a ansiedade de espera.

### 1.2 Auditoria de Carga Cognitiva
- [ ] **Lei de Hick:** Reduza o número de opções por tela. Use `Progressive Disclosure` (ex: Accordions do Radix, Steps).
- [ ] **Legibilidade:** Use hierarquia tipográfica clara. O olho deve "escorregar" pela página.
- [ ] **Consistência:** Use componentes do `@components/ui` (Radix/Shadcn) para manter padrões mentais familiares.

---

## 2. ♿ Fase 2: Acessibilidade Universal (A11y) - 3º Pilar

Toda interface deve ser navegável e utilizável por **todos**, incluindo pessoas com deficiências visuais, motoras, auditivas ou cognitivas.

### 2.1 Checklist de Acessibilidade WCAG 2.1 (Nível AA)

#### 🎯 Navegação por Teclado (Keyboard Navigation)
- [ ] **Tab Order Lógico**: Navegação segue ordem visual (esquerda→direita, cima→baixo)
- [ ] **Focus Visível**: Todo elemento interativo mostra outline ao receber foco (não use `outline: none` sem substituto)
- [ ] **Atalhos de Teclado**: Ações principais acessíveis via `Enter`/`Space`
- [ ] **Escape para Fechar**: Modais e dropdowns fecham com `Esc`
- [ ] **Skip Navigation**: Inclua link "Pular para conteúdo" para evitar navegação repetitiva

```typescript
// Exemplo: Focus trap em modais
import { Dialog } from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Abrir Modal</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="overlay" />
    <Dialog.Content aria-describedby="dialog-description">
      {/* Radix já gerencia focus trap automaticamente */}
      <Dialog.Title>Título Acessível</Dialog.Title>
      <Dialog.Description id="dialog-description">
        Descrição clara do propósito do modal
      </Dialog.Description>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

#### 🏷️ ARIA Labels e Roles
- [ ] **Imagens Decorativas**: Use `aria-hidden="true"` ou `alt=""`
- [ ] **Imagens Informativas**: Sempre inclua `alt` descritivo
- [ ] **Botões com Ícones**: Use `aria-label` quando não há texto visível
- [ ] **Estados Dinâmicos**: Use `aria-live="polite"` para atualizações (ex: toasts)
- [ ] **Loading States**: Indique com `aria-busy="true"` e `aria-live`

```typescript
// Exemplo: Botão com apenas ícone
<button 
  aria-label="Deletar campanha"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</button>

// Exemplo: Toast notification
<div role="status" aria-live="polite" aria-atomic="true">
  Campanha criada com sucesso!
</div>
```

#### 🎨 Contraste de Cores (WCAG AA: min 4.5:1)
- [ ] **Texto Normal**: Contraste mínimo 4.5:1 com fundo
- [ ] **Texto Grande** (18pt+): Contraste mínimo 3:1
- [ ] **Elementos Interativos**: Contraste 3:1 para bordas/ícones
- [ ] **Modo Escuro**: Verificar contraste também no dark mode

```css
/* ✅ Correto: Contraste suficiente */
.button-primary {
  background: #0066CC; /* Azul escuro */
  color: #FFFFFF;      /* Contraste 7:1 */
}

/* ❌ Incorreto: Contraste insuficiente */
.button-bad {
  background: #FFEB3B; /* Amarelo */
  color: #FFFFFF;      /* Contraste 1.2:1 - ilegível */
}
```

**Ferramenta Recomendada**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### 📱 Responsividade e Zoom
- [ ] **Zoom 200%**: Conteúdo utilizável até 200% de zoom (WCAG 2.1)
- [ ] **Unidades Relativas**: Use `rem`/`em` ao invés de `px` para fontes
- [ ] **Touch Targets**: Botões com mínimo 44x44px (iOS) ou 48x48px (Android)

```css
/* ✅ Correto: Touch target adequado */
.mobile-button {
  min-width: 48px;
  min-height: 48px;
  padding: 0.75rem; /* rem = relativo ao root font-size */
}
```

#### 🔊 Suporte a Leitores de Tela
- [ ] **Hierarquia de Headings**: Use `h1` → `h6` em ordem (não pule níveis)
- [ ] **Landmarks Semânticos**: Use `<nav>`, `<main>`, `<aside>`, `<footer>`
- [ ] **Formulários**: Sempre associe `<label>` com `<input>` via `htmlFor`/`id`
- [ ] **Mensagens de Erro**: Use `aria-invalid` e `aria-describedby`

```typescript
// Exemplo: Formulário acessível
<div>
  <label htmlFor="campaign-name">Nome da Campanha</label>
  <input 
    id="campaign-name"
    type="text"
    aria-invalid={!!error}
    aria-describedby={error ? "name-error" : undefined}
  />
  {error && (
    <span id="name-error" role="alert">
      {error.message}
    </span>
  )}
</div>
```

#### 🧩 Shadcn/ui & Radix - Customizações Acessíveis

Os componentes Radix (base do Shadcn) já são acessíveis por padrão, mas ao customizar:

- [ ] **Não remova atributos ARIA** ao fazer override de estilos
- [ ] **Preserve event handlers** nativos (onKeyDown, onFocus)
- [ ] **Teste com leitor de tela** (NVDA no Windows, VoiceOver no Mac)

```typescript
// ✅ Correto: Preserva A11y do Radix
import { Select } from '@/components/ui/select';

<Select.Root>
  <Select.Trigger aria-label="Selecione o status da campanha">
    <Select.Value placeholder="Status" />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="active">Ativa</Select.Item>
    <Select.Item value="paused">Pausada</Select.Item>
  </Select.Content>
</Select.Root>
```

### 2.2 Ferramentas de Validação A11y

```bash
# Instalar extensões de teste
npm install -D @axe-core/react eslint-plugin-jsx-a11y
```

- **Desenvolvimento**: [axe DevTools](https://www.deque.com/axe/devtools/) (extensão Chrome/Firefox)
- **CI/CD**: `@axe-core/react` para testes automatizados
- **Linter**: `eslint-plugin-jsx-a11y` para detectar erros no código

---

## 3. 🧩 Fase 3: Arquitetura Plug & Play (Modularidade)

Desenvolva componentes "atômicos" e independentes que podem ser plugados em qualquer lugar.

### 2.1 Estrutura de Componente Neuro-Compatível
Cada componente deve ser autocontido (Lógica + UI + Animação + Som).

```typescript
// Exemplo de estrutura de pasta (Feature-First)
/src/features/campaigns/
  ├── components/
  │   ├── CreateCampaignButton/
  │   │   ├── index.tsx       // Lógica e View
  │   │   ├── animations.ts   // Variantes do Framer Motion
  │   │   └── useSound.ts     // Hooks de som
  ├── hooks/
  └── api/
```

### 3.2 Padrão "Smart vs Dumb" (Container/Presentational)
- **Smart Containers:** Gerenciam estado (Zustand/React Query) e lógica de negócio.
- **Dumb Components:** Recebem dados via props e focam puramente em UI e Feedback Visual. Isso facilita a manutenção e testes.

---

## 4. 🎮 Fase 4: Implementação da Experiência (CX/Gamification)

A implementação deve focar em fazer o software parecer "vivo".

### 4.1 Interações Vivas (Physics-based Animation)
NUNCA use transições lineares para elementos de UI que se movem. Use física (springs).

```typescript
// Padrão 2026 para Framer Motion
<motion.div
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
```

### 4.2 Feedback Multisensorial (Sound Design)
Use `use-sound` para feedbacks sutis.
- **Sucesso:** Som agudo, curto e harmonioso.
- **Erro:** Som grave ou dissonante, mas suave.
- **Clique:** "Click" mecânico satisfatório ou "pop".
*Nota: Sempre ofereça opção de mute global.*

### 4.3 Onboarding Contextual (Gamified Learning)
Não use manuais. Use `react-joyride` para guiar o usuário na primeira visita.
- Crie um tour que "desbloqueia" funcionalidades conforme o usuário aprende.

---

## 5. 🧪 Fase 5: Validação, Neuro-Check & A11y Audit

### 5.1 O "Joy Check"
Antes do PR, faça as seguintes perguntas:
1. [ ] A interface responde instantaneamente (<100ms) ao toque/clique? (Mesmo que a API demore, a UI deve reagir).
2. [ ] Existe algum "salto" visual (Layout Shift) que quebre o foco visual?
3. [ ] O sucesso de uma ação é celebrado? (Toast, som, animação).

### 5.2 Performance Perceptiva
- Use Skeleton Screens (Radix/Shadcn) em vez de spinners brancos.
- Otimize LCP (Largest Contentful Paint) para que o usuário sinta que o app é instantâneo.

### 5.3 A11y Audit (Auditoria de Acessibilidade)

Antes de cada PR, execute:

1. [ ] **Teste de Teclado**: Navegue pela feature inteira sem mouse
2. [ ] **Teste de Leitor de Tela**: Use NVDA (Windows) ou VoiceOver (Mac)
3. [ ] **Axe DevTools**: Execute scan automático e corrija violações
4. [ ] **Contraste**: Verifique cores com WebAIM Contrast Checker
5. [ ] **Zoom**: Teste a UI em 200% de zoom no navegador

---

## Comandos Úteis

```bash
# Instalar dependências "Experience" e A11y
npm install framer-motion canvas-confetti use-sound react-joyride @lottiefiles/react-lottie-player
npm install -D @axe-core/react eslint-plugin-jsx-a11y
```

Use este workflow para garantir que cada feature entregue seja **funcional**, **viciante**, **prazerosa** e **acessível para todos**.
