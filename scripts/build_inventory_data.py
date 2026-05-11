from __future__ import annotations

import json
import math
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "data" / "inventory-dashboard.json"

STOCK_XLSX = Path(r"C:\Users\Rodolfo\Downloads\produto por endereço.xlsx")
FINAL_INVENTORY_XLSX = Path(r"C:\Users\Rodolfo\Downloads\Inventario CASTANHÃO.xlsx")
PARTIALS = [
    {
        "id": "parcial-2026-05-09-1201",
        "label": "Parcial 12:01",
        "path": Path(r"C:\Users\Rodolfo\Downloads\Relatorio (6).pdf"),
    },
    {
        "id": "parcial-2026-05-09-1213",
        "label": "Parcial 12:13",
        "path": Path(r"C:\Users\Rodolfo\Downloads\Relatorio (7).pdf"),
    },
    {
        "id": "parcial-2026-05-09-1243",
        "label": "Parcial 12:43",
        "path": Path(r"C:\Users\Rodolfo\Downloads\Relatorio (8).pdf"),
    },
    {
        "id": "parcial-2026-05-09-1301",
        "label": "Parcial 13:01",
        "path": Path(r"C:\Users\Rodolfo\Downloads\Relatorio (9).pdf"),
    },
    {
        "id": "parcial-2026-05-09-1321",
        "label": "Parcial 13:21",
        "path": Path(r"C:\Users\Rodolfo\Downloads\Relatorio (10).pdf"),
    },
    {
        "id": "parcial-2026-05-09-1640",
        "label": "Parcial 16:40",
        "path": Path(r"C:\Users\Rodolfo\Downloads\Relatorio (11).pdf"),
    },
    {
        "id": "parcial-2026-05-09-1735",
        "label": "Parcial 17:35",
        "path": Path(r"C:\Users\Rodolfo\Downloads\Relatorio (13).pdf"),
    },
]


def clean_number(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)) and not pd.isna(value):
        return float(value)
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return 0.0
    return float(text.replace(".", "").replace(",", "."))


def code_key(value: Any) -> str | None:
    if pd.isna(value):
        return None
    try:
        return str(int(float(value)))
    except (ValueError, TypeError):
        text = str(value).strip()
        return text or None


def split_address(address: str) -> dict[str, int | str]:
    parts = [int(part) for part in str(address).split(".")]
    return {
        "address": address,
        "loja": parts[0],
        "local": parts[1],
        "area": parts[2],
        "rua": parts[3],
        "coluna": parts[4],
        "nivel": parts[5],
        "posicao": parts[6],
    }


def parse_bluesoft_pdf(path: Path, label: str, partial_id: str) -> dict[str, Any]:
    text = "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
    timestamp_match = re.search(
        r"Produtos para Recontar no inventário\s+\d+\s+(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2})",
        text,
    )
    timestamp = timestamp_match.group(1) if timestamp_match else label

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    skip_prefixes = (
        "Código Descrição",
        "Contada UN",
        "Quantidade",
        "Contada CX",
        "Endereço",
        "Logístico",
        "Total",
        "Nova",
        "Produtos para Recontar",
        "Página",
        "Bluesoft ERP",
    )
    lines = [line for line in lines if not any(line.startswith(prefix) for prefix in skip_prefixes)]

    br_number = r"\d{1,3}(?:\.\d{3})*,\d{2}"
    address = r"\d+\.\d+\.\d+\.\d+\.\d+\.\d+\.\d+"
    product_start = re.compile(r"^(\d{4,6})(?:\s+(.+))?$")
    detail_line = re.compile(r"^(\d{1,4})\s+(" + br_number + r")\s+(" + br_number + r")\s+(" + address + r")$")
    header_end = re.compile(
        r"^(.*?)\s+1\s+0,00\s+0,00\s+(2\.21\.0\.0\.0\.0\.1)\s+("
        + br_number
        + r")\s+("
        + br_number
        + r")$"
    )

    products: list[dict[str, Any]] = []
    details: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    pending_code: int | None = None
    pending_parts: list[str] = []

    def try_finish(extra: str | None = None) -> bool:
        nonlocal current, pending_code, pending_parts
        combo = " ".join([part for part in pending_parts + ([extra] if extra else []) if part]).strip()
        match = header_end.match(combo)
        if not match or pending_code is None:
            return False
        description = match.group(1).strip()
        current = {
            "codigo": str(pending_code),
            "descricao": description,
            "contado": clean_number(match.group(3)),
            "sistema": clean_number(match.group(4)),
        }
        products.append(current)
        details.append(
            {
                "codigo": str(pending_code),
                "descricao": description,
                "lote": 1,
                "qtdUn": 0.0,
                "qtdCx": 0.0,
                **split_address(match.group(2)),
            }
        )
        pending_code = None
        pending_parts = []
        return True

    for line in lines:
        detail = detail_line.match(line)
        if detail and current and pending_code is None:
            details.append(
                {
                    "codigo": current["codigo"],
                    "descricao": current["descricao"],
                    "lote": int(detail.group(1)),
                    "qtdUn": clean_number(detail.group(2)),
                    "qtdCx": clean_number(detail.group(3)),
                    **split_address(detail.group(4)),
                }
            )
            continue

        start = product_start.match(line)
        if start and int(start.group(1)) >= 10000:
            pending_code = int(start.group(1))
            pending_parts = [start.group(2)] if start.group(2) else []
            try_finish()
            continue

        if pending_code is not None:
            if try_finish(line):
                continue
            pending_parts.append(line)

    unique_products: dict[str, dict[str, Any]] = {}
    for product in products:
        unique_products[product["codigo"]] = product

    for product in unique_products.values():
        product["diferenca"] = product["contado"] - product["sistema"]
        product["absDiferenca"] = abs(product["diferenca"])

    return {
        "id": partial_id,
        "label": label,
        "timestamp": timestamp,
        "products": list(unique_products.values()),
        "addresses": details,
    }


