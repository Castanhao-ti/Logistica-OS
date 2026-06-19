import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Minus,
  Play,
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
  MARGEM_TONE,
  STATUS_ANALISE_LABELS,
  STATUS_ANALISE_TONE,
  tomMargem,
  type AcaoAnalise,
  type DetalhePedido,
  type ItemPedido,
} from './descontos';
import { useDescontoDetalhe } from './useDescontoDetalhe';
import { AcaoModal } from './AcaoModal';
import type { SessionUser } from '../auth/auth';
import { StatusChip } from '../components/StatusChip';
import { SkeletonKpiCard, SkeletonRow } from '../components/Skeleton';

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
        classe: 'dsc-btn dsc-btn--success',
        icone: <Play size={14} />,
      });
    }
    if (status === 'em_analise') {
      acoes.push({
        acao: 'solicitar_aprovacao',
        rotulo: 'Solicitar aprovação',
        classe: 'dsc-btn dsc-btn--primary',
        icone: <Send size={14} />,
      });
    }
  }

  if (podeDecidir(user.perfil) && status === 'aguardando_aprovacao') {
    acoes.push({
      acao: 'aprovar',
      rotulo: 'Aprovar',
      classe: 'dsc-btn dsc-btn--success',
      icone: <CheckCircle2 size={14} />,
    });
    acoes.push({
      acao: 'reprovar',
      rotulo: 'Reprovar',
      classe: 'dsc-btn dsc-btn--danger',
      icone: <XCircle size={14} />,
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

  return (
    <div className="dsc-sheet-overlay" onClick={onClose}>
      <aside
        className="dsc-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={`Detalhe do pedido ${pedidoKey}`}
      >
        {/* Cabeçalho do sheet */}
        <header className="dsc-sheet__head">
          <div className="dsc-sheet__head-main">
            <div className="dsc-sheet__title-line">
              <h2 className="dsc-sheet__numero">
                #{data?.cabecalho?.numero_pedido_cliente ?? pedidoKey}
              </h2>
              <span className="dsc-card__pfv">PFV {pedidoKey}</span>
              {data && (
                <StatusChip tone={STATUS_ANALISE_TONE[data.analise.status]}>
                  {STATUS_ANALISE_LABELS[data.analise.status]}
                </StatusChip>
              )}
              {data && isFaturado(data.cabecalho?.status_pedido) && (
                <StatusChip tone="transito" title="Faturado com NF">NF</StatusChip>
              )}
            </div>
            <div className="dsc-sheet__sub">
              {data?.cabecalho?.nome_cliente ?? '—'}
              {data?.cabecalho?.data_solicitacao && (
                <> · {fmtData(data.cabecalho.data_solicitacao)}</>
              )}
            </div>
          </div>
          <div className="dsc-sheet__head-actions">
            <button
              className="dsc-icon-btn"
              onClick={refresh}
              disabled={refreshing || loading}
              title="Atualizar"
              aria-label="Atualizar"
            >
              <RefreshCw size={15} className={refreshing ? 'dsc-spin' : ''} />
            </button>
            <button
              className="dsc-icon-btn"
              onClick={onClose}
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Corpo */}
        <div className="dsc-sheet__body">
          {loading && (
            <div className="dsc-sheet__skeleton">
              <div className="kpi-grid kpi-grid--3">
                <SkeletonKpiCard />
                <SkeletonKpiCard />
                <SkeletonKpiCard />
              </div>
              <table className="tms-table">
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cells={5} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && !loading && (
            <div className="dsc-error-state">
              <AlertCircle size={28} />
              <p style={{ fontWeight: 600, fontSize: 13 }}>Não foi possível carregar.</p>
              <p style={{ fontSize: 12, color: 'var(--lsw-text-muted)' }}>{error}</p>
              <button className="dsc-btn dsc-btn--primary" onClick={refresh}>
                Tentar novamente
              </button>
            </div>
          )}

          {data && !loading && !error && (
            <>
              <MetricasGrid detalhe={data} />
              <VendedorBlock detalhe={data} />
              <AnaliseBlock detalhe={data} />
              <ItensSections detalhe={data} />
            </>
          )}
        </div>

        {/* Rodapé com ações */}
        {data && !loading && !error && acoes.length > 0 && (
          <footer className="dsc-sheet__footer">
            <button className="dsc-btn dsc-btn--ghost" onClick={onClose}>
              Fechar
            </button>
            <div className="dsc-sheet__footer-actions">
              {acoes.map(cfg => (
                <button key={cfg.acao} className={cfg.classe} onClick={() => setAcaoAberta(cfg)}>
                  {cfg.icone}
                  {cfg.rotulo}
                </button>
              ))}
            </div>
          </footer>
        )}
      </aside>

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
      <div className="dsc-metric-grid">
        <p style={{ fontSize: 13, color: 'var(--lsw-text-muted)' }}>
          Cabeçalho indisponível.
        </p>
      </div>
    );
  }
  const percDesc = percDesconto(cab.valor_pedido, cab.valor_desconto, cab.valor_acrescimo);
  const margemTom = tomMargem(cab.perc_margem);

  return (
    <div className="dsc-metric-grid">
      <div className="dsc-metric-card">
        <span className="dsc-metric-card__label">Valor total</span>
        <span className="dsc-metric-card__value">{fmtBRL(cab.valor_pedido)}</span>
        <span className="dsc-metric-card__sub">
          {cab.qtde_skus_com_desconto}/{cab.qtde_skus} SKUs c/ desconto
        </span>
      </div>
      <div className="dsc-metric-card">
        <span className="dsc-metric-card__label">Desconto</span>
        <span className={`dsc-metric-card__value ${cab.valor_desconto < 0 ? 'is-negative' : ''}`}>
          {fmtBRL(cab.valor_desconto)}
        </span>
        <span className="dsc-metric-card__sub">{fmtPerc(percDesc)} sobre tabela</span>
      </div>
      <div className="dsc-metric-card">
        <span className="dsc-metric-card__label">Margem</span>
        <span className={`dsc-metric-card__value dsc-metric-card__value--${margemTom}`}>
          {cab.perc_margem == null
            ? '—'
            : `${cab.perc_margem.toFixed(1).replace('.', ',')}%`}
        </span>
        <span className="dsc-metric-card__sub">
          Lucro {fmtBRL(cab.lucro_bruto)}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────── Vendedor ───────────────────── */

function VendedorBlock({ detalhe }: { detalhe: DetalhePedido }) {
  const cab = detalhe.cabecalho;
  if (!cab) return null;
  return (
    <section className="dsc-block">
      <h3 className="dsc-block__title">Vendedor responsável</h3>
      <div className="dsc-vendedor-card">
        <span className="dsc-avatar dsc-avatar--lg">
          {iniciaisVendedor(cab.nome_vendedor)}
        </span>
        <div>
          <div className="dsc-vendedor-card__nome">{cab.nome_vendedor ?? '—'}</div>
          <div className="dsc-vendedor-card__meta">
            {cab.equipe_vendedor ?? 'Sem equipe'}
            {cab.status_pedido && (
              <> · <span className="dsc-vendedor-card__status">{cab.status_pedido}</span></>
            )}
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
    <section className="dsc-block">
      <h3 className="dsc-block__title">Análise</h3>
      <dl className="dsc-analise-history">
        <div>
          <dt>Operador</dt>
          <dd>{a.operador ?? '—'}</dd>
          {a.observacao_operador && (
            <div className="dsc-analise-obs">{a.observacao_operador}</div>
          )}
        </div>
        <div>
          <dt>Gerente</dt>
          <dd>{a.gerente ?? '—'}</dd>
          {a.observacao_gerente && (
            <div className="dsc-analise-obs">{a.observacao_gerente}</div>
          )}
        </div>
        <div>
          <dt>Solicitado em</dt>
          <dd>{fmtDataHora(a.solicitado_em)}</dd>
        </div>
        <div>
          <dt>Decidido em</dt>
          <dd>{fmtDataHora(a.decidido_em)}</dd>
        </div>
      </dl>
    </section>
  );
}

/* ───────────────────── Itens (3 seções) ───────────────────── */

const SECAO_CONFIG = {
  com_desconto: {
    titulo: 'Itens com desconto',
    icone: <ArrowDownRight size={14} />,
    classe: 'dsc-items-section--desconto',
  },
  com_acrescimo: {
    titulo: 'Itens com acréscimo',
    icone: <ArrowUpRight size={14} />,
    classe: 'dsc-items-section--acrescimo',
  },
  sem_variacao: {
    titulo: 'Itens sem variação',
    icone: <Minus size={14} />,
    classe: 'dsc-items-section--neutro',
  },
} as const;

type ChaveSecao = keyof typeof SECAO_CONFIG;

function ItensSections({ detalhe }: { detalhe: DetalhePedido }) {
  const ordem: ChaveSecao[] = ['com_desconto', 'com_acrescimo', 'sem_variacao'];
  return (
    <section className="dsc-block">
      <h3 className="dsc-block__title">Itens do pedido</h3>
      {ordem.map(k => {
        const cfg = SECAO_CONFIG[k];
        const itens = detalhe.itens[k] ?? [];
        return (
          <div key={k} className={`dsc-items-section ${cfg.classe}`}>
            <div className="dsc-items-section__head">
              <span className="dsc-items-section__icon">{cfg.icone}</span>
              <span className="dsc-items-section__title">{cfg.titulo}</span>
              <span className="dsc-items-section__count">{itens.length}</span>
            </div>
            {itens.length === 0 ? (
              <div className="dsc-items-section__empty">Nenhum item.</div>
            ) : (
              <div className="dsc-items-table-wrap">
                <table className="dsc-items-table">
                  <thead>
                    <tr>
                      <th>SKU · Descrição</th>
                      <th className="num">Qtd</th>
                      <th className="num">Tabela</th>
                      <th className="num">Praticado</th>
                      <th className="num">Variação un.</th>
                      <th className="num">Variação total</th>
                      <th className="num">Margem</th>
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
        );
      })}
    </section>
  );
}

function LinhaItem({ item }: { item: ItemPedido }) {
  const variacaoNegativa = item.preco_variacao < 0;
  const variacaoPositiva = item.preco_variacao > 0;
  const margemTom = tomMargem(item.perc_margem_item);
  const margemFmt =
    item.perc_margem_item == null
      ? '—'
      : `${item.perc_margem_item.toFixed(1).replace('.', ',')}%`;
  const variacaoTotal = item.quantidade * item.preco_variacao;

  return (
    <tr>
      <td className="dsc-items-table__produto">
        <span className="dsc-items-table__sku">{item.produto_key}</span>
        <span className="dsc-items-table__desc">
          {item.descricao_produto ?? `Produto ${item.produto_key}`}
        </span>
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
      <td className="num">
        <StatusChip tone={MARGEM_TONE[margemTom]}>{margemFmt}</StatusChip>
      </td>
    </tr>
  );
}
