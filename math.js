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

// Parse form values without treating an empty field as zero.
function numeric(value) {
  if(typeof value==='string'){
    value=value.trim();
    if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value))return null;
    value=Number(value);
  }
  return typeof value==='number'&&Number.isFinite(value)?value:null;
}
const finiteOrNull=value=>Number.isFinite(value)?value:null;

export function scaleTargets(startingReading,fragranceG,carrierG) {
  const start=numeric(startingReading),oil=numeric(fragranceG),carrier=numeric(carrierG);
  const validStart=start!==null&&start>=0;
  const afterOil=validStart&&oil!==null&&oil>=0?finiteOrNull(start+oil):null;
  const afterAlcohol=afterOil!==null&&carrier!==null&&carrier>=0?finiteOrNull(afterOil+carrier):null;
  return {afterOil,afterAlcohol};
}

export function liquidPerfume({batchML,concentration,trialDrops,dropsPerML,fragranceDensity=0.9,carrierDensity=0.8}={}) {
  const batch=numeric(batchML),percent=numeric(concentration),drops=numeric(trialDrops),conversion=numeric(dropsPerML);
  const fragranceRho=numeric(fragranceDensity),carrierRho=numeric(carrierDensity);
  const warnings=[];
  if(batch!==null&&batch<=0)warnings.push('Finished batch must be greater than zero.');
  if(percent!==null&&percent>100)warnings.push('Fragrance concentration cannot exceed 100%.');
  if(percent!==null&&percent<0)warnings.push('Fragrance concentration cannot be negative.');
  if(drops!==null&&drops<=0)warnings.push('Trial drops must be greater than zero.');
  if(conversion!==null&&conversion<=0)warnings.push('Estimated drops per mL must be greater than zero.');
  const volumeValid=batch!==null&&batch>0&&percent!==null&&percent>=0&&percent<=100;
  // Divide the percentage first to avoid unnecessary overflow for large batches.
  const fragranceML=volumeValid?finiteOrNull(batch*(percent/100)):null;
  const carrierML=volumeValid&&fragranceML!==null?finiteOrNull(batch-fragranceML):null;
  const trial= drops!==null&&drops>0&&conversion!==null&&conversion>0?finiteOrNull(drops/conversion):null;
  const trialML=trial!==null&&trial>0?trial:null;
  const multiplier=fragranceML!==null&&trialML!==null?finiteOrNull(fragranceML/trialML):null;
  const fragranceG=fragranceML!==null&&fragranceRho!==null&&fragranceRho>0?finiteOrNull(fragranceML*fragranceRho):null;
  const carrierG=carrierML!==null&&carrierRho!==null&&carrierRho>0?finiteOrNull(carrierML*carrierRho):null;
  return {fragranceML,carrierML,trialML,multiplier,fragranceG,carrierG,warnings};
}
