import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ordersApi, carriersApi } from '../api';
import type { Carrier, Filters, Order } from '../types';
import { VIAMEX_UNITS } from '../types';
import CarrierTag from '../components/CarrierTag';
import BatchActionBar from '../components/BatchActionBar';
import KpiRow from '../components/KpiRow';
import NotasFiscaisTable from '../components/NotasFiscaisTable';
import { StatusChip, type StatusTone } from '../components/StatusChip';
import { SkeletonRow } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Package } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtW = (v: number | null) =>
  v != null ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg` : '—';
const fmtCep = (v: string) => v.replace(/^(\d{5})(\d{3})$/, '$1-$2');

interface Props {
  onCountChange: (n: number) => void;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [StatusTone, string]> = {
    pending: ['pendente', 'Aguardando'],
    approved: ['entregue', '✓ Aprovado'],
    in_load: ['transito', 'Em Carga'],
    alert_value: ['prioritario', '⚠ Alto Valor'],
    forced_cep: ['prioritario', 'Rota Exclusiva'],
  };
  const [tone, label] = map[status] ?? ['pendente', status];
  return <StatusChip tone={tone}>{label}</StatusChip>;
}

export default function OperacaoPanel({ onCountChange }: Props) {
  const [tab, setTab] = useState<'pending' | 'history' | 'invoices'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Filters>({
    search: '', city: '', bairro: '', minValue: '', maxValue: '', carrierId: '', unit: '', nfCarrier: '', tracking: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [ordData, carData] = await Promise.all([
        tab === 'pending' ? ordersApi.pending() : ordersApi.history(),
        carriers.length ? Promise.resolve({ carriers }) : carriersApi.list(),
      ]);
      setOrders(ordData.pedidos ?? []);
      if (!carriers.length) setCarriers(carData.carriers ?? []);
      if (tab === 'pending') onCountChange(ordData.total ?? 0);
    } catch (e) {
      setError('Erro ao carregar pedidos. Verifique a conexão com o n8n.');
    } finally {
      setLoading(false);
    }
  }, [tab, carriers.length, onCountChange]);

  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    setFilters(f => ({ ...f, carrierId: '', unit: '', nfCarrier: '', tracking: '' }));
    loadData();
    const id = setInterval(loadData, 30_000);
    return () => clearInterval(id);
  }, [loadData]);

  const filtered = useMemo(() => {
    const s = filters.search.toLowerCase();
    const min = filters.minValue ? parseFloat(filters.minValue) : null;
    const max = filters.maxValue ? parseFloat(filters.maxValue) : null;
    return orders.filter(o => {
      if (s && !o.nome_razao_cliente.toLowerCase().includes(s) &&
          !o.pedido_forca_venda_key.includes(filters.search) &&
          !String(o.numero_pedido_cliente ?? '').includes(filters.search) &&
          !o.cep.includes(filters.search)) return false;
      if (filters.city && !o.cidade.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.bairro && !(o.bairro ?? '').toLowerCase().includes(filters.bairro.toLowerCase())) return false;
      if (min !== null && o.valor_pedido < min) return false;
      if (max !== null && o.valor_pedido > max) return false;
      if (tab === 'invoices') {
        if (filters.nfCarrier && (o.nome_transportadora_nf ?? '') !== filters.nfCarrier) return false;
        if (filters.tracking === '__none__') {
          if (o.ultima_ocorrencia_status) return false;
        } else if (filters.tracking && o.ultima_ocorrencia_status !== filters.tracking) {
          return false;
        }
      } else {
        if (filters.carrierId &&
            o.suggested_carrier_id !== filters.carrierId &&
            o.assigned_carrier_id !== filters.carrierId) return false;
        if (filters.unit && o.viamex_unit !== filters.unit) return false;
      }
      return true;
    });
  }, [orders, filters, tab]);

  const nfCarriers = useMemo(
    () => Array.from(new Set(orders.map(o => o.nome_transportadora_nf).filter((c): c is string => Boolean(c)))).sort(),
    [orders]
  );
  const trackingStatuses = useMemo(
    () => Array.from(new Set(orders.map(o => o.ultima_ocorrencia_status).filter((t): t is string => Boolean(t)))).sort(),
    [orders]
  );

  const pendingCount = useMemo(
    () => orders.filter(o => o.routing_status !== 'approved' && o.routing_status !== 'in_load').length,
    [orders]
  );

  const selectableFiltered = useMemo(
    () => filtered.filter(o => o.routing_status !== 'approved' && o.routing_status !== 'in_load'),
    [filtered]
  );
  const allSelected = selectableFiltered.length > 0 && selected.size === selectableFiltered.length;

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectableFiltered.map(o => o.id)));

  const handleApprove = async (order: Order, forceCarrierId?: string) => {
    const carrierId = forceCarrierId ?? overrides[order.id] ?? order.suggested_carrier_id;
    if (!carrierId) return;
    setApprovingId(order.id);
    try {
      await ordersApi.approve(order.id, carrierId);
      setOrders(prev => prev.map(o =>
        o.id === order.id
          ? { ...o, routing_status: 'approved', assigned_carrier_id: carrierId }
          : o
      ));
      setSelected(prev => { const n = new Set(prev); n.delete(order.id); return n; });
    } catch {
      alert('Erro ao aprovar pedido. Tente novamente.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleHighValue = async (order: Order, action: 'frota' | 'liberar') => {
    const carrier = action === 'frota'
      ? carriers.find(c => c.name.toLowerCase().includes('frota'))
      : carriers.find(c => c.id !== carriers.find(x => x.name.toLowerCase().includes('frota'))?.id);
    if (carrier) await handleApprove(order, carrier.id);
  };

  const batchStats = useMemo(() => {
    const sel = orders.filter(o => selected.has(o.id));
    return {
      count: sel.length,
      value: sel.reduce((a, o) => a + Number(o.valor_pedido), 0),
      weight: sel.reduce((a, o) => a + Number(o.peso_pedido ?? 0), 0),
    };
  }, [orders, selected]);

  const handleBatchApprove = async () => {
    try {
      await ordersApi.batchApprove(Array.from(selected));
      setSelected(new Set());
      await loadData();
    } catch {
      alert('Erro ao gerar carga. Tente novamente.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const clearFilters = () => setFilters({ search: '', city: '', bairro: '', minValue: '', maxValue: '', carrierId: '', unit: '', nfCarrier: '', tracking: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      {tab === 'pending' && !loading && <KpiRow orders={orders} />}

      <div className="tms-tabs">
        <button
          className={`tms-tab ${tab === 'pending' ? 'tms-tab--active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Para Roteirizar
          <span className={`tms-tab__badge ${tab !== 'pending' ? 'tms-tab__badge--neutral' : ''}`}>
            {pendingCount}
          </span>
        </button>
        <button
          className={`tms-tab ${tab === 'history' ? 'tms-tab--active' : ''}`}
          onClick={() => setTab('history')}
        >
          Faturados / Histórico
        </button>
        <button
          className={`tms-tab ${tab === 'invoices' ? 'tms-tab--active' : ''}`}
          onClick={() => setTab('invoices')}
        >
          Acompanhamento de Entrega
        </button>
      </div>

      <div className="tms-filters">
        <div className="tms-filters__search">
          <span className="tms-filters__search-icon">⌕</span>
          <input
            className="tms-input tms-input--search"
            placeholder="Cliente, nº pedido, CEP..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <input
          className="tms-input tms-input--sm"
          placeholder="Cidade"
          value={filters.city}
          onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
        />
        <input
          className="tms-input tms-input--sm"
          placeholder="Bairro"
          value={filters.bairro}
          onChange={e => setFilters(f => ({ ...f, bairro: e.target.value }))}
        />
        <span className="tms-filters__label">Valor:</span>
        <input
          className="tms-input tms-input--sm"
          placeholder="Mín R$"
          value={filters.minValue}
          onChange={e => setFilters(f => ({ ...f, minValue: e.target.value }))}
        />
        <input
          className="tms-input tms-input--sm"
          placeholder="Máx R$"
          value={filters.maxValue}
          onChange={e => setFilters(f => ({ ...f, maxValue: e.target.value }))}
        />
        {tab === 'invoices' ? (
          <>
            <select
              className="tms-select"
              value={filters.nfCarrier}
              onChange={e => setFilters(f => ({ ...f, nfCarrier: e.target.value }))}
            >
              <option value="">Todas transportadoras (NF)</option>
              {nfCarriers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="tms-select"
              value={filters.tracking}
              onChange={e => setFilters(f => ({ ...f, tracking: e.target.value }))}
            >
              <option value="">Todo rastreamento</option>
              <option value="__none__">Sem rastreio</option>
              {trackingStatuses.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </>
        ) : (
          <>
            <select
              className="tms-select"
              value={filters.carrierId}
              onChange={e => setFilters(f => ({ ...f, carrierId: e.target.value }))}
            >
              <option value="">Todas transportadoras</option>
              {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="tms-select"
              value={filters.unit}
              onChange={e => setFilters(f => ({ ...f, unit: e.target.value }))}
            >
              <option value="">Todas unidades (Viamex)</option>
              {VIAMEX_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </>
        )}
        {hasFilters && (
          <button className="tms-filters__clear" onClick={clearFilters}>✕ Limpar</button>
        )}
        <span className="tms-filters__count">
          {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
        </span>
        <button className="tms-btn-refresh" onClick={handleRefresh} disabled={refreshing} title="Atualizar pedidos">
          <span className={`tms-btn-refresh__icon ${refreshing ? 'tms-btn-refresh__icon--spin' : ''}`}>↻</span>
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: '10px 14px', marginBottom: 12, color: '#991B1B', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="tms-table-wrap">
        {loading ? (
          <table className="tms-table">
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} cells={5} />
              ))}
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={22} />}
            title={hasFilters ? 'Nenhum resultado para os filtros aplicados' : 'Nenhum pedido encontrado'}
            description={hasFilters ? 'Tente ajustar os filtros' : 'Aguarde a próxima sincronização com o Bluesoft'}
          />
        ) : tab === 'invoices' ? (
          <NotasFiscaisTable orders={filtered} />
        ) : (
          <table className="tms-table">
            <thead>
              <tr>
                {tab === 'pending' && (
                  <th>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </th>
                )}
                <th>Nº Pedido</th>
                <th>Cliente</th>
                <th>CEP / Cidade</th>
                <th>Valor</th>
                <th>Peso</th>
                <th>Transportadora Sugerida</th>
                {tab === 'pending' && <th>Ação</th>}
                {tab === 'history' && <th>Transportadora Usada</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const isAlert = order.routing_status === 'alert_value';
                const isForced = order.routing_status === 'forced_cep';
                const isDone = order.routing_status === 'approved' || order.routing_status === 'in_load';
                const rowClass = [
                  isAlert ? 'tms-row--alert' : '',
                  isForced ? 'tms-row--forced' : '',
                  isDone ? 'tms-row--approved' : '',
                ].filter(Boolean).join(' ');

                return (
                  <tr key={order.id} className={rowClass}>
                    {tab === 'pending' && (
                      <td>
                        {!isDone && (
                          <input
                            type="checkbox"
                            checked={selected.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                          />
                        )}
                      </td>
                    )}
                    <td>
                      <span className="tms-cell-mono">{order.pedido_forca_venda_key}</span>
                      {order.numero_pedido_cliente != null && (
                        <><br /><span className="tms-cell-location">Cli: {order.numero_pedido_cliente}</span></>
                      )}
                    </td>
                    <td>
                      <span className="tms-cell-cliente" title={order.nome_razao_cliente}>
                        {order.nome_razao_cliente}
                      </span>
                    </td>
                    <td>
                      <span className="tms-cell-mono">{fmtCep(order.cep)}</span>
                      <br />
                      <span className="tms-cell-location">
                        {order.cidade}{order.bairro ? ` · ${order.bairro}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`tms-cell-value ${order.valor_pedido >= 15000 ? 'tms-cell-value--high' : ''}`}>
                        {fmt(order.valor_pedido)}
                      </span>
                    </td>
                    <td>
                      <span className="tms-cell-mono">{fmtW(order.peso_pedido)}</span>
                    </td>
                    <td>
                      <CarrierTag
                        carrierId={order.suggested_carrier_id}
                        carrierName={order.suggested_carrier_name}
                        carrierColor={order.suggested_carrier_color}
                        explanation={order.rule_explanation}
                        routingStatus={order.routing_status}
                        viamexUnit={order.viamex_unit}
                      />
                    </td>

                    {tab === 'pending' && (
                      <td>
                        {isAlert ? (
                          <div className="tms-alert-actions">
                            <button
                              className="tms-btn tms-btn--frota tms-btn--sm"
                              onClick={() => handleHighValue(order, 'frota')}
                            >
                              Frota Própria
                            </button>
                            <button
                              className="tms-btn tms-btn--liberar tms-btn--sm"
                              onClick={() => handleHighValue(order, 'liberar')}
                            >
                              Liberar Padrão
                            </button>
                          </div>
                        ) : isForced ? (
                          <StatusChip tone="atrasado">Bloqueado</StatusChip>
                        ) : isDone ? (
                          <StatusChip tone="entregue">✓ Aprovado</StatusChip>
                        ) : (
                          <div className="tms-action-cell">
                            <select
                              className="tms-carrier-select"
                              value={overrides[order.id] ?? order.suggested_carrier_id ?? ''}
                              onChange={e => setOverrides(p => ({ ...p, [order.id]: e.target.value }))}
                            >
                              {carriers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <button
                              className="tms-btn tms-btn--approve tms-btn--sm"
                              disabled={approvingId === order.id}
                              onClick={() => handleApprove(order)}
                            >
                              {approvingId === order.id ? '...' : 'Aprovar'}
                            </button>
                          </div>
                        )}
                      </td>
                    )}

                    {tab === 'history' && (
                      <td>
                        {order.nome_transportadora_nf ? (
                          <span className="tms-cell-cliente" title={order.nome_transportadora_nf}>
                            {order.nome_transportadora_nf}
                          </span>
                        ) : (
                          <StatusChip tone="rascunho">—</StatusChip>
                        )}
                      </td>
                    )}

                    <td>
                      <StatusBadge status={order.routing_status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected.size > 0 && (
        <BatchActionBar
          count={batchStats.count}
          total={batchStats.value}
          weight={batchStats.weight}
          onCancel={() => setSelected(new Set())}
          onGenerate={handleBatchApprove}
        />
      )}
    </>
  );
}
