import React from "react";
import ReactDOM from "react-dom/client";
import { AlertTriangle, ArrowDown, Boxes, CheckCircle2, ClipboardList, Clock3, FileCheck2, Filter, MapPin, PackageSearch, Search, TrendingUp, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dashboard from "./data/inventory-dashboard.json";
import "./styles.css";

type Address = {
  address: string;
  area: number;
  rua: number;
  coluna: number;
  nivel: number;
  posicao: number;
  qtdUn?: number;
  qtdCx?: number;
  qtdEnderecada?: number;
  status?: string;
  validade?: string;
};

type Product = {
  codigo: string;
  descricao: string;
  sistema: number;
  contadoAtual: number;
  diferenca: number;
  absDiferenca: number;
  impactoValor: number;
  custoBruto: number;
  contadoAnterior?: number;
  deltaParcialAnterior: number;
  contadoTresSemanas?: number;
  ajusteTresSemanas?: number;
  deltaVsTresSemanas: number;
  qtdRuasFechadas: number;
  qtdRuasEmAndamento: number;
  qtdEstoqueEnderecadoAntigo: number;
  status: string;
  criticidade: number;
  enderecosAntigos: Address[];
  enderecosContados: Address[];
};

type DashboardData = {
  metadata: {
    generatedAt: string;
    currentPartial: {
      label: string;
      timestamp: string;
    };
    previousPartial?: {
      label: string;
      timestamp: string;
    };
    rules: {
      closedStreets: number[];
      inProgressStreets: number[];
    };
  };
  kpis: Record<string, number>;
  statusCounts: Record<string, number>;
  ruas: Array<{ rua: string; quantidade: number }>;
  history: Array<{ label: string; contado: number; sistema: number; diferenca: number }>;
  products: Product[];
  finalInventory?: FinalInventory | null;
};

type FinalInventoryProduct = {
  codigo: string;
  produto: string;
  sistema: number;
  contado: number;
  ajuste: number;
  valorAjuste: number;
  custoBruto: number;
  status: string;
  ajusteFlavia: string;
  grupo: string;
};

type FinalInventory = {
  sourceFile: string;
  sheets: string[];
  previousSummary: Record<string, number>;
  currentSummary: Record<string, number>;
  statusCounts: Array<{ status: string; count: number }>;
  groupCounts: Record<string, number>;
  products: FinalInventoryProduct[];
};

type RecountOrder = {
  tipo: "Produto Ganho" | "Produto Perda" | "Nao contado";
  prioridade: number;
  codigo: string;
  descricao: string;
  status: string;
  endereco: string;
  area: number;
  rua: number;
  coluna: number;
  nivel: number;
  posicao: number;
  estoqueEndereco: number;
  contadoEndereco: number;
  diferencaEndereco: number;
  sistemaProduto: number;
  contadoProduto: number;
  diferencaProduto: number;
};

const data = dashboard as DashboardData;

const statusOrder = ["Todos", "Crítico confirmado", "Aguardar contagem", "Divergência contada", "Falta", "Ganho", "Resolvido"];
const statusTone: Record<string, string> = {
  "Crítico confirmado": "danger",
  "Aguardar contagem": "warning",
  "Divergência contada": "tracked",
  Falta: "loss",
  Ganho: "gain",
  Resolvido: "ok",
};

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function fmt(value?: number) {
  return numberFormatter.format(value ?? 0);
}

function money(value?: number) {
  return currencyFormatter.format(value ?? 0);
}

function pct(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function App() {
  const [page, setPage] = React.useState<"dashboard" | "orders" | "final">("final");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("Todos");
  const [street, setStreet] = React.useState("Todas");
  const [selected, setSelected] = React.useState<Product | null>(data.products[0] ?? null);

  const streets = React.useMemo(() => {
    const values = new Set<string>();
    data.products.forEach((product) => {
      product.enderecosContados.forEach((address) => values.add(`${String(address.area).padStart(2, "0")}.${String(address.rua).padStart(2, "0")}`));
      product.enderecosAntigos.forEach((address) => values.add(`${String(address.area).padStart(2, "0")}.${String(address.rua).padStart(2, "0")}`));
    });
    return ["Todas", ...Array.from(values).sort()];
  }, []);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.products
      .filter((product) => status === "Todos" || product.status === status)
      .filter((product) => {
        if (!normalized) return true;
        return product.codigo.includes(normalized) || product.descricao.toLowerCase().includes(normalized);
      })
      .filter((product) => {
        if (street === "Todas") return true;
        const inCounted = product.enderecosContados.some((address) => `${String(address.area).padStart(2, "0")}.${String(address.rua).padStart(2, "0")}` === street);
        const inStock = product.enderecosAntigos.some((address) => `${String(address.area).padStart(2, "0")}.${String(address.rua).padStart(2, "0")}` === street);
        return inCounted || inStock;
      });
  }, [query, status, street]);

  const losses = data.products.filter((product) => product.status === "Falta").sort((a, b) => a.diferenca - b.diferenca).slice(0, 8);
  const countedGaps = data.products.filter((product) => product.status === "Divergência contada").sort((a, b) => a.diferenca - b.diferenca).slice(0, 8);
  const gains = data.products.filter((product) => product.diferenca > 0).sort((a, b) => b.diferenca - a.diferenca).slice(0, 8);
  const ruaChart = data.ruas.filter((item) => item.rua.startsWith("05.")).map((item) => ({
    ...item,
    status: item.rua.endsWith(".05") || item.rua.endsWith(".06") ? "Em andamento" : "Fechada",
  }));
  const progress = Math.max(0, Math.min(100, (data.kpis.contado / data.kpis.sistema) * 100));

  const orders = React.useMemo(() => buildRecountOrders(data.products), []);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <span className="eyebrow">Logistica OS</span>
          <h1>Inventario logistico</h1>
          <p>
            Parcial atual: <strong>{data.metadata.currentPartial.label}</strong> ({data.metadata.currentPartial.timestamp})
          </p>
        </div>
        <div className="update-card">
          <Clock3 size={18} />
          <div>
            <span>Base gerada</span>
            <strong>{data.metadata.generatedAt.replace("T", " ")}</strong>
          </div>
        </div>
      </header>

      <nav className="page-tabs" aria-label="Paginas do inventario">
        <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>
          <PackageSearch size={17} />
          Dashboard
        </button>
        <button className={page === "orders" ? "active" : ""} onClick={() => setPage("orders")}>
          <ClipboardList size={17} />
          Ordens de recontagem
        </button>
        {data.finalInventory && (
          <button className={page === "final" ? "active" : ""} onClick={() => setPage("final")}>
            <FileCheck2 size={17} />
            Fechamento
          </button>
        )}
      </nav>

      {page === "final" && data.finalInventory ? <FinalInventoryPage finalInventory={data.finalInventory} /> : page === "orders" ? <RecountOrdersPage orders={orders} /> : (
      <>

      <section className="kpi-grid">
        <KpiCard label="Sistema" value={fmt(data.kpis.sistema)} icon={<Boxes size={20} />} />
        <KpiCard label="Contado atual" value={fmt(data.kpis.contado)} helper={`${progress.toFixed(1)}% do sistema`} icon={<PackageSearch size={20} />} />
        <KpiCard label="Diferenca" value={fmt(data.kpis.diferenca)} tone="danger" icon={<ArrowDown size={20} />} />
        <KpiCard label="Impacto estimado" value={money(data.kpis.impactoValor)} tone={data.kpis.impactoValor < 0 ? "danger" : "gain"} icon={<TrendingUp size={20} />} />
        <KpiCard label="Criticos" value={fmt(data.kpis.criticos)} tone="danger" icon={<AlertTriangle size={20} />} />
        <KpiCard label="Resolvidos" value={fmt(data.kpis.resolvidos)} tone="ok" icon={<CheckCircle2 size={20} />} />
      </section>

      <section className="progress-panel">
        <div>
          <h2>Avanco da parcial</h2>
          <p>
            Ruas 01-04 estaveis; Rua 05 avancou forte nesta parcial e Rua 06 ainda concentra pendencias.
          </p>
        </div>
        <div className="progress-track" aria-label="percentual contado">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-labels">
          <strong>{fmt(data.kpis.contado)} contado</strong>
          <span>{fmt(Math.abs(data.kpis.diferenca))} ainda em diferenca</span>
        </div>
      </section>

      <section className="charts-grid">
        <Panel title="Contagem por rua" subtitle="Area.Rua com leitura operacional">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ruaChart} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e1df" />
              <XAxis dataKey="rua" tick={{ fill: "#52605c", fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} tick={{ fill: "#52605c", fontSize: 12 }} width={42} />
              <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={{ borderRadius: 8, borderColor: "#c9d5d0" }} />
              <Bar dataKey="quantidade" radius={[5, 5, 0, 0]}>
                {ruaChart.map((item) => (
                  <Cell key={item.rua} fill={item.status === "Em andamento" ? "#d8902f" : "#287a67"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Faltas nao contadas" subtitle="Sistema com contagem zerada">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={losses.map((item) => ({ name: shortName(item.descricao), valor: Math.abs(item.diferenca) }))} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d9e1df" />
              <XAxis type="number" tickFormatter={(value) => `${Number(value) / 1000}k`} tick={{ fill: "#52605c", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#52605c", fontSize: 11 }} width={128} />
              <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={{ borderRadius: 8, borderColor: "#c9d5d0" }} />
              <Bar dataKey="valor" fill="#b93a32" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Divergencias contadas" subtitle="Produto contado, ainda abaixo do sistema">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={countedGaps.map((item) => ({ name: shortName(item.descricao), valor: Math.abs(item.diferenca) }))} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d9e1df" />
              <XAxis type="number" tickFormatter={(value) => `${Number(value) / 1000}k`} tick={{ fill: "#52605c", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#52605c", fontSize: 11 }} width={128} />
              <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={{ borderRadius: 8, borderColor: "#c9d5d0" }} />
              <Bar dataKey="valor" fill="#d8902f" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Ganhos / sobras" subtitle="Contado acima do sistema">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={gains.map((item) => ({ name: shortName(item.descricao), valor: item.diferenca }))} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d9e1df" />
              <XAxis type="number" tick={{ fill: "#52605c", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#52605c", fontSize: 11 }} width={128} />
              <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={{ borderRadius: 8, borderColor: "#c9d5d0" }} />
              <Bar dataKey="valor" fill="#277a52" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Evolucao das parciais" subtitle="Historico preservado">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.history} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e1df" />
              <XAxis dataKey="label" tick={{ fill: "#52605c", fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} tick={{ fill: "#52605c", fontSize: 12 }} width={42} />
              <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={{ borderRadius: 8, borderColor: "#c9d5d0" }} />
              <Legend />
              <Bar dataKey="contado" fill="#287a67" radius={[5, 5, 0, 0]} />
              <Bar dataKey="sistema" fill="#93a39d" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </section>

      <section className="workbench">
        <div className="table-panel">
          <div className="table-header">
            <div>
              <h2>Produtos criticos e acompanhamento</h2>
              <p>{fmt(filtered.length)} produtos no filtro atual</p>
            </div>
            <div className="filters">
              <label>
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar codigo ou produto" />
              </label>
              <label>
                <Filter size={16} />
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {statusOrder.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <MapPin size={16} />
                <select value={street} onChange={(event) => setStreet(event.target.value)}>
                  {streets.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Status</th>
                  <th className="num">Sistema</th>
                  <th className="num">Contado</th>
                  <th className="num">Dif.</th>
                  <th className="num">Valor</th>
                  <th className="num">Crit.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 80).map((product) => (
                  <tr key={product.codigo} onClick={() => setSelected(product)} className={selected?.codigo === product.codigo ? "selected" : ""}>
                    <td>
                      <strong>{product.codigo}</strong>
                      <span>{product.descricao}</span>
                    </td>
                    <td>
                      <Badge status={product.status} />
                    </td>
                    <td className="num">{fmt(product.sistema)}</td>
                    <td className="num">{fmt(product.contadoAtual)}</td>
                    <td className={`num ${product.diferenca < 0 ? "negative" : product.diferenca > 0 ? "positive" : ""}`}>{fmt(product.diferenca)}</td>
                    <td className={`num ${product.impactoValor < 0 ? "negative" : product.impactoValor > 0 ? "positive" : ""}`}>{money(product.impactoValor)}</td>
                    <td className="num">{product.criticidade.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ProductDrawer product={selected} onClose={() => setSelected(null)} />
      </section>
      </>
      )}
    </main>
  );
}

function KpiCard({ label, value, helper, icon, tone = "" }: { label: string; value: string; helper?: string; icon: React.ReactNode; tone?: string }) {
  return (
    <article className={`kpi ${tone}`}>
      <div className="kpi-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <em>{helper}</em>}
    </article>
  );
}

function RecountOrdersPage({ orders }: { orders: RecountOrder[] }) {
  const [type, setType] = React.useState<RecountOrder["tipo"]>("Produto Perda");
  const [query, setQuery] = React.useState("");
  const typeOrders = orders.filter((order) => order.tipo === type);
  const filtered = typeOrders.filter((order) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;
    return order.codigo.includes(normalized) || order.descricao.toLowerCase().includes(normalized) || order.endereco.includes(normalized);
  });

  const totals = {
    ganho: orders.filter((order) => order.tipo === "Produto Ganho").reduce((sum, order) => sum + order.prioridade, 0),
    perda: orders.filter((order) => order.tipo === "Produto Perda").reduce((sum, order) => sum + order.prioridade, 0),
    naoContado: orders.filter((order) => order.tipo === "Nao contado").reduce((sum, order) => sum + order.prioridade, 0),
  };

  return (
    <section className="orders-page">
      <div className="orders-hero">
        <div>
          <span className="eyebrow">Lista para o time</span>
          <h2>Ordens de recontagem por endereco</h2>
          <p>Prioridade por maior quantidade no endereco. Use a coluna Dif. End. para identificar ganho, perda ou posicao nao contada.</p>
        </div>
        <div className="orders-summary">
          <Metric label="Ganho a revisar" value={fmt(totals.ganho)} tone="positive" />
          <Metric label="Perda a revisar" value={fmt(totals.perda)} tone="negative" />
          <Metric label="Nao contado" value={fmt(totals.naoContado)} tone="negative" />
        </div>
      </div>

      <div className="order-type-grid">
        <OrderTypeButton active={type === "Produto Ganho"} label="Produto Ganho" count={orders.filter((order) => order.tipo === "Produto Ganho").length} total={totals.ganho} onClick={() => setType("Produto Ganho")} />
        <OrderTypeButton active={type === "Produto Perda"} label="Produto Perda" count={orders.filter((order) => order.tipo === "Produto Perda").length} total={totals.perda} onClick={() => setType("Produto Perda")} />
        <OrderTypeButton active={type === "Nao contado"} label="Nao contados" count={orders.filter((order) => order.tipo === "Nao contado").length} total={totals.naoContado} onClick={() => setType("Nao contado")} />
      </div>

      <div className="table-panel">
        <div className="table-header">
          <div>
            <h2>{type}</h2>
            <p>{fmt(filtered.length)} enderecos para recontagem</p>
          </div>
          <div className="filters">
            <label>
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto, codigo ou endereco" />
            </label>
          </div>
        </div>

        <div className="table-wrap orders-table">
          <table>
            <thead>
              <tr>
                <th>Prioridade</th>
                <th>Produto</th>
                <th>Endereco</th>
                <th className="num">Qtd. end.</th>
                <th className="num">Contado</th>
                <th className="num">Dif. end.</th>
                <th className="num">Dif. produto</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, index) => (
                <tr key={`${order.tipo}-${order.codigo}-${order.endereco}-${index}`}>
                  <td>
                    <strong>#{index + 1}</strong>
                    <span>{fmt(order.prioridade)} un</span>
                  </td>
                  <td>
                    <strong>{order.codigo}</strong>
                    <span>{order.descricao}</span>
                  </td>
                  <td>
                    <strong>{order.endereco}</strong>
                    <span>
                      Area {order.area} Rua {order.rua} Col. {order.coluna} Niv. {order.nivel} Pos. {order.posicao}
                    </span>
                  </td>
                  <td className="num">{fmt(order.estoqueEndereco)}</td>
                  <td className="num">{fmt(order.contadoEndereco)}</td>
                  <td className={`num ${order.diferencaEndereco < 0 ? "negative" : order.diferencaEndereco > 0 ? "positive" : ""}`}>{fmt(order.diferencaEndereco)}</td>
                  <td className={`num ${order.diferencaProduto < 0 ? "negative" : order.diferencaProduto > 0 ? "positive" : ""}`}>{fmt(order.diferencaProduto)}</td>
                  <td>
                    <Badge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function FinalInventoryPage({ finalInventory }: { finalInventory: FinalInventory }) {
  const [group, setGroup] = React.useState("Todos");
  const [query, setQuery] = React.useState("");
  const summary = finalInventory.currentSummary;
  const filtered = finalInventory.products
    .filter((product) => group === "Todos" || product.grupo === group)
    .filter((product) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return true;
      return product.codigo.includes(normalized) || product.produto.toLowerCase().includes(normalized) || product.status.toLowerCase().includes(normalized);
    })
    .sort((a, b) => Math.abs(b.valorAjuste) - Math.abs(a.valorAjuste));

  const groupOptions = ["Todos", "Ganho", "Perda", "Não contado", "Sem divergência"];

  return (
    <section className="orders-page">
      <div className="orders-hero">
        <div>
          <span className="eyebrow">Fechamento</span>
          <h2>Inventario Castanhao 09 e 10.05</h2>
          <p>Leitura da planilha final com status operacional e comparação contra o inventario de 25/26.04.</p>
        </div>
        <div className="orders-summary">
          <Metric label="Produtos" value={fmt(summary.produtos)} />
          <Metric label="Ajuste qtd." value={fmt(summary.ajuste)} tone={summary.ajuste < 0 ? "negative" : "positive"} />
          <Metric label="Valor ajuste" value={money(summary.valorAjuste)} tone={summary.valorAjuste < 0 ? "negative" : "positive"} />
        </div>
      </div>

      <section className="kpi-grid compact-kpis">
        <KpiCard label="Sistema final" value={fmt(summary.sistema)} icon={<Boxes size={20} />} />
        <KpiCard label="Contado final" value={fmt(summary.contado)} icon={<PackageSearch size={20} />} />
        <KpiCard label="Perdas" value={fmt(summary.negativos)} tone="danger" icon={<ArrowDown size={20} />} />
        <KpiCard label="Ganhos" value={fmt(summary.positivos)} tone="gain" icon={<TrendingUp size={20} />} />
        <KpiCard label="Sem ajuste" value={fmt(summary.zerados)} tone="ok" icon={<CheckCircle2 size={20} />} />
        <KpiCard label="Saldo valor" value={money(summary.valorAjuste)} tone={summary.valorAjuste < 0 ? "danger" : "gain"} icon={<FileCheck2 size={20} />} />
      </section>

      <div className="order-type-grid">
        {groupOptions.slice(1).map((option) => (
          <OrderTypeButton
            key={option}
            active={group === option}
            label={option}
            count={finalInventory.products.filter((product) => product.grupo === option).length}
            total={finalInventory.products.filter((product) => product.grupo === option).reduce((sum, product) => sum + Math.abs(product.ajuste), 0)}
            onClick={() => setGroup(option)}
          />
        ))}
      </div>

      <div className="table-panel">
        <div className="table-header">
          <div>
            <h2>Produtos do fechamento</h2>
            <p>{fmt(filtered.length)} produtos no filtro atual</p>
          </div>
          <div className="filters">
            <label>
              <Filter size={16} />
              <select value={group} onChange={(event) => setGroup(event.target.value)}>
                {groupOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto, codigo ou status" />
            </label>
          </div>
        </div>
        <div className="table-wrap orders-table">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Grupo</th>
                <th className="num">Sistema</th>
                <th className="num">Contado</th>
                <th className="num">Ajuste</th>
                <th className="num">Valor</th>
                <th>Status / Observacao</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.codigo}>
                  <td>
                    <strong>{product.codigo}</strong>
                    <span>{product.produto}</span>
                  </td>
                  <td>
                    <span className={`badge ${product.grupo === "Ganho" ? "gain" : product.grupo === "Perda" ? "loss" : product.grupo === "Não contado" ? "danger" : "ok"}`}>{product.grupo}</span>
                  </td>
                  <td className="num">{fmt(product.sistema)}</td>
                  <td className="num">{fmt(product.contado)}</td>
                  <td className={`num ${product.ajuste < 0 ? "negative" : product.ajuste > 0 ? "positive" : ""}`}>{fmt(product.ajuste)}</td>
                  <td className={`num ${product.valorAjuste < 0 ? "negative" : product.valorAjuste > 0 ? "positive" : ""}`}>{money(product.valorAjuste)}</td>
                  <td>
                    <strong>{product.status || product.ajusteFlavia || "-"}</strong>
                    {product.status && product.ajusteFlavia && <span>{product.ajusteFlavia}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function OrderTypeButton({ active, label, count, total, onClick }: { active: boolean; label: string; count: number; total: number; onClick: () => void }) {
  return (
    <button className={`order-type ${active ? "active" : ""}`} onClick={onClick}>
      <span>{label}</span>
      <strong>{fmt(total)}</strong>
      <em>{fmt(count)} enderecos</em>
    </button>
  );
}

function buildRecountOrders(products: Product[]): RecountOrder[] {
  const orders: RecountOrder[] = [];

  products.forEach((product) => {
    const rows = addressDiffRows(product);

    rows.forEach((row) => {
      if (product.diferenca > 0 && row.diferencaEndereco > 0) {
        orders.push(toOrder("Produto Ganho", product, row, row.diferencaEndereco));
      }

      if (product.contadoAtual <= 0 && product.sistema > 0 && row.estoqueEndereco > 0) {
        orders.push(toOrder("Nao contado", product, row, row.estoqueEndereco));
      }

      if (product.contadoAtual > 0 && product.diferenca < 0 && row.diferencaEndereco < 0) {
        orders.push(toOrder("Produto Perda", product, row, Math.abs(row.diferencaEndereco)));
      }
    });

    if (product.contadoAtual <= 0 && product.sistema > 0 && rows.length === 0) {
      orders.push({
        tipo: "Nao contado",
        prioridade: product.sistema,
        codigo: product.codigo,
        descricao: product.descricao,
        status: product.status,
        endereco: "Sem endereco antigo",
        area: 0,
        rua: 0,
        coluna: 0,
        nivel: 0,
        posicao: 0,
        estoqueEndereco: product.sistema,
        contadoEndereco: 0,
        diferencaEndereco: -product.sistema,
        sistemaProduto: product.sistema,
        contadoProduto: product.contadoAtual,
        diferencaProduto: product.diferenca,
      });
    }
  });

  return orders.sort((a, b) => b.prioridade - a.prioridade);
}

function addressDiffRows(product: Product) {
  const grouped = new Map<string, { address: Address; estoqueEndereco: number; contadoEndereco: number; diferencaEndereco: number }>();

  product.enderecosAntigos.forEach((address) => {
    const current = grouped.get(address.address) ?? { address, estoqueEndereco: 0, contadoEndereco: 0, diferencaEndereco: 0 };
    current.estoqueEndereco += address.qtdEnderecada ?? 0;
    current.diferencaEndereco = current.contadoEndereco - current.estoqueEndereco;
    grouped.set(address.address, current);
  });

  product.enderecosContados.forEach((address) => {
    const current = grouped.get(address.address) ?? { address, estoqueEndereco: 0, contadoEndereco: 0, diferencaEndereco: 0 };
    current.contadoEndereco += address.qtdUn ?? 0;
    current.diferencaEndereco = current.contadoEndereco - current.estoqueEndereco;
    grouped.set(address.address, current);
  });

  return Array.from(grouped.values());
}

function toOrder(
  tipo: RecountOrder["tipo"],
  product: Product,
  row: ReturnType<typeof addressDiffRows>[number],
  prioridade: number,
): RecountOrder {
  return {
    tipo,
    prioridade,
    codigo: product.codigo,
    descricao: product.descricao,
    status: product.status,
    endereco: row.address.address,
    area: row.address.area,
    rua: row.address.rua,
    coluna: row.address.coluna,
    nivel: row.address.nivel,
    posicao: row.address.posicao,
    estoqueEndereco: row.estoqueEndereco,
    contadoEndereco: row.contadoEndereco,
    diferencaEndereco: row.diferencaEndereco,
    sistemaProduto: product.sistema,
    contadoProduto: product.contadoAtual,
    diferencaProduto: product.diferenca,
  };
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <article className="panel">
      <div className="panel-title">
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>
      {children}
    </article>
  );
}

function Badge({ status }: { status: string }) {
  return <span className={`badge ${statusTone[status] ?? ""}`}>{status}</span>;
}

function ProductDrawer({ product, onClose }: { product: Product | null; onClose: () => void }) {
  if (!product) {
    return (
      <aside className="detail empty">
        <PackageSearch size={28} />
        <strong>Selecione um produto</strong>
        <span>O detalhe mostra enderecos antigos, enderecos contados e evolucao.</span>
      </aside>
    );
  }

  return (
    <aside className="detail">
      <button className="close-button" onClick={onClose} aria-label="Fechar detalhe">
        <X size={18} />
      </button>
      <div className="detail-head">
        <Badge status={product.status} />
        <h2>{product.descricao}</h2>
        <span>Codigo {product.codigo}</span>
      </div>

      <div className="detail-metrics">
        <Metric label="Sistema" value={fmt(product.sistema)} />
        <Metric label="Contado" value={fmt(product.contadoAtual)} />
        <Metric label="Diferenca" value={fmt(product.diferenca)} tone={product.diferenca < 0 ? "negative" : product.diferenca > 0 ? "positive" : ""} />
        <Metric label="Valor" value={money(product.impactoValor)} tone={product.impactoValor < 0 ? "negative" : product.impactoValor > 0 ? "positive" : ""} />
      </div>

      <div className="comparison">
        <div>
          <span>Parcial anterior</span>
          <strong>{product.contadoAnterior == null ? "novo" : fmt(product.contadoAnterior)}</strong>
        </div>
        <div>
          <span>Avanco parcial</span>
          <strong>{product.deltaParcialAnterior >= 0 ? "+" : ""}{fmt(product.deltaParcialAnterior)}</strong>
        </div>
        <div>
          <span>Contagem 3 semanas</span>
          <strong>{product.contadoTresSemanas == null ? "-" : fmt(product.contadoTresSemanas)}</strong>
        </div>
      </div>

      <AddressDiffList product={product} />
      <AddressList title="Enderecos contados" addresses={product.enderecosContados} quantityKey="qtdUn" />
      <AddressList title="Enderecos antigos no estoque" addresses={product.enderecosAntigos} quantityKey="qtdEnderecada" />
    </aside>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AddressList({ title, addresses, quantityKey }: { title: string; addresses: Address[]; quantityKey: "qtdUn" | "qtdEnderecada" }) {
  const sorted = [...addresses].sort((a, b) => (b[quantityKey] ?? 0) - (a[quantityKey] ?? 0));
  return (
    <section className="address-section">
      <h3>{title}</h3>
      {sorted.length === 0 ? (
        <p className="muted">Sem endereco nessa base.</p>
      ) : (
        <div className="address-list">
          {sorted.slice(0, 18).map((address, index) => (
            <div className="address-row" key={`${address.address}-${index}`}>
              <div>
                <strong>{address.address}</strong>
                <span>
                  Area {address.area} Rua {address.rua} Col. {address.coluna} Niv. {address.nivel} Pos. {address.posicao}
                </span>
              </div>
              <strong>{fmt(address[quantityKey])}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AddressDiffList({ product }: { product: Product }) {
  const rows = React.useMemo(() => {
    const grouped = new Map<string, { address: Address; estoque: number; contado: number }>();

    product.enderecosAntigos.forEach((address) => {
      const current = grouped.get(address.address) ?? { address, estoque: 0, contado: 0 };
      current.estoque += address.qtdEnderecada ?? 0;
      grouped.set(address.address, current);
    });

    product.enderecosContados.forEach((address) => {
      const current = grouped.get(address.address) ?? { address, estoque: 0, contado: 0 };
      current.contado += address.qtdUn ?? 0;
      grouped.set(address.address, current);
    });

    return Array.from(grouped.values())
      .map((row) => ({ ...row, diferenca: row.contado - row.estoque }))
      .sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
  }, [product]);

  return (
    <section className="address-section">
      <h3>Diferenca por endereco</h3>
      {rows.length === 0 ? (
        <p className="muted">Sem enderecos para comparar.</p>
      ) : (
        <div className="address-diff-list">
          <div className="address-diff-head">
            <span>Endereco</span>
            <span>Estoque</span>
            <span>Contado</span>
            <span>Dif.</span>
          </div>
          {rows.slice(0, 22).map((row) => (
            <div className="address-diff-row" key={row.address.address}>
              <div>
                <strong>{row.address.address}</strong>
                <span>
                  Area {row.address.area} Rua {row.address.rua} Col. {row.address.coluna} Niv. {row.address.nivel} Pos. {row.address.posicao}
                </span>
              </div>
              <strong>{fmt(row.estoque)}</strong>
              <strong>{fmt(row.contado)}</strong>
              <strong className={row.diferenca < 0 ? "negative" : row.diferenca > 0 ? "positive" : ""}>{fmt(row.diferenca)}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function shortName(name: string) {
  return name.length > 28 ? `${name.slice(0, 27)}...` : name;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
