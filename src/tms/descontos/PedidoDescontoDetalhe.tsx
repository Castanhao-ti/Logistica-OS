import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Minus,
  PlayCircle,
  RefreshCw,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import {
  fmtBRL,
  fmtData,
  fmtDataHora,
  fmtPerc,
  iniciaisVendedor,
  isFaturado,
  percDesconto,
  podeDecidir,
  podeOperar,
  STATUS_ANALISE_LABELS,
  type AcaoAnalise,
  type DetalhePedido,
  type ItemPedido,
} from './descontos';
import { useDescontoDetalhe } from './useDescontoDetalhe';
import { AcaoModal } from './AcaoModal';
import type { SessionUser } from '../auth/auth';

interface AcaoConfig {
  acao: AcaoAnalise;
  rotulo: string;
  classe: string;
  icone: React.ReactNode;
  observacaoObrigatoria?: boolean;
}

function acoesDisponiveis(
  detalhe: DetalhePedido,
  user: SessionUser,
): AcaoConfig[] {
  const status = detalhe.analise.status;
  const acoes: AcaoConfig[] = [];

  if (podeOperar(user.perfil)) {
    if (status === 'pendente') {
      acoes.push({
        acao: 'iniciar_analise',
        rotulo: 'Iniciar análise',
        classe: 'pdm-btn pdm-btn--primary',
        icone: <PlayCircle size={18} />,
      });
    }
    if (status === 'em_analise') {
      acoes.push({
        acao: 'solicitar_aprovacao',
        rotulo: 'Solicitar aprovação',
        classe: 'pdm-btn pdm-btn--primary',
        icone: <Send size={16} />,
      });
    }
  }

  if (podeDecidir(user.perfil) && status === 'aguardando_aprovacao') {
    acoes.push({
      acao: 'aprovar',
      rotulo: 'Aprovar',
      classe: 'pdm-btn pdm-btn--success',
      icone: <CheckCircle2 size={16} />,
    });
    acoes.push({
      acao: 'reprovar',
      rotulo: 'Reprovar',
      classe: 'pdm-btn pdm-btn--danger',
      icone: <XCircle size={16} />,
      observacaoObrigatoria: true,
    });
  }

  return acoes;
}

interface Props {
  pedidoKey: string | number;
  user: SessionUser;
  onClose: () => void;
  onAcaoOk: (msg: string) => void;
}

