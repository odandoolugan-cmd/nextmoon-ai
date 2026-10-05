import { readFileSync } from 'fs';
const jsCode = readFileSync('./pkg/academia_wasm.js', 'utf8');
const wasmBytes = new Uint8Array(readFileSync('./pkg/academia_wasm_bg.wasm'));
const jsCodePatched = jsCode.replace(/new URL\(['"]academia_wasm_bg\.wasm['"],\s*import\.meta\.url\)/g, `'file://${process.cwd()}/pkg/academia_wasm_bg.wasm'`);
const mod = await import(`data:text/javascript;base64,${Buffer.from(jsCodePatched).toString('base64')}`);
mod.initSync({ module: wasmBytes });

// Simular 100 velas OHLCV con tendencia alcista
const n = 100;
const opens = [], highs = [], lows = [], closes = [], volumes = [];
let precio = 40000;
for (let i = 0; i < n; i++) {
  const cambio = (Math.random() - 0.48) * 500;
  precio += cambio;
  const o = precio - cambio / 2;
  const c = precio;
  const h = Math.max(o, c) + Math.random() * 200;
  const l = Math.min(o, c) - Math.random() * 200;
  opens.push(o); closes.push(c); highs.push(h); lows.push(l);
  volumes.push(1000000 + Math.random() * 500000);
}

const oJson = JSON.stringify(opens);
const hJson = JSON.stringify(highs);
const lJson = JSON.stringify(lows);
const cJson = JSON.stringify(closes);
const vJson = JSON.stringify(volumes);

console.log('═══════════════════════════════════════════');
console.log('📈 TEST ANÁLISIS TÉCNICO COMPLETO (WASM v6)');
console.log('═══════════════════════════════════════════\n');

console.log('💰 Precio actual:', closes[closes.length - 1].toFixed(2));
console.log('');

console.log('📊 INDICADORES BÁSICOS:');
console.log('  RSI(14):       ', mod.calcular_rsi(cJson, 14).toFixed(2));
console.log('  SMA(20):       ', mod.calcular_sma(cJson, 20).toFixed(2));
console.log('  EMA(12):       ', mod.calcular_ema(cJson, 12).toFixed(2));
console.log('  Bollinger:     ', mod.calcular_bollinger(cJson, 20));
console.log('  Volatilidad:   ', mod.calcular_volatilidad(cJson).toFixed(2) + '%');
console.log('  Tendencia:     ', mod.analizar_tendencia(cJson));
console.log('  Soporte/Resist:', mod.detectar_soporte_resistencia(cJson));

console.log('');
console.log('📊 INDICADORES AVANZADOS (v6):');
console.log('  Ichimoku:      ', mod.calcular_ichimoku(hJson, lJson, cJson));
console.log('  Fibonacci:     ', mod.calcular_fibonacci(hJson, lJson));
console.log('  Patrones velas:', mod.detectar_patron_velas(oJson, hJson, lJson, cJson));
console.log('  ADX(14):       ', mod.calcular_adx(hJson, lJson, cJson, 14).toFixed(2));
console.log('  OBV:           ', mod.calcular_obv(cJson, vJson).toFixed(0));
console.log('  VWAP:          ', mod.calcular_vwap(hJson, lJson, cJson, vJson).toFixed(2));
console.log('  Divergencia:   ', mod.detectar_divergencia(cJson));
console.log('  MACD:          ', mod.calcular_macd(cJson));

console.log('');
console.log('🎯 SEÑAL GLOBAL:');
const señal = JSON.parse(mod.generar_senal_compra(cJson, hJson, lJson, oJson, cJson, vJson));
console.log(JSON.stringify(señal, null, 2));