def parse_stock_and_old_count() -> tuple[dict[str, Any], dict[str, Any]]:
    stock = pd.read_excel(STOCK_XLSX, sheet_name="Estoque por endereço")
    old = pd.read_excel(STOCK_XLSX, sheet_name="Produtos que serão contados")

    stock_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for _, row in stock.iterrows():
        codigo = code_key(row.get("Código Interno"))
        address = str(row.get("Endereço Logístico", "")).strip()
        if not codigo or not re.match(r"^\d+\.\d+\.\d+\.\d+\.\d+\.\d+\.\d+$", address):
            continue
        parsed = split_address(address)
        stock_rows[codigo].append(
            {
                **parsed,
                "produto": str(row.get("Produto", "")).strip(),
                "status": str(row.get("Status", "")).strip(),
                "curva": "" if pd.isna(row.get("Curva")) else str(row.get("Curva")),
                "qtdEnderecada": clean_number(row.get("Qtd. Endereçada")),
                "estoqueTotal": clean_number(row.get("Estoque Total Unidades")),
                "validade": "" if pd.isna(row.get("Data de Validade")) else str(row.get("Data de Validade"))[:10],
            }
        )

    old_count: dict[str, dict[str, Any]] = {}
    for _, row in old.iterrows():
        codigo = code_key(row.get("Código"))
        if not codigo:
            continue
        old_count[codigo] = {
            "codigo": codigo,
            "produto": str(row.get("Produto", "")).strip(),
            "sistemaAntigo": clean_number(row.get("Qtde. do sistema")),
            "contadoAntigo": clean_number(row.get("Qtde. contada")),
            "ajusteAntigo": clean_number(row.get("Qtde. do ajuste")),
            "custoLiquido": clean_number(row.get("Custo líquido")),
            "custoBruto": clean_number(row.get("Custo bruto")),
            "valorAjusteAntigo": clean_number(row.get("Valor bruto do ajuste")),
        }

    return stock_rows, old_count


