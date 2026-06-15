import React, { useMemo, useState } from 'react';
import {
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  Send,
} from 'lucide-react';
import {
  fmtBRL,
  fmtData,
  fmtDataHora,
  podeDecidir,
  podeOperar,
  STATUS_ANALISE_LABELS,
  tomMargem,
  type AcaoAnalise,
  type DetalhePedido,
  type ItemPedido,
} from './descontos';
import { useDescontoDetalhe } from './useDescontoDetalhe';
import { AcaoModal } from './AcaoModal';
import type { SessionUser } from '../auth/auth';

type AbaItens = 'com_desconto' | 'com_acrescimo' | 'sem_variacao';

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
        classe: 'dsc-btn dsc-btn--primary',
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
  const [aba, setAba] = useState<AbaItens>('com_desconto');
  const [acaoAberta, setAcaoAberta] = useState<AcaoConfig | null>(null);

  const acoes = useMemo(
    () => (data ? acoesDisponiveis(data, user) : []),
    [data, user],
  );

  return (
    <div className="dsc-detail-overlay" onClick={onClose}>
      <div className="dsc-detail" onClick={e => e.stopPropagation()}>
        <div className="dsc-detail__topbar">
          <div className="dsc-detail__title-area">
            <div className="dsc-detail__pedido">
              Pedido #{data?.cabecalho?.numero_pedido_cliente ?? pedidoKey}
              {data && (
                <span className={`dsc-status dsc-status--${data.analise.status}`}>
                  {STATUS_ANALISE_LABELS[data.analise.status]}
                </span>
              )}
            </div>
            <div className="dsc-detail__sub">
              {data?.cabecalho?.nome_cliente ?? '—'}
              {data?.cabecalho?.data_solicitacao && (
                <> · solicitado em {fmtData(data.cabecalho.data_solicitacao)}</>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="dsc-btn dsc-btn--secondary"
              onClick={refresh}
              disabled={refreshing || loading}
              title="Atualizar"
            >
              <RefreshCw size={14} className={refreshing ? 'dsc-spin' : ''} />
              Atualizar
            </button>
            <button className="dsc-detail__close" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="dsc-detail__body">
          {loading && (
            <div className="dsc-loading">
              <Loader2 size={26} className="dsc-spin" />
              <p style={{ fontSize: 13 }}>Carregando detalhe…</p>
            </div>
          )}

          {error && !loading && (
            <div className="dsc-error-state">
              <AlertCircle size={28} />
              <p style={{ fontWeight: 600, fontSize: 13 }}>Não foi possível carregar o pedido.</p>
              <p style={{ fontSize: 12, color: 'var(--lsw-text-muted)' }}>{error}</p>
              <button className="dsc-btn dsc-btn--primary" onClick={refresh}>
                Tentar novamente
              </button>
            </div>
          )}

          {data && !loading && !error && (
            <>
              <CabecalhoCard detalhe={data} />
              <AnaliseCard
                detalhe={data}
                acoes={acoes}
                onAcao={setAcaoAberta}
              />
              <ItensSection
                detalhe={data}
                aba={aba}
                onAbaChange={setAba}
              />
            </>
          )}
        </div>
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

function CabecalhoCard({ detalhe }: { detalhe: DetalhePedido }) {
  const cab = detalhe.cabecalho;
  if (!cab) {
    return (
      <div className="dsc-summary">
        <div className="dsc-summary__col">
          <p style={{ fontSize: 13, color: 'var(--lsw-text-muted)' }}>
            Cabeçalho indisponível para este pedido.
          </p>
        </div>
      </div>
    );
  }

  const margemTom = tomMargem(cab.perc_margem);
  const margemFmt =
    cab.perc_margem == null
      ? '—'
      : `${cab.perc_margem.toFixed(1).replace('.', ',')}%`;

  return (
    <div className="dsc-summary">
      <div className="dsc-summary__col">
        <h3>Cliente</h3>
        <dl>
          <div className="dsc-summary__line">
            <dt>Nome</dt><dd>{cab.nome_cliente}</dd>
          </div>
          <div className="dsc-summary__line">
            <dt>Vendedor</dt><dd>{cab.nome_vendedor ?? '—'}</dd>
          </div>
          <div className="dsc-summary__line">
            <dt>Equipe</dt><dd>{cab.equipe_vendedor ?? '—'}</dd>
          </div>
          <div className="dsc-summary__line">
            <dt>Status pedido</dt><dd>{cab.status_pedido ?? '—'}</dd>
          </div>
          <div className="dsc-summary__line">
            <dt>SKUs</dt>
            <dd>{cab.qtde_skus_com_desconto}/{cab.qtde_skus} c/ desconto</dd>
          </div>
        </dl>
      </div>

      <div className="dsc-summary__col">
        <h3>Financeiro</h3>
        <dl>
          <div className="dsc-summary__line">
            <dt>Valor do pedido</dt><dd>{fmtBRL(cab.valor_pedido)}</dd>
          </div>
          <div className="dsc-summary__line">
            <dt>Desconto</dt>
            <dd className={cab.valor_desconto < 0 ? 'negative' : ''}>
              {fmtBRL(cab.valor_desconto)}
            </dd>
          </div>
          <div className="dsc-summary__line">
            <dt>Acréscimo</dt>
            <dd className={cab.valor_acrescimo > 0 ? 'positive' : ''}>
              {fmtBRL(cab.valor_acrescimo)}
            </dd>
          </div>
          <div className="dsc-summary__line">
            <dt>Custo total</dt><dd>{fmtBRL(cab.custo_total)}</dd>
          </div>
          <div className="dsc-summary__line">
            <dt>Lucro bruto</dt>
            <dd
              className={
                cab.lucro_bruto != null && cab.lucro_bruto < 0
                  ? 'negative'
                  : cab.lucro_bruto != null && cab.lucro_bruto > 0
                    ? 'positive'
                    : ''
              }
            >
              {fmtBRL(cab.lucro_bruto)}
            </dd>
          </div>
          <div className="dsc-summary__line">
            <dt>Margem</dt>
            <dd>
              <span className={`dsc-margem dsc-margem--${margemTom}`}>{margemFmt}</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function AnaliseCard({
  detalhe,
  acoes,
  onAcao,
}: {
  detalhe: DetalhePedido;
  acoes: AcaoConfig[];
  onAcao: (a: AcaoConfig) => void;
}) {
  const an = detalhe.analise;

  return (
    <div className="dsc-analise">
      <div className="dsc-analise__row">
        <div className="dsc-analise__status-info">
          <span className={`dsc-status dsc-status--${an.status}`}>
            {STATUS_ANALISE_LABELS[an.status]}
          </span>
          {an.operador && (
            <span style={{ fontSize: 12.5, color: 'var(--lsw-text-muted)' }}>
              em análise por <strong style={{ color: 'var(--lsw-text)' }}>{an.operador}</strong>
            </span>
          )}
        </div>
        {acoes.length > 0 && (
          <div className="dsc-analise__actions">
            {acoes.map(cfg => (
              <button key={cfg.acao} className={cfg.classe} onClick={() => onAcao(cfg)}>
                {cfg.icone}
                {cfg.rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      <dl className="dsc-analise__history">
        <div>
          <dt>Operador</dt>
          <dd>{an.operador ?? '—'}</dd>
          {an.observacao_operador && (
            <div className="dsc-analise__obs">{an.observacao_operador}</div>
          )}
        </div>
        <div>
          <dt>Gerente</dt>
          <dd>{an.gerente ?? '—'}</dd>
          {an.observacao_gerente && (
            <div className="dsc-analise__obs">{an.observacao_gerente}</div>
          )}
        </div>
        <div>
          <dt>Solicitado em</dt>
          <dd>{fmtDataHora(an.solicitado_em)}</dd>
        </div>
        <div>
          <dt>Decidido em</dt>
          <dd>{fmtDataHora(an.decidido_em)}</dd>
        </div>
      </dl>
    </div>
  );
}

const ABA_ROTULO: Record<AbaItens, string> = {
  com_desconto:  'Itens com desconto',
  com_acrescimo: 'Itens com acréscimo',
  sem_variacao:  'Itens sem variação',
};

function ItensSection({
  detalhe,
  aba,
  onAbaChange,
}: {
  detalhe: DetalhePedido;
  aba: AbaItens;
  onAbaChange: (a: AbaItens) => void;
}) {
  const counts: Record<AbaItens, number> = {
    com_desconto:  detalhe.itens.com_desconto.length,
    com_acrescimo: detalhe.itens.com_acrescimo.length,
    sem_variacao:  detalhe.itens.sem_variacao.length,
  };
  const itens = detalhe.itens[aba] ?? [];

  return (
    <div>
      <div className="dsc-tabs">
        {(Object.keys(ABA_ROTULO) as AbaItens[]).map(k => (
          <button
            key={k}
            className={`dsc-tab ${aba === k ? 'dsc-tab--active' : ''}`}
            onClick={() => onAbaChange(k)}
          >
            {ABA_ROTULO[k]}
            <span className="dsc-tab__count">{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="dsc-table-wrap">
        {itens.length === 0 ? (
          <div className="dsc-table-empty">Nenhum item nesta categoria.</div>
        ) : (
          <table className="dsc-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="num">Qtd</th>
                <th className="num">Preço tabela</th>
                <th className="num">Preço aplicado</th>
                <th className="num">Variação</th>
                <th className="num">Preço final</th>
                <th className="num">Custo unit.</th>
                <th className="num">Total item</th>
                <th className="num">Margem item</th>
              </tr>
            </thead>
            <tbody>
              {itens.map(item => (
                <LinhaItem key={item.produto_key} item={item} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
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

  return (
    <tr>
      <td className="dsc-table__produto">
        {item.descricao_produto ?? `Produto ${item.produto_key}`}
        <small>cod {item.produto_key}</small>
      </td>
      <td className="num">{item.quantidade}</td>
      <td className="num">{fmtBRL(item.preco_tabela)}</td>
      <td className="num">{fmtBRL(item.preco_aplicado)}</td>
      <td className={`num ${variacaoNegativa ? 'neg' : variacaoPositiva ? 'pos' : ''}`}>
        {fmtBRL(item.preco_variacao)}
      </td>
      <td className="num">{fmtBRL(item.preco_final)}</td>
      <td className="num">{fmtBRL(item.custo_unitario)}</td>
      <td className="num">{fmtBRL(item.valor_total_item)}</td>
      <td className="num">
        <span className={`dsc-margem dsc-margem--${margemTom}`}>{margemFmt}</span>
      </td>
    </tr>
  );
}