export function PedidoDescontoDetalhe({
  pedidoKey,
  user,
  onClose,
  onAcaoOk,
}: Props) {
  const { data, loading, refreshing, error, refresh } = useDescontoDetalhe(pedidoKey);
  const [acaoAberta, setAcaoAberta] = useState<AcaoConfig | null>(null);

  const acoes = useMemo(
    () => (data ? acoesDisponiveis(data, user) : []),
    [data, user],
  );

  const numero = data?.cabecalho?.numero_pedido_cliente ?? String(pedidoKey);
  const dataSolic = data?.cabecalho?.data_solicitacao
    ? fmtData(data.cabecalho.data_solicitacao)
    : null;
  const cliente = data?.cabecalho?.nome_cliente ?? '—';

  return (
    <div className="pdm-overlay" onClick={onClose}>
      <div
        className="pdm-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={`Análise do pedido ${numero}`}
      >
        {/* Header */}
        <header className="pdm-modal__head">
          <div className="pdm-modal__head-main">
            <div className="pdm-modal__title-row">
              <h1 className="pdm-modal__numero">#{numero}</h1>
              <span className="pdm-modal__pfv">PFV {pedidoKey}</span>
              {data && (
                <span className={`pdm-status pdm-status--${data.analise.status}`}>
                  <span className="pdm-status__dot" />
                  {STATUS_ANALISE_LABELS[data.analise.status]}
                </span>
              )}
              {data && isFaturado(data.cabecalho?.status_pedido) && (
                <span className="pdm-status pdm-status--nf" title="Faturado com NF">
                  NF
                </span>
              )}
            </div>
            <p className="pdm-modal__sub">
              {cliente}
              {dataSolic ? ` · ${dataSolic}` : ''}
            </p>
          </div>
          <div className="pdm-modal__head-actions">
            <button
              className="pdm-iconbtn"
              onClick={refresh}
              disabled={refreshing || loading}
              title="Atualizar"
              aria-label="Atualizar"
            >
              <RefreshCw size={20} className={refreshing ? 'pdm-spin' : ''} />
            </button>
            <button
              className="pdm-iconbtn"
              onClick={onClose}
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="pdm-modal__body">
          {loading && (
            <div className="pdm-skeleton">
              <Loader2 className="pdm-spin" size={26} />
              <p>Carregando análise…</p>
            </div>
          )}

          {error && !loading && (
            <div className="pdm-error">
              <AlertCircle size={28} />
              <p style={{ fontWeight: 600, fontSize: 14 }}>Não foi possível carregar.</p>
              <p style={{ fontSize: 13 }}>{error}</p>
              <button className="pdm-btn pdm-btn--primary" onClick={refresh}>
                Tentar novamente
              </button>
            </div>
          )}

          {data && !loading && !error && (
            <>
              <MetricasGrid detalhe={data} />
              <div className="pdm-row">
                <VendedorBlock detalhe={data} />
                <AnaliseBlock detalhe={data} />
              </div>
              <ItensSections detalhe={data} />
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="pdm-modal__footer">
          <button className="pdm-btn pdm-btn--ghost" onClick={onClose}>
            Fechar
          </button>
          {data && !loading && !error && acoes.length > 0 && (
            <div className="pdm-modal__footer-actions">
              {acoes.map(cfg => (
                <button key={cfg.acao} className={cfg.classe} onClick={() => setAcaoAberta(cfg)}>
                  {cfg.icone}
                  {cfg.rotulo}
                </button>
              ))}
            </div>
          )}
        </footer>
      </div>

      {acaoAberta && data && (
        <AcaoModal
          pedido={data}
          acao={acaoAberta.acao}
          usuario={user.nome}
          observacaoObrigatoria={acaoAberta.observacaoObrigatoria}
          onClose={() => setAcaoAberta(null)}
          onSuccess={() => {
            const titulo = acaoAberta.rotulo;
            setAcaoAberta(null);
            refresh();
            onAcaoOk(`${titulo} aplicado(a) com sucesso.`);
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────── Métricas (3 cards) ───────────────────── */

function MetricasGrid({ detalhe }: { detalhe: DetalhePedido }) {
  const cab = detalhe.cabecalho;
  if (!cab) {
    return (
      <div className="pdm-metric-grid">
        <p>Cabeçalho indisponível.</p>
      </div>
    );
  }
  const percDesc = percDesconto(cab.valor_pedido, cab.valor_desconto, cab.valor_acrescimo);
  const margemNeg = cab.perc_margem != null && cab.perc_margem < 0;
  const descontoNeg = cab.valor_desconto < 0;

  return (
    <section className="pdm-metric-grid">
      <div className="pdm-metric-card">
        <h3 className="pdm-metric-card__label">Valor total</h3>
        <div className="pdm-metric-card__value">{fmtBRL(cab.valor_pedido)}</div>
        <div className="pdm-metric-card__sub">
          {cab.qtde_skus_com_desconto}/{cab.qtde_skus} SKUs c/ desconto
        </div>
      </div>
      <div className="pdm-metric-card">
        <h3 className="pdm-metric-card__label">Desconto</h3>
        <div
          className={`pdm-metric-card__value ${descontoNeg ? 'pdm-metric-card__value--neg' : ''}`}
        >
          {descontoNeg && <ArrowDownRight size={22} className="pdm-metric-card__arrow" />}
          {fmtBRL(cab.valor_desconto)}
        </div>
        <div className="pdm-metric-card__sub">{fmtPerc(percDesc)} sobre tabela</div>
      </div>
      <div className="pdm-metric-card">
        <h3 className="pdm-metric-card__label">Margem</h3>
        <div
          className={`pdm-metric-card__value ${margemNeg ? 'pdm-metric-card__value--neg' : ''}`}
        >
          {margemNeg && <ArrowDownRight size={22} className="pdm-metric-card__arrow" />}
          {cab.perc_margem == null
            ? '—'
            : `${cab.perc_margem.toFixed(1).replace('.', ',')}%`}
        </div>
        <div className="pdm-metric-card__sub">Lucro {fmtBRL(cab.lucro_bruto)}</div>
      </div>
    </section>
  );
}

/* ───────────────────── Vendedor ───────────────────── */

function VendedorBlock({ detalhe }: { detalhe: DetalhePedido }) {
  const cab = detalhe.cabecalho;
  if (!cab) return null;
  return (
    <section className="pdm-block">
      <h2 className="pdm-block__title">Vendedor responsável</h2>
      <div className="pdm-vendedor">
        <span className="pdm-vendedor__avatar">{iniciaisVendedor(cab.nome_vendedor)}</span>
        <div>
          <div className="pdm-vendedor__nome">{cab.nome_vendedor ?? '—'}</div>
          <div className="pdm-vendedor__meta">
            {cab.equipe_vendedor ?? 'Sem equipe'}
            {cab.status_pedido && <> · {cab.status_pedido}</>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Análise ───────────────────── */

function AnaliseBlock({ detalhe }: { detalhe: DetalhePedido }) {
  const a = detalhe.analise;
  return (
    <section className="pdm-block">
      <h2 className="pdm-block__title">Análise</h2>
      <div className="pdm-analise">
        <div className="pdm-analise__field">
          <span className="pdm-analise__label">Operador</span>
          <span className="pdm-analise__value">{a.operador ?? '—'}</span>
        </div>
        <div className="pdm-analise__field">
          <span className="pdm-analise__label">Gerente</span>
          <span className="pdm-analise__value">{a.gerente ?? '—'}</span>
        </div>
        <div className="pdm-analise__field">
          <span className="pdm-analise__label">Solicitado em</span>
          <span className="pdm-analise__value">{fmtDataHora(a.solicitado_em) || '—'}</span>
        </div>
        <div className="pdm-analise__field">
          <span className="pdm-analise__label">Decidido em</span>
          <span className="pdm-analise__value">{fmtDataHora(a.decidido_em) || '—'}</span>
        </div>
        {a.observacao_operador && (
          <div className="pdm-analise__obs">
            <strong>Operador:</strong> {a.observacao_operador}
          </div>
        )}
        {a.observacao_gerente && (
          <div className="pdm-analise__obs">
            <strong>Gerente:</strong> {a.observacao_gerente}
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────── Itens (3 seções) ───────────────────── */

const SECAO_CONFIG = {
  com_desconto: {
    titulo: 'Itens com desconto',
    icone: <ArrowDownRight size={18} />,
    classe: 'pdm-items__group--desconto',
    expandidoDefault: true,
  },
  com_acrescimo: {
    titulo: 'Itens com acréscimo',
    icone: <ArrowUpRight size={18} />,
    classe: 'pdm-items__group--acrescimo',
    expandidoDefault: false,
  },
  sem_variacao: {
    titulo: 'Itens sem variação',
    icone: <Minus size={18} />,
    classe: 'pdm-items__group--neutro',
    expandidoDefault: false,
  },
} as const;

type ChaveSecao = keyof typeof SECAO_CONFIG;

function ItensSections({ detalhe }: { detalhe: DetalhePedido }) {
  const ordem: ChaveSecao[] = ['com_desconto', 'com_acrescimo', 'sem_variacao'];
  return (
    <section className="pdm-block">
      <h2 className="pdm-block__title">Itens do pedido</h2>
      <div className="pdm-items">
        {ordem.map(k => {
          const cfg = SECAO_CONFIG[k];
          const itens = detalhe.itens[k] ?? [];
          return (
            <ItensGroup
              key={k}
              titulo={cfg.titulo}
              icone={cfg.icone}
              classe={cfg.classe}
              itens={itens}
              defaultOpen={cfg.expandidoDefault && itens.length > 0}
            />
          );
        })}
      </div>
    </section>
  );
}

function ItensGroup({
  titulo,
  icone,
  classe,
  itens,
  defaultOpen,
}: {
  titulo: string;
  icone: React.ReactNode;
  classe: string;
  itens: ItemPedido[];
  defaultOpen: boolean;
}) {
  const [aberto, setAberto] = useState(defaultOpen);
  return (
    <div className={`pdm-items__group ${classe}`}>
      <div
        className="pdm-items__head"
        onClick={() => setAberto(v => !v)}
        role="button"
        aria-expanded={aberto}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setAberto(v => !v);
          }
        }}
      >
        <div className="pdm-items__title-side">
          <span className="pdm-items__icon-wrap">{icone}</span>
          <h3 className="pdm-items__title">{titulo}</h3>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span className="pdm-items__count">{itens.length}</span>
          <ChevronDown
            size={18}
            className={`pdm-items__chevron ${aberto ? 'pdm-items__chevron--open' : ''}`}
          />
        </div>
      </div>
      {aberto && (
        <div className="pdm-items__body">
          {itens.length === 0 ? (
            <div className="pdm-items__empty">Nenhum item.</div>
          ) : (
            <div className="pdm-items__table-wrap">
              <table className="pdm-items__table">
                <thead>
                  <tr>
                    <th>SKU · Descrição</th>
                    <th className="num">Qtd</th>
                    <th className="num">Tabela</th>
                    <th className="num">Praticado</th>
                    <th className="num">Variação un.</th>
                    <th className="num">Variação tot.</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map(item => (
                    <LinhaItem key={item.produto_key} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LinhaItem({ item }: { item: ItemPedido }) {
  const variacaoNegativa = item.preco_variacao < 0;
  const variacaoPositiva = item.preco_variacao > 0;
  const variacaoTotal = item.quantidade * item.preco_variacao;
  const desc = item.descricao_produto ?? `Produto ${item.produto_key}`;
  const [head, ...rest] = desc.split(/(?:\s+)(?=\d|[A-Z]{3,}|CX\b|UN\b|G\s+|ML\s+)/i);

  return (
    <tr>
      <td>
        <div className="pdm-items__produto">
          <span className="pdm-items__sku">{item.produto_key}</span>
          <span className="pdm-items__desc">{head}</span>
          {rest.length > 0 && (
            <span className="pdm-items__desc-sub">{rest.join(' ').trim()}</span>
          )}
        </div>
      </td>
      <td className="num">{item.quantidade}</td>
      <td className="num">{fmtBRL(item.preco_tabela)}</td>
      <td className="num">{fmtBRL(item.preco_aplicado)}</td>
      <td className={`num ${variacaoNegativa ? 'neg' : variacaoPositiva ? 'pos' : ''}`}>
        {fmtBRL(item.preco_variacao)}
      </td>
      <td className={`num ${variacaoNegativa ? 'neg' : variacaoPositiva ? 'pos' : ''}`}>
        {fmtBRL(variacaoTotal)}
      </td>
    </tr>
  );
}
