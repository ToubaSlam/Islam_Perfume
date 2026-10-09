export function batch(total, percentages) {
  if (!Number.isFinite(total) || total <= 0 || percentages.some(p => !Number.isFinite(p) || p < 0 || p > 100) || percentages.reduce((a,b)=>a+b,0) > 100 + 1e-9) throw Error('Enter a positive batch size and percentages that total no more than 100%.');
  const amounts=percentages.map(p=>total*p/100);
  return [...amounts, Math.max(0,total-amounts.reduce((a,b)=>a+b,0))];
}
export function dilution(total, stock, target) {
  if (![total,stock,target].every(Number.isFinite) || total<=0 || stock<=0 || stock>100 || target<=0 || target>stock) throw Error('Target strength must be positive and no higher than stock strength (maximum 100%).');
  const source=total*target/stock; return [source,total-source];
}
export function scale(total,parts) {
  if (!Number.isFinite(total)||total<=0||!parts.length||parts.some(p=>!Number.isFinite(p)||p<=0)) throw Error('Enter a positive target weight and positive parts for every material.');
  const sum=parts.reduce((a,b)=>a+b,0);return parts.map(p=>total*p/sum);
}
