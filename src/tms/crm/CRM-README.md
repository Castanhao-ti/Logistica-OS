# CRM Comercial LSW — Guia para ajustes de layout

Este é o módulo CRM B2B da LSW Distribuidora dentro do Painel de Gestão (`Logistica OS`).
Está em fase inicial — backend (PostgreSQL + n8n) **já está validado e operando** com dados
reais (9.281 clientes sincronizados, 4 BFFs ativos). O que falta é majoritariamente UI.

Este README é a referência para qualquer pessoa (humana ou IA, ex: Lovable) que vá ajustar
**apenas o visual** desta pasta.

---

## Regras inegociáveis

### 1. Mexer SOMENTE em `src/tms/crm/`
Qualquer arquivo fora desta pasta pertence a outro módulo (TMS, Descontos, Usuários, Auth).
Alterar `tms.css`, `descontos.css` ou componentes em `../components/` quebra módulos
em produção.

### 2. CSS usa **apenas o prefixo `crm-*`**
Todas as classes deste módulo começam com `crm-`. Não introduzir:
- `lsw-*` (reservado para o shell do painel)
- `dsc-*` (Descontos)
- `tms-*` (módulo TMS)
- classes utilitárias globais sem prefixo

Se precisar de um novo estilo, adicione em `crm.css` com a convenção `crm-<bloco>__<elemento>--<modificador>`.

### 3. Não trocar a stack
- **Vite + React 18 + TypeScript**
- **CSS puro** (sem Tailwind, sem styled-components, sem CSS-in-JS)
- Ícones: **`lucide-react`** já instalado — usar somente daí
- Sem novas dependências sem aprovação

### 4. Não tocar nas URLs das APIs (`crmApi` em `crm.ts`)
Os endpoints `lsw-crm-*` apontam para workflows n8n já em produção. Mudar nome, payload
ou shape de resposta quebra o backend. Se faltar dado na UI, peça para expandir o backend
— não invente endpoints novos.

Endpoints atuais (todos via `VITE_N8N_BASE` + path):

| Endpoint | Verbo | Função |
|---|---|---|
| `lsw-crm-resumo` | GET | KPIs agregados |
| `lsw-crm-clientes` | GET | Lista carteira priorizada |
| `lsw-crm-cliente?id=N` | GET | Detalhe + ações + oportunidades |
| `lsw-crm-acao` | POST | Registrar ação comercial |
| `lsw-crm-assumir` | POST | Atribuir cliente ao usuário logado |
| `lsw-crm-pegar-proximo` | POST | Auto-pegar top da fila (P0/P1/SDR/TOPO) |
| `lsw-crm-devolver` | POST | Devolver cliente ao pool |
| `lsw-crm-minha-agenda?email=…` | GET | 4 listas (vencidas/hoje/semana/sem próxima) |

### 5. Permissões
Em `crm.ts` existem 3 helpers que controlam visibilidade — **não remover**:
- `podeVerCrm(perfil)` → controla o menu lateral
- `podeOperarCrm(perfil)` → registrar ações, mover oportunidades
- `podeGerenciarCrm(perfil)` → gestão de carteira (admin/vendas)

---

## Estrutura dos arquivos

```
src/tms/crm/
├── CRM-README.md          ← este arquivo
├── CrmPage.tsx            ← entrypoint, controla as 8 abas
├── VisaoGeralTab.tsx      ← KPIs + distribuições
├── CarteiraTab.tsx        ← tabela pública + Pegar próximo + Assumir/Devolver
├── MinhaAgendaTab.tsx     ← cards agrupados por urgência
├── crm.css                ← TODO o estilo do módulo
├── crm.ts                 ← types, API client, labels, permissões, formatadores
├── useCrmClientes.ts      ← hook da Carteira
├── useCrmResumo.ts        ← hook da Visão geral
└── useMinhaAgenda.ts      ← hook da Minha agenda
```

### O que cada arquivo faz

- **`CrmPage.tsx`** — barra de tabs + subheader + roteia para o componente da aba ativa.
  Há 8 abas previstas; só 3 implementadas (`visao_geral`, `minha_agenda`, `carteira`).
  As outras 5 (`reativacao`, `sdr`, `carteira_luiz`, `oportunidades`, `relatorios`)
  mostram um `EmptyState` + card "em construção". Ao implementar uma, **remover do
  objeto `STUBS`** e renderizar o componente real abaixo do bloco `aba === 'carteira'`.

- **`crm.ts`** — única fonte de:
  - tipos do domínio (`ClienteCrm`, `AcaoComercial`, `Oportunidade`, enums)
  - cliente HTTP `crmApi`
  - permissões
  - formatadores: `fmtBRL`, `fmtCnpj`, `fmtData`, `fmtNum`, `iniciaisDe`
  - labels e mapas de tom (`STATUS_CLIENTE_LABELS`, `PRIORIDADE_TONE`, etc.)

  Reutilizar tudo daqui — não duplicar formatadores nos componentes.

