// ═══════════════════════════════════════════════════════════════
// 🎯 BLOQUE 2: BACKTESTING · NextMoon AI
// ═══════════════════════════════════════════════════════════════
// Simula el sistema de trading con datos históricos reales
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 📥 DESCARGAR DATOS HISTÓRICOS DE BINANCE
// ─────────────────────────────────────────────
async function fetchHistoricalData(symbol, days = 365) {
    const symUpper = symbol.toUpperCase().trim();
    const interval = '1h';
    const limit = 1000; // máximo por request de Binance
    const totalVelas = days * 24;
    const requests = Math.ceil(totalVelas / limit);
    
    console.log(`📥 Descargando ${totalVelas} velas de ${symUpper}...`);
    
    const todasLasVelas = [];
    let endTime = Date.now();
    
    for (let i = 0; i < requests; i++) {
        try {
            const url = `https://api.binance.com/api/v3/klines?symbol=${symUpper}USDT&interval=${interval}&limit=${limit}&endTime=${endTime}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            
            if (!Array.isArray(data) || data.length === 0) break;
            
            todasLasVelas.unshift(...data);
            endTime = data[0][0] - 1;
            
            console.log(`📥 ${todasLasVelas.length}/${totalVelas} velas...`);
            
            // Rate limiting: 200ms entre requests
            if (i < requests - 1) await new Promise(r => setTimeout(r, 200));
        } catch(e) {
            console.warn(`⚠️ Error en request ${i+1}:`, e.message);
            break;
        }
    }
    
    console.log(`✅ Descargadas ${todasLasVelas.length} velas`);
    
    return todasLasVelas.map(k => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
    }));
}

// ─────────────────────────────────────────────
// 🧮 CALCULAR INDICADORES EN UN PUNTO
// ─────────────────────────────────────────────
function calcularRSI(closes, periodo = 14) {
    if (closes.length < periodo + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = closes.length - periodo; i < closes.length; i++) {
        const diff = closes[i] - closes[i-1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    const avgGain = gains / periodo;
    const avgLoss = losses / periodo;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calcularEMA(closes, periodo) {
    if (closes.length < periodo) return closes[closes.length-1];
    const k = 2 / (periodo + 1);
    let ema = closes[0];
    for (let i = 1; i < closes.length; i++) {
        ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
}

function calcularSMA(closes, periodo) {
    if (closes.length < periodo) return closes[closes.length-1];
    const slice = closes.slice(-periodo);
    return slice.reduce((a, b) => a + b, 0) / periodo;
}

function calcularBollinger(closes, periodo = 20) {
    if (closes.length < periodo) return { superior: 0, media: 0, inferior: 0 };
    const slice = closes.slice(-periodo);
    const media = slice.reduce((a, b) => a + b, 0) / periodo;
    const variance = slice.reduce((a, b) => a + Math.pow(b - media, 2), 0) / periodo;
    const std = Math.sqrt(variance);
    return {
        superior: media + 2 * std,
        media: media,
        inferior: media - 2 * std
    };
}

function calcularADX(klines, periodo = 14) {
    if (klines.length < periodo + 1) return 0;
    let trSum = 0, plusDM = 0, minusDM = 0;
    for (let i = klines.length - periodo; i < klines.length; i++) {
        const h = klines[i].high, l = klines[i].low, pc = klines[i-1].close;
        const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
        trSum += tr;
        const up = h - klines[i-1].high;
        const down = klines[i-1].low - l;
        if (up > down && up > 0) plusDM += up;
        if (down > up && down > 0) minusDM += down;
    }
    if (trSum === 0) return 0;
    const plusDI = 100 * plusDM / trSum;
    const minusDI = 100 * minusDM / trSum;
    const sum = plusDI + minusDI;
    if (sum === 0) return 0;
    return 100 * Math.abs(plusDI - minusDI) / sum;
}

function calcularATR(klines, periodo = 14) {
    if (klines.length < periodo + 1) return 0;
    let sum = 0;
    for (let i = klines.length - periodo; i < klines.length; i++) {
        const h = klines[i].high, l = klines[i].low, pc = klines[i-1].close;
        sum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    }
    return sum / periodo;
}

// ─────────────────────────────────────────────
// 🎯 CALCULAR LAS 12 SEÑALES EN UN PUNTO
// ─────────────────────────────────────────────
function calcularSeñales(klines, idx) {
    if (idx < 30) return null;
    
    const slice = klines.slice(0, idx + 1);
    const closes = slice.map(k => k.close);
    const volumes = slice.map(k => k.volume);
    const precio = closes[closes.length - 1];
    
    // Indicadores
    const rsi = calcularRSI(closes, 14);
    const ema12 = calcularEMA(closes.slice(-26), 12);
    const ema26 = calcularEMA(closes.slice(-26), 26);
    const macd = ema12 - ema26;
    const macdAnterior = calcularEMA(closes.slice(-27, -1), 12) - calcularEMA(closes.slice(-27, -1), 26);
    const sma20 = calcularSMA(closes, 20);
    const boll = calcularBollinger(closes, 20);
    const adx = calcularADX(slice, 14);
    const atr = calcularATR(slice, 14);
    
    // Volumen
    const volReciente = volumes.slice(-5).reduce((a,b) => a+b, 0) / 5;
    const volPromedio = volumes.slice(-20).reduce((a,b) => a+b, 0) / 20;
    
    // Tendencia
    const tendenciaAlcista = precio > sma20 && macd > 0;
    const tendenciaBajista = precio < sma20 && macd < 0;
    
    // ═══ SEÑALES ═══
    const señales = [];
    
    // 1. RSI
    if (rsi < 30)      señales.push({ tipo: 'COMPRAR', fuerza: 3 });
    else if (rsi > 70) señales.push({ tipo: 'VENDER',  fuerza: 3 });
    else if (rsi < 40) señales.push({ tipo: 'COMPRAR', fuerza: 1 });
    else if (rsi > 60) señales.push({ tipo: 'VENDER',  fuerza: 1 });
    else               señales.push({ tipo: 'NEUTRAL', fuerza: 0 });
    
    // 2. MACD
    if (macd > macdAnterior && macd > 0)      señales.push({ tipo: 'COMPRAR', fuerza: 2 });
    else if (macd < macdAnterior && macd < 0) señales.push({ tipo: 'VENDER',  fuerza: 2 });
    else                                       señales.push({ tipo: 'NEUTRAL', fuerza: 0 });
    
    // 3. Bollinger
    if (precio < boll.inferior)      señales.push({ tipo: 'COMPRAR', fuerza: 2 });
    else if (precio > boll.superior) señales.push({ tipo: 'VENDER',  fuerza: 2 });
    else                              señales.push({ tipo: 'NEUTRAL', fuerza: 0 });
    
    // 4. Precio vs SMA20
    if (precio > sma20) señales.push({ tipo: 'COMPRAR', fuerza: 1 });
    else                 señales.push({ tipo: 'VENDER',  fuerza: 1 });
    
    // 5. Tendencia
    if (tendenciaAlcista)      señales.push({ tipo: 'COMPRAR', fuerza: 2 });
    else if (tendenciaBajista) señales.push({ tipo: 'VENDER',  fuerza: 2 });
    else                        señales.push({ tipo: 'NEUTRAL', fuerza: 0 });
    
    // 6. ADX
    if (adx > 25 && tendenciaAlcista)      señales.push({ tipo: 'COMPRAR', fuerza: 2 });
    else if (adx > 25 && tendenciaBajista) señales.push({ tipo: 'VENDER',  fuerza: 2 });
    else                                    señales.push({ tipo: 'NEUTRAL', fuerza: 0 });
    
    // 7. Volumen
    if (volReciente > volPromedio * 1.2) {
        señales.push({ tipo: tendenciaAlcista ? 'COMPRAR' : 'VENDER', fuerza: 1 });
    } else {
        señales.push({ tipo: 'NEUTRAL', fuerza: 0 });
    }
    
    // ═══ SCORE ═══
    let scoreCompra = 0, scoreVenta = 0;
    for (const s of señales) {
        if (s.tipo === 'COMPRAR') scoreCompra += s.fuerza;
        else if (s.tipo === 'VENDER') scoreVenta += s.fuerza;
    }
    
    // ═══ DECISIÓN ═══
    let decision = 'ESPERAR';
    if (scoreCompra >= 6 && scoreCompra > scoreVenta) decision = 'COMPRAR';
    else if (scoreVenta >= 6 && scoreVenta > scoreCompra) decision = 'VENDER';

    // ⭐ CONFIanza (0-1)
    const totalFuerza = scoreCompra + scoreVenta;
    const confianza = totalFuerza > 0 ? Math.abs(scoreCompra - scoreVenta) / totalFuerza : 0;
    
    return {
        confianza,
        decision,
        scoreCompra,
        scoreVenta,
        precio,
        rsi,
        macd,
        adx,
        atr,
        bollinger: boll,
        sma20
    };
}

// ─────────────────────────────────────────────
// 🎮 SIMULAR OPERACIONES
// ─────────────────────────────────────────────
function simularOperaciones(klines, capitalInicial = 1000, riesgoPorcentaje = 1) {
    const operaciones = [];
    let capital = capitalInicial;
    let operacionAbierta = null;
    
    console.log(`🎮 Simulando ${klines.length} velas...`);
    
    for (let i = 30; i < klines.length; i++) {
        const vela = klines[i];
        
        // Si hay operación abierta, chequear SL/TP
        if (operacionAbierta) {
            const op = operacionAbierta;
            
            // Chequear Stop Loss
            if (op.tipo === 'COMPRAR' && vela.low <= op.sl) {
                const perdida = (op.sl - op.entrada) * op.tamaño;
                capital += perdida;
                operaciones.push({
                    ...op,
                    salida: op.sl,
                    razon: 'SL',
                    ganancia: perdida,
                    duracion: i - op.idxEntrada
                });
                operacionAbierta = null;
                continue;
            }
            
            if (op.tipo === 'VENDER' && vela.high >= op.sl) {
                const perdida = (op.entrada - op.sl) * op.tamaño;
                capital += perdida;
                operaciones.push({
                    ...op,
                    salida: op.sl,
                    razon: 'SL',
                    ganancia: perdida,
                    duracion: i - op.idxEntrada
                });
                operacionAbierta = null;
                continue;
            }
            
            // Chequear Take Profits (TP1, TP2, TP3)
            const tps = [
                { nivel: op.tp1, razon: 'TP1', porcion: 0.33 },
                { nivel: op.tp2, razon: 'TP2', porcion: 0.33 },
                { nivel: op.tp3, razon: 'TP3', porcion: 0.34 }
            ];
            
            for (const tp of tps) {
                if (op.tipo === 'COMPRAR' && vela.high >= tp.nivel && !op['cerrado_' + tp.razon]) {
                    const ganancia = (tp.nivel - op.entrada) * op.tamaño * tp.porcion;
                    capital += ganancia;
                    op['cerrado_' + tp.razon] = true;
                    op.ganancia = (op.ganancia || 0) + ganancia;
                    
                    // Si es TP3, cerrar operación completa
                    if (tp.razon === 'TP3') {
                        operaciones.push({
                            ...op,
                            salida: tp.nivel,
                            razon: 'TP3',
                            duracion: i - op.idxEntrada
                        });
                        operacionAbierta = null;
                    }
                    break;
                }
                
                if (op.tipo === 'VENDER' && vela.low <= tp.nivel && !op['cerrado_' + tp.razon]) {
                    const ganancia = (op.entrada - tp.nivel) * op.tamaño * tp.porcion;
                    capital += ganancia;
                    op['cerrado_' + tp.razon] = true;
                    op.ganancia = (op.ganancia || 0) + ganancia;
                    
                    if (tp.razon === 'TP3') {
                        operaciones.push({
                            ...op,
                            salida: tp.nivel,
                            razon: 'TP3',
                            duracion: i - op.idxEntrada
                        });
                        operacionAbierta = null;
                    }
                    break;
                }
            }
            
            continue;
        }
        
        // Si no hay operación, calcular señales
        const señal = calcularSeñales(klines, i);
        if (!señal) continue;

        // ⭐ FILTRO 1: Confianza minima 15% (era 30% → muy estricto)
        const confianza = señal.confianza || 0;
        if (confianza < 0.20) continue;
        
        // ⭐ FILTRO 2: Tendencia (SMA20 vs SMA50 → mas reactivo que SMA50/200)
        const cierres = klines.slice(0, i + 1).map(k => k.close || k[4]);
        if (cierres.length >= 200) {
            const sma50 = cierres.slice(-50).reduce((a, b) => a + b, 0) / 50;
            const sma200 = cierres.slice(-200).reduce((a, b) => a + b, 0) / 200;
            const tendenciaAlcista = sma50 > sma200;
            if (tendenciaAlcista && señal.decision === 'VENDER') continue;
            if (!tendenciaAlcista && señal.decision === 'COMPRAR') continue;
        }
        
        if (señal.decision === 'COMPRAR' || señal.decision === 'VENDER') {
            const precio = señal.precio;
            const atr = señal.atr;
            
            // Calcular SL/TP (SL 1.5 ATR → equilibrio)
            let sl, tp1, tp2, tp3;
            if (señal.decision === 'COMPRAR') {
                sl = precio - 1.5 * atr;
                tp1 = precio + 2.5 * atr;  // R/B 1.67
                tp2 = precio + 3.5 * atr;  // R/B 2.33
                tp3 = precio + 5.0 * atr;  // R/B 3.33
            } else {
                sl = precio + 1.5 * atr;
                tp1 = precio - 2.5 * atr;
                tp2 = precio - 3.5 * atr;
                tp3 = precio - 5.0 * atr;
            }
            
            // Calcular tamaño de posición
            const riesgoUSD = capital * (riesgoPorcentaje / 100);
            const distanciaSL = Math.abs(precio - sl);
            const tamaño = riesgoUSD / distanciaSL;
            
            if (tamaño > 0 && isFinite(tamaño)) {
                operacionAbierta = {
                    idxEntrada: i,
                    time: vela.time,
                    tipo: señal.decision,
                    entrada: precio,
                    sl,
                    tp1,
                    tp2,
                    tp3,
                    tamaño,
                    capitalAntes: capital,
                    ganancia: 0
                };
            }
        }
    }
    
    console.log(`✅ ${operaciones.length} operaciones simuladas`);
    return { operaciones, capitalFinal: capital };
}

// ─────────────────────────────────────────────
// 📊 CALCULAR MÉTRICAS
// ─────────────────────────────────────────────
function calcularMetricas(operaciones, capitalInicial, capitalFinal) {
    if (operaciones.length === 0) {
        return {
            totalOps: 0,
            winRate: 0,
            profitFactor: 0,
            retornoTotal: 0,
            drawdownMax: 0,
            sharpe: 0,
            mejorOp: 0,
            peorOp: 0,
            rachaMax: 0,
            rachaPerdedora: 0,
            duracionMedia: 0
        };
    }
    
    // Win rate
    const ganadoras = operaciones.filter(o => o.ganancia > 0);
    const perdedoras = operaciones.filter(o => o.ganancia <= 0);
    const winRate = (ganadoras.length / operaciones.length) * 100;
    
    // Profit factor
    const gananciaTotal = ganadoras.reduce((s, o) => s + o.ganancia, 0);
    const perdidaTotal = Math.abs(perdedoras.reduce((s, o) => s + o.ganancia, 0));
    const profitFactor = perdidaTotal > 0 ? gananciaTotal / perdidaTotal : gananciaTotal > 0 ? 999 : 0;
    
    // Retorno total
    const retornoTotal = ((capitalFinal - capitalInicial) / capitalInicial) * 100;
    
    // Drawdown máximo
    let equity = capitalInicial;
    let maxEquity = capitalInicial;
    let drawdownMax = 0;
    for (const op of operaciones) {
        equity += op.ganancia;
        if (equity > maxEquity) maxEquity = equity;
        const dd = ((equity - maxEquity) / maxEquity) * 100;
        if (dd < drawdownMax) drawdownMax = dd;
    }
    
    // Sharpe ratio (simplificado)
    const retornos = operaciones.map(o => o.ganancia / capitalInicial);
    const retornoMedio = retornos.reduce((a, b) => a + b, 0) / retornos.length;
    const varianza = retornos.reduce((a, b) => a + Math.pow(b - retornoMedio, 2), 0) / retornos.length;
    const desviacion = Math.sqrt(varianza);
    const sharpe = desviacion > 0 ? (retornoMedio / desviacion) * Math.sqrt(operaciones.length) : 0;
    
    // Mejor y peor
    const mejorOp = Math.max(...operaciones.map(o => o.ganancia));
    const peorOp = Math.min(...operaciones.map(o => o.ganancia));
    
    // Rachas
    let rachaMax = 0, rachaActual = 0;
    let rachaPerdedora = 0, rachaPerdedoraActual = 0;
    for (const op of operaciones) {
        if (op.ganancia > 0) {
            rachaActual++;
            rachaPerdedoraActual = 0;
            if (rachaActual > rachaMax) rachaMax = rachaActual;
        } else {
            rachaPerdedoraActual++;
            rachaActual = 0;
            if (rachaPerdedoraActual > rachaPerdedora) rachaPerdedora = rachaPerdedoraActual;
        }
    }
    
    // Duración media
    const duracionMedia = operaciones.reduce((s, o) => s + (o.duracion || 0), 0) / operaciones.length;
    
    return {
        totalOps: operaciones.length,
        ganadoras: ganadoras.length,
        perdedoras: perdedoras.length,
        winRate,
        profitFactor,
        retornoTotal,
        drawdownMax,
        sharpe,
        mejorOp,
        peorOp,
        rachaMax,
        rachaPerdedora,
        duracionMedia,
        capitalFinal
    };
}

// ─────────────────────────────────────────────
// 🚀 EJECUTAR BACKTEST COMPLETO
// ─────────────────────────────────────────────
async function ejecutarBacktest(symbol = 'BTC', days = 365) {
    console.log(`🎯 BACKTEST ${symbol} · ${days} días`);
    
    try {
        // 1. Descargar datos
        const klines = await fetchHistoricalData(symbol, days);
        if (klines.length < 100) {
            throw new Error('Datos insuficientes');
        }
        
        // 2. Simular
        const { operaciones, capitalFinal } = simularOperaciones(klines, 1000, 1);
        
        // 3. Calcular métricas
        const metricas = calcularMetricas(operaciones, 1000, capitalFinal);
        
        // 4. Equity curve
        const equityCurve = [1000];
        let eq = 1000;
        for (const op of operaciones) {
            eq += op.ganancia;
            equityCurve.push(eq);
        }
        
        return {
            symbol,
            days,
            klines: klines.length,
            operaciones,
            metricas,
            equityCurve
        };
    } catch(e) {
        console.error('❌ Error en backtest:', e);
        throw e;
    }
}

// ─────────────────────────────────────────────
// 🎨 MOSTRAR BACKTEST (Modal)
// ─────────────────────────────────────────────
function mostrarBacktest(reporte) {
    const { symbol, days, klines, operaciones, metricas, equityCurve } = reporte;
    const modalAnterior = document.getElementById('backtestModal');
    if (modalAnterior) modalAnterior.remove();
    
    const colorWinRate = metricas.winRate >= 60 ? '#10b981' : metricas.winRate >= 50 ? '#f59e0b' : '#ef4444';
    const colorPF = metricas.profitFactor >= 1.5 ? '#10b981' : metricas.profitFactor >= 1.2 ? '#f59e0b' : '#ef4444';
    const colorRetorno = metricas.retornoTotal > 0 ? '#10b981' : '#ef4444';
    const colorDD = metricas.drawdownMax > -20 ? '#10b981' : metricas.drawdownMax > -35 ? '#f59e0b' : '#ef4444';
    const esRentable = metricas.retornoTotal > 0 && metricas.profitFactor > 1;
    const veredicto = esRentable ? '✅ SISTEMA RENTABLE' : '❌ SISTEMA NO RENTABLE';
    const colorVeredicto = esRentable ? '#10b981' : '#ef4444';
    
    const modal = document.createElement('div');
    modal.id = 'backtestModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto;';
    modal.innerHTML = `
        <div style="background:#0f172a;border-radius:1.5rem;max-width:800px;width:100%;padding:1.5rem;border:2px solid #8b5cf6;max-height:90vh;overflow-y:auto;">
            <h3 style="color:#a78bfa;margin-bottom:1rem;">🎯 BACKTESTING · ${symbol} · ${days} días</h3>
            <div style="background:${colorVeredicto}20;border:2px solid ${colorVeredicto};border-radius:12px;padding:14px;text-align:center;margin-bottom:16px;">
                <div style="font-size:1.2rem;font-weight:bold;color:${colorVeredicto};">${veredicto}</div>
                <div style="font-size:0.7rem;color:#94a3b8;margin-top:4px;">${klines} velas · ${metricas.totalOps} operaciones</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.75rem;margin-bottom:16px;">
                <div style="background:#0a0f1e;padding:10px;border-radius:8px;">
                    <div style="color:#94a3b8;font-size:0.6rem;">WIN RATE</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:${colorWinRate};">${metricas.winRate.toFixed(1)}%</div>
                </div>
                <div style="background:#0a0f1e;padding:10px;border-radius:8px;">
                    <div style="color:#94a3b8;font-size:0.6rem;">PROFIT FACTOR</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:${colorPF};">${metricas.profitFactor === 999 ? '∞' : metricas.profitFactor.toFixed(2)}</div>
                </div>
                <div style="background:#0a0f1e;padding:10px;border-radius:8px;">
                    <div style="color:#94a3b8;font-size:0.6rem;">RETORNO</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:${colorRetorno};">${metricas.retornoTotal >= 0 ? '+' : ''}${metricas.retornoTotal.toFixed(2)}%</div>
                </div>
                <div style="background:#0a0f1e;padding:10px;border-radius:8px;">
                    <div style="color:#94a3b8;font-size:0.6rem;">DRAWDOWN</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:${colorDD};">${metricas.drawdownMax.toFixed(2)}%</div>
                </div>
            </div>
            <canvas id="backtestChart" width="800" height="200" style="width:100%;height:auto;background:#0a0f1e;border-radius:8px;"></canvas>
            <div style="background:rgba(139,92,246,0.1);border-radius:8px;padding:10px;font-size:0.7rem;color:#a78bfa;margin-top:16px;">
                <strong>📚 Interpretación:</strong><br>
                • Win Rate >60% = Excelente<br>
                • Profit Factor >1.5 = Excelente<br>
                • Drawdown <-20% = Riesgoso<br>
                • Sharpe >1.5 = Excelente
            </div>
            <button onclick="document.getElementById('backtestModal').remove()" style="margin-top:1rem;background:#8b5cf6;border:none;padding:0.5rem 1rem;border-radius:2rem;color:white;cursor:pointer;font-weight:bold;">✕ Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => dibujarEquityCurve(equityCurve), 100);
}

function dibujarEquityCurve(equityCurve) {
    const canvas = document.getElementById('backtestChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const n = equityCurve.length;
    if (n < 2) return;
    const min = Math.min(...equityCurve);
    const max = Math.max(...equityCurve);
    const rango = max - min || 1;
    const xStep = W / (n - 1);
    const yScale = (v) => H - ((v - min) / rango) * (H - 20) - 10;
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(96,165,250,0.1)';
    for (let i = 0; i <= 4; i++) {
        const y = (H / 4) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, 'rgba(139,92,246,0.4)');
    gradient.addColorStop(1, 'rgba(139,92,246,0.05)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i < n; i++) ctx.lineTo(i * xStep, yScale(equityCurve[i]));
    ctx.lineTo(W, H);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
        const x = i * xStep, y = yScale(equityCurve[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui';
    ctx.fillText('$' + max.toFixed(0), 4, 12);
    ctx.fillText('$' + min.toFixed(0), 4, H - 4);
}

// ═══════════════════════════════════════════════════════════════
// 🌐 EXPONER FUNCIONES AL SCOPE GLOBAL
// ═══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
    window.fetchHistoricalData = fetchHistoricalData;
    window.ejecutarBacktest = ejecutarBacktest;
    window.mostrarBacktest = mostrarBacktest;
    window.dibujarEquityCurve = dibujarEquityCurve;
    console.log('✅ backtest.js expuesto en window');
}
