---
description: Diretrizes essenciais de desenvolvimento - Índice principal (Gemini Protocol v2.0)
---

# 🚀 Gemini Protocol v2.0

> **Protocolo obrigatório de desenvolvimento para garantir qualidade, escalabilidade e manutenibilidade.**

## 📋 Módulos do Protocolo

Este protocolo é dividido em módulos especializados. Use `/gemini_[modulo]` para acessar:

| Comando | Descrição |
|---------|-----------|
| `/gemini_core` | Princípios SOLID, DRY, verificação pré-desenvolvimento, análise de impacto |
| `/gemini_architecture` | Estrutura de camadas, modularidade, padrões backend/frontend |
| `/gemini_quality` | Padrões de código, error handling, logging, segurança |
| `/gemini_performance` | Queries otimizadas, caching, async, paginação |
| `/gemini_validation` | Testes, checklists de validação, versionamento |

---

## ⚡ Regras Fundamentais (Quick Reference)

### 1. Verificação Pré-Desenvolvimento
- **Pesquise código existente** antes de implementar
- **Analise impactos** em outros módulos
- **Consulte documentação oficial** das tecnologias

### 2. Zero Regressão
> ⚠️ **JAMAIS** edite código sem garantia de que funcionalidades existentes permanecerão funcionando.

### 3. Conformidade com a Stack
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Frontend**: Next.js (App Router), React, TailwindCSS, Shadcn/ui

### 4. Princípios Obrigatórios
- **SOLID** - Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- **DRY** - Don't Repeat Yourself
- **KISS** - Keep It Simple
- **YAGNI** - You Aren't Gonna Need It

### 5. Checklist Rápido

**Antes de implementar:**
- [ ] Pesquisei código similar existente
- [ ] Analisei impactos em outros módulos
- [ ] Entendi o requisito completamente

**Depois de implementar:**
- [ ] Servidor inicia sem erros
- [ ] Funcionalidade funciona como esperado
- [ ] Funcionalidades existentes continuam funcionando
- [ ] Não há erros no console

---

## 📌 Adesão Obrigatória

Estas diretrizes são **MANDATÓRIAS** e devem ser verificadas a cada etapa do desenvolvimento.

**Para detalhes completos, consulte os módulos específicos.**