- **`crm.css`** — usa as variáveis CSS do shell (`--lsw-*`) que ficam em `tms.css`.
  **Não redefinir cores nem fontes** — usar o que já está disponível como variável.

---

## Identidade visual (padrão LSW)

O painel inteiro segue a paleta laranja/cinza-petróleo da LSW. As variáveis de cor
estão em `src/tms/tms.css` no `:root`. As mais usadas:

| Variável | Uso |
|---|---|
| `--lsw-brand` | Laranja LSW (#ED8936-ish) — CTAs primários |
| `--lsw-bg` | Fundo principal |
| `--lsw-surface` | Fundo de cards |
| `--lsw-border` | Bordas suaves |
| `--lsw-text` / `--lsw-text-soft` | Tipografia primária/secundária |
| `--lsw-danger` / `--lsw-warn` / `--lsw-ok` | Estados |

**Não trocar a paleta.** Se quiser introduzir nova cor, adicionar como variável
`--crm-*` em `crm.css` e justificar.

### Densidade e tom
- Interface densa, parecida com ERP/Salesforce — não estilo SaaS B2C
- Bordas e sombras sutis (`0 1px 2px rgba(0,0,0,.04)` é o padrão)
- Tipografia: monospace (`crm-mono`) apenas em métricas numéricas
- Não usar emojis decorativos — usar ícones `lucide-react`

---

## Estados especiais que **precisam continuar funcionando**

1. **Toast de feedback** — `.crm-toast` aparece no canto após Assumir/Devolver/Pegar próximo.
2. **Owner badge** — quando `c.owner_email === user.email`, destacar visualmente que é "meu cliente".
3. **Disabled em botões busy** — durante chamadas POST, o botão clicado fica `disabled`. Não remover.
4. **`agendaKey` no CrmPage** — força refresh da Minha agenda quando algo muda na Carteira. Não remover esse padrão.
5. **Empty states** — Minha agenda tem 4 seções; cada uma pode estar vazia e tem mensagem específica.

---

## O que ainda falta (backlog visual)

Se a meta for adiantar telas pendentes:

1. **Modal "Registrar ação"** — substituir o botão `(em breve)` no `MinhaAgendaTab`.
   Backend (`lsw-crm-acao`) já existe. Campos: `tipo_acao`, `canal`, `resultado`,
   `observacao`, `proxima_acao`, `data_proxima_acao`.

2. **Kanban de Oportunidades** — aba `oportunidades`. Tabela `crm_oportunidades` já
   existe no banco. Etapas: NOVO → CONTATADO → QUALIFICADO → PROPOSTA → NEGOCIACAO → GANHO/PERDIDO.

3. **Aba Reativação** — filtra a Carteira por `faixa_acao_comercial` em
   `ATIVO_EM_RISCO_31_60 / INATIVO_RECENTE_61_120 / INATIVO_FRIO_121_180 / DORMINDO_ACIMA_180`.

4. **Aba SDR — Sem pedido** — filtra `status_cliente = 'SEM_PEDIDO'` (3.446 clientes).

5. **Aba Carteira Luiz** — filtra `eh_carteira_luiz = true` (364 clientes).

6. **Aba Relatórios** — produtividade por owner (view `vw_crm_produtividade_owner` já existe).

---

## Anti-padrões — coisas para NÃO fazer

- ❌ Adicionar Tailwind ou qualquer framework CSS
- ❌ Refatorar a estrutura de pastas (`crm/` deve continuar plana)
- ❌ Trocar `lucide-react` por outra biblioteca de ícones
- ❌ Substituir `fetch` no `crm.ts` por axios/swr/react-query
- ❌ Mover formatadores, types ou labels para fora de `crm.ts`
- ❌ Renomear classes CSS sem atualizar todos os componentes
- ❌ Comentar/desabilitar permissões "só para testar"
- ❌ Hardcodar URLs — sempre usar a base do env (`VITE_N8N_BASE`)
- ❌ Inventar campos no payload de API — bater no backend antes

---

## Como testar localmente

```bash
npm install
npm run dev
# abre em http://127.0.0.1:5173 (ou porta livre)
```

Login de desenvolvimento: o módulo respeita o `SessionUser` do `getSession()`.
Para forçar login como SDR/admin, ajustar o `localStorage.tms_session` no devtools.

A aba default do CRM é **Minha agenda** — se ela estiver vazia, ir em
**Carteira priorizada** e clicar em "Pegar próximo P0" para popular.