def parse_final_inventory() -> dict[str, Any] | None:
    if not FINAL_INVENTORY_XLSX.exists():
        return None

    sheets = pd.ExcelFile(FINAL_INVENTORY_XLSX).sheet_names
    old = pd.read_excel(FINAL_INVENTORY_XLSX, sheet_name=0)
    current = pd.read_excel(FINAL_INVENTORY_XLSX, sheet_name=1, header=1)

    def normalize_inventory(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df[df["Código"].notna()]
        for col in ["Código", "Qtde. do sistema", "Qtde. contada", "Qtde. do ajuste", "Valor bruto do ajuste", "Custo bruto"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
        if "STATUS" not in df.columns:
            df["STATUS"] = ""
        if "AJUSTE INVENTÁRO FLAVIA" not in df.columns:
            df["AJUSTE INVENTÁRO FLAVIA"] = ""
        return df

    old = normalize_inventory(old)
    current = normalize_inventory(current)

    def summary(df: pd.DataFrame) -> dict[str, Any]:
        return {
            "produtos": int(df["Código"].nunique()),
            "sistema": float(df["Qtde. do sistema"].sum()),
            "contado": float(df["Qtde. contada"].sum()),
            "ajuste": float(df["Qtde. do ajuste"].sum()),
            "valorAjuste": float(df["Valor bruto do ajuste"].sum()),
            "negativos": int((df["Qtde. do ajuste"] < 0).sum()),
            "positivos": int((df["Qtde. do ajuste"] > 0).sum()),
            "zerados": int((df["Qtde. do ajuste"] == 0).sum()),
        }

    rows = []
    for _, row in current.iterrows():
        ajuste = clean_number(row.get("Qtde. do ajuste"))
        sistema = clean_number(row.get("Qtde. do sistema"))
        contado = clean_number(row.get("Qtde. contada"))
        status = "" if pd.isna(row.get("STATUS")) else str(row.get("STATUS")).strip()
        ajuste_flavia = "" if pd.isna(row.get("AJUSTE INVENTÁRO FLAVIA")) else str(row.get("AJUSTE INVENTÁRO FLAVIA")).strip()
        if contado <= 0 and sistema > 0:
            grupo = "Não contado"
        elif ajuste > 0:
            grupo = "Ganho"
        elif ajuste < 0:
            grupo = "Perda"
        else:
            grupo = "Sem divergência"
        rows.append(
            {
                "codigo": code_key(row.get("Código")),
                "produto": str(row.get("Produto", "")).strip(),
                "gtin": code_key(row.get("GTIN/PLU Principal")),
                "sistema": sistema,
                "contado": contado,
                "ajuste": ajuste,
                "valorAjuste": clean_number(row.get("Valor bruto do ajuste")),
                "custoBruto": clean_number(row.get("Custo bruto")),
                "status": status,
                "ajusteFlavia": ajuste_flavia,
                "grupo": grupo,
            }
        )

    status_counts = current["STATUS"].fillna("(sem status)").astype(str).str.strip().replace("", "(sem status)").value_counts()
    group_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        group_counts[row["grupo"]] += 1

    return {
        "sourceFile": str(FINAL_INVENTORY_XLSX),
        "sheets": sheets,
        "previousSummary": summary(old),
        "currentSummary": summary(current),
        "statusCounts": [{"status": key, "count": int(value)} for key, value in status_counts.items()],
        "groupCounts": dict(group_counts),
        "products": rows,
    }


def aggregate_by_product(partial: dict[str, Any]) -> dict[str, dict[str, Any]]:
    address_by_code: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in partial["addresses"]:
        if row["address"] != "2.21.0.0.0.0.1":
            address_by_code[row["codigo"]].append(row)

    products: dict[str, dict[str, Any]] = {}
    for item in partial["products"]:
        codigo = item["codigo"]
        rows = address_by_code.get(codigo, [])
        qtd_1_4 = sum(row["qtdUn"] for row in rows if row["rua"] in [1, 2, 3, 4])
        qtd_5_6 = sum(row["qtdUn"] for row in rows if row["rua"] in [5, 6])
        products[codigo] = {
            **item,
            "qtdRuasFechadas": qtd_1_4,
            "qtdRuasEmAndamento": qtd_5_6,
            "enderecosContados": rows,
        }
    return products


def classify_product(
    product: dict[str, Any],
    previous: dict[str, Any] | None,
    old_count: dict[str, Any] | None,
    stock_addresses: list[dict[str, Any]],
) -> dict[str, Any]:
    difference = product["diferenca"]
    abs_difference = abs(difference)
    cost = (old_count or {}).get("custoBruto") or (old_count or {}).get("custoLiquido") or 0
    value_impact = difference * cost
    previous_counted = previous["contado"] if previous else None
    delta_previous = product["contado"] - previous_counted if previous_counted is not None else product["contado"]
    stock_qty = sum(row["qtdEnderecada"] for row in stock_addresses)
    has_closed_addresses = product["qtdRuasFechadas"] > 0
    has_open_addresses = product["qtdRuasEmAndamento"] > 0

    if product["sistema"] > 0 and product["contado"] <= 0:
        status = "Falta"
    elif abs_difference <= max(50, product["sistema"] * 0.01):
        status = "Resolvido"
    elif difference > 0:
        status = "Ganho"
    elif has_open_addresses and delta_previous > 0 and not has_closed_addresses:
        status = "Aguardar contagem"
    elif has_open_addresses and delta_previous > 500 and abs_difference > 500:
        status = "Aguardar contagem"
    elif abs_difference >= 500 or abs(value_impact) >= 5000:
        status = "Crítico confirmado"
    else:
        status = "Divergência contada"

    criticality = (
        min(abs_difference / 500, 80)
        + min(abs(value_impact) / 1000, 60)
        + (25 if status == "Crítico confirmado" else 0)
        + (15 if previous and abs(previous["diferenca"]) > 500 and abs_difference > 500 else 0)
        + (10 if stock_qty > 0 and product["contado"] == 0 else 0)
    )

    return {
        "codigo": product["codigo"],
        "descricao": product["descricao"],
        "sistema": product["sistema"],
        "contadoAtual": product["contado"],
        "diferenca": difference,
        "absDiferenca": abs_difference,
        "impactoValor": value_impact,
        "custoBruto": cost,
        "contadoAnterior": previous_counted,
        "deltaParcialAnterior": delta_previous,
        "contadoTresSemanas": (old_count or {}).get("contadoAntigo"),
        "ajusteTresSemanas": (old_count or {}).get("ajusteAntigo"),
        "deltaVsTresSemanas": product["contado"] - (old_count or {}).get("contadoAntigo", 0),
        "qtdRuasFechadas": product["qtdRuasFechadas"],
        "qtdRuasEmAndamento": product["qtdRuasEmAndamento"],
        "qtdEstoqueEnderecadoAntigo": stock_qty,
        "status": status,
        "criticidade": round(criticality, 2),
        "enderecosAntigos": stock_addresses,
        "enderecosContados": product["enderecosContados"],
    }


def build_dashboard() -> dict[str, Any]:
    stock, old_count = parse_stock_and_old_count()
    final_inventory = parse_final_inventory()
    partials = [parse_bluesoft_pdf(item["path"], item["label"], item["id"]) for item in PARTIALS]
    current = partials[-1]
    previous = partials[-2] if len(partials) > 1 else None
    current_by_code = aggregate_by_product(current)
    previous_by_code = aggregate_by_product(previous) if previous else {}

    products = [
        classify_product(
            product,
            previous_by_code.get(codigo),
            old_count.get(codigo),
            stock.get(codigo, []),
        )
        for codigo, product in current_by_code.items()
    ]
    products.sort(key=lambda item: item["criticidade"], reverse=True)

    by_status: dict[str, int] = defaultdict(int)
    for item in products:
        by_status[item["status"]] += 1

    def partial_summary(partial: dict[str, Any]) -> dict[str, Any]:
        by_code = aggregate_by_product(partial)
        rua_totals: dict[str, float] = defaultdict(float)
        for row in partial["addresses"]:
            if row["address"] != "2.21.0.0.0.0.1":
                rua_totals[f"{row['area']:02d}.{row['rua']:02d}"] += row["qtdUn"]
        return {
            "id": partial["id"],
            "label": partial["label"],
            "timestamp": partial["timestamp"],
            "produtos": len(by_code),
            "contado": sum(item["contado"] for item in by_code.values()),
            "sistema": sum(item["sistema"] for item in by_code.values()),
            "diferenca": sum(item["diferenca"] for item in by_code.values()),
            "ruas": [
                {"rua": key, "quantidade": value}
                for key, value in sorted(rua_totals.items())
            ],
        }

    current_summary = partial_summary(current)
    previous_summary = partial_summary(previous) if previous else None
    gains = [item for item in products if item["diferenca"] > 0]
    losses = [item for item in products if item["status"] == "Falta"]

    return {
        "metadata": {
            "generatedAt": datetime.now().isoformat(timespec="seconds"),
            "stockFile": str(STOCK_XLSX),
            "currentPartialFile": str(PARTIALS[-1]["path"]),
            "currentPartial": current_summary,
            "previousPartial": previous_summary,
            "rules": {
                "closedStreets": [1, 2, 3, 4],
                "inProgressStreets": [5, 6],
                "gainDefinition": "Quantidade contada atual maior que quantidade do sistema",
            },
        },
        "kpis": {
            "produtos": len(products),
            "sistema": sum(item["sistema"] for item in products),
            "contado": sum(item["contadoAtual"] for item in products),
            "diferenca": sum(item["diferenca"] for item in products),
            "impactoValor": sum(item["impactoValor"] for item in products),
            "criticos": by_status["Crítico confirmado"],
            "aguardar": by_status["Aguardar contagem"],
            "resolvidos": by_status["Resolvido"],
            "ganhos": len(gains),
            "faltas": by_status["Falta"],
            "divergenciasContadas": by_status["Divergência contada"],
        },
        "statusCounts": dict(by_status),
        "ruas": current_summary["ruas"],
        "history": [partial_summary(partial) for partial in partials],
        "products": products,
        "finalInventory": final_inventory,
    }


def safe_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: safe_json(inner) for key, inner in value.items()}
    if isinstance(value, list):
        return [safe_json(item) for item in value]
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


if __name__ == "__main__":
    dashboard = safe_json(build_dashboard())
    payload = json.dumps(dashboard, ensure_ascii=False, indent=2)
    if "--stdout" in sys.argv:
        print(payload)
        raise SystemExit(0)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temp_output = OUTPUT.with_suffix(".tmp")
    temp_output.write_text(payload, encoding="utf-8")
    temp_output.replace(OUTPUT)
    print(f"Dados gerados em {OUTPUT}")
