# WMS OS

Dashboard web para acompanhamento de inventario logistico do Castanhao.

## Comandos

```bash
npm install
npm run data:build
npm run dev
```

O dashboard usa dados consolidados em `src/data/inventory-dashboard.json`.
Para atualizar uma nova parcial, adicione o arquivo no script `scripts/build_inventory_data.py` e rode `npm run data:build`.
