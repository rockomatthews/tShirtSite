export function computePriceCents(baseCostCents: number, markupPct: number) {
  const margin = Math.round((baseCostCents * markupPct) / 100);
  return baseCostCents + margin;
}

export function splitCreatorShare(storeMarginCents: number, creatorSharePct = 50) {
  return Math.round((storeMarginCents * creatorSharePct) / 100);
}


