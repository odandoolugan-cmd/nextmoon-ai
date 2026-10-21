// ═══════════════════════════════════════════════════════════════
// 🎮 PAPER TRADING FUNCIONAL · NextMoon AI
// ═══════════════════════════════════════════════════════════════

const __PT_KEY = 'nextmoon_paper_trading_v2';
const __PT_CAPITAL_INICIAL = 1000;
const __PT_RIESGO_DEFECTO = 1;

// ═══════════════════════════════════════════════════════════════
// 🚨 REPARACIÓN INMEDIATA (antes de getPaperTrading)
// ═══════════════════════════════════════════════════════════════
(function repararAntesDeCargar() {
    try {
        const KEY = 'nextmoon_paper_trading_v2';
        const data = localStorage.getItem(KEY);
        if (!data) return;
        
        let cartera = JSON.parse(data);
        const num = (v, fb = 0) => {
            const n = parseFloat(v);
            return isNaN(n) || !isFinite(n) ? fb : n;
        };
        
        let reparada = false;
        
        // Reparar capitalInicial
        if (!isFinite(num(cartera.capitalInicial, NaN)) || num(cartera.capitalInicial) <= 0) {
            cartera.capitalInicial = 1000;
            reparada = true;
        }
        
        // Reparar capitalActual
        const capAct = num(cartera.capitalActual, NaN);
        if (isNaN(capAct) || capAct < 0) {
            // Reconstruir basado en posiciones
            const totalEnPos = (cartera.posiciones || []).reduce((s, p) => s + num(p.cantidadUSD), 0);
            cartera.capitalActual = Math.max(0, cartera.capitalInicial - totalEnPos);
            reparada = true;
        }
        
        // Filtrar posiciones corruptas
        const posicionesOriginales = (cartera.posiciones || []).length;
        cartera.posiciones = (cartera.posiciones || []).filter(p => {
            if (!p) return false;
            const cantUSD = num(p.cantidadUSD, 0);
            const cant = num(p.cantidad, 0);
            return cantUSD > 0 && cant > 0;
        });
        if (cartera.posiciones.length !== posicionesOriginales) reparada = true;
        
        // Filtrar historial corrupto
        cartera.historial = (cartera.historial || []).filter(h => {
            if (!h) return false;
            return isFinite(num(h.pnl, NaN));
        });
        
        if (reparada) {
            localStorage.setItem(KEY, JSON.stringify(cartera));
            console.log('✅ Cartera reparada ANTES de cargar:', {
                capitalInicial: cartera.capitalInicial,
                capitalActual: cartera.capitalActual,
                posiciones: cartera.posiciones.length
            });
        }
    } catch(e) {
        console.warn('⚠️ Error en reparación inmediata:', e);
        try { localStorage.removeItem('nextmoon_paper_trading_v2'); } catch(e2) {}
    }
})();

function getPaperTrading() {
    try {
        const data = localStorage.getItem(__PT_KEY);
        if (data) {
            const cartera = JSON.parse(data);
            
            // ⭐ AUTO-REPARAR valores NaN
            const num = (v, fb) => {
                const n = parseFloat(v);
                return isNaN(n) || !isFinite(n) ? fb : n;
            };
            cartera.capitalInicial = num(cartera.capitalInicial, 1000);
            cartera.capitalActual = num(cartera.capitalActual, cartera.capitalInicial);
            cartera.posiciones = (cartera.posiciones || []).filter(p => p && isFinite(num(p.cantidadUSD, 0)));
            if (!cartera.capitalInicial) cartera.capitalInicial = __PT_CAPITAL_INICIAL;
            if (cartera.capitalActual === undefined) cartera.capitalActual = __PT_CAPITAL_INICIAL;
            if (!cartera.posiciones) cartera.posiciones = [];
            if (!cartera.historial) cartera.historial = [];
            if (!cartera.metricas) cartera.metricas = { totalOps: 0, ganadoras: 0, perdedoras: 0, pnlTotal: 0, mejorOp: 0, peorOp: 0 };
            return cartera;
        }
    } catch(e) {
        console.warn('⚠️ Error leyendo paper trading:', e);
    }
    return {
        capitalInicial: __PT_CAPITAL_INICIAL,
        capitalActual: __PT_CAPITAL_INICIAL,
        posiciones: [],
        historial: [],
        metricas: { totalOps: 0, ganadoras: 0, perdedoras: 0, pnlTotal: 0, mejorOp: 0, peorOp: 0 },
        creado: new Date().toISOString()
    };
}

function savePaperTrading(cartera) {
    try {
        // ⭐ Sanear antes de guardar
        const num = (v, fb = 0) => {
            const n = parseFloat(v);
            return isNaN(n) || !isFinite(n) ? fb : n;
        };
        
        cartera.capitalInicial = num(cartera.capitalInicial, 1000);
        cartera.capitalActual = num(cartera.capitalActual, 1000);
        cartera.posiciones = (cartera.posiciones || []).filter(p => p && isFinite(num(p.cantidadUSD)));
        cartera.historial = (cartera.historial || []).filter(h => h && isFinite(num(h.pnl)));
        
        localStorage.setItem(__PT_KEY, JSON.stringify(cartera));
        return true;
    } catch(e) {
        console.error('❌ Error guardando paper trading:', e);
        return false;
    }
}

function resetPaperTrading() {
    if (!confirm('⚠️ ¿Seguro que quieres resetear la cartera virtual a $' + __PT_CAPITAL_INICIAL + '?')) return;
    const cartera = {
        capitalInicial: __PT_CAPITAL_INICIAL,
        capitalActual: __PT_CAPITAL_INICIAL,
        posiciones: [],
        historial: [],
        metricas: { totalOps: 0, ganadoras: 0, perdedoras: 0, pnlTotal: 0, mejorOp: 0, peorOp: 0 },
        creado: new Date().toISOString()
    };
    savePaperTrading(cartera);
    renderizarPaperTrading();
    if (typeof showToast === 'function') showToast('🔄 Cartera reseteada');
}

// ─────────────────────────────────────────────
// 🎯 CORE: ABRIR / CERRAR OPERACIONES
// ─────────────────────────────────────────────
function abrirOperacionVirtual(symbol, tipo, precioEntrada, sl, tp1, tp2, tp3, cantidadUSD) {
    if (!symbol || !tipo || !precioEntrada) {
        console.warn('⚠️ abrirOperacionVirtual: parámetros incompletos');
        return null;
    }
    
    const cartera = getPaperTrading();
    
    if (!cantidadUSD) {
        const riesgoUSD = cartera.capitalActual * (__PT_RIESGO_DEFECTO / 100);
        const distanciaSL = sl ? Math.abs(precioEntrada - sl) : 0;
        if (distanciaSL > 0) {
            cantidadUSD = Math.min((riesgoUSD / distanciaSL) * precioEntrada, cartera.capitalActual * 0.5);
        } else {
            cantidadUSD = cartera.capitalActual * 0.1;
        }
    }
    
    if (cantidadUSD > cartera.capitalActual) {
        if (typeof showToast === 'function') showToast('❌ Capital insuficiente ($' + cartera.capitalActual.toFixed(2) + ')', true);
        return null;
    }
    
    const cantidad = cantidadUSD / precioEntrada;
    
    const posicion = {
        id: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        symbol: symbol.toUpperCase(),
        tipo: tipo.toUpperCase().includes('COMPRAR') ? 'LONG' : 'SHORT',
        precioEntrada: precioEntrada,
        cantidad: cantidad,
        cantidadUSD: cantidadUSD,
        sl: sl || null,
        tp1: tp1 || null,
        tp2: tp2 || null,
        tp3: tp3 || null,
        fechaApertura: new Date().toISOString(),
        estado: 'abierta'
    };
    
    cartera.capitalActual -= cantidadUSD;
    cartera.posiciones.push(posicion);
    cartera.metricas.totalOps++;
    savePaperTrading(cartera);
    
    if (typeof showToast === 'function') {
        showToast('🎮 ' + posicion.tipo + ' ' + posicion.symbol + ' · $' + cantidadUSD.toFixed(2) + ' @ $' + precioEntrada.toFixed(2));
    }
    
    renderizarPaperTrading();
    return posicion;
}

function cerrarOperacion(id, precioActual, motivo) {
    const cartera = getPaperTrading();
    const idx = cartera.posiciones.findIndex(p => p.id === id);
    if (idx === -1) {
        console.warn('⚠️ Posición no encontrada:', id);
        return null;
    }
    
    const pos = cartera.posiciones[idx];
    if (!precioActual) precioActual = pos.precioEntrada;
    
    let pnl = 0;
    if (pos.tipo === 'LONG') {
        pnl = (precioActual - pos.precioEntrada) * pos.cantidad;
    } else {
        pnl = (pos.precioEntrada - precioActual) * pos.cantidad;
    }
    const pnlPct = (pnl / pos.cantidadUSD) * 100;
    const valorCierre = pos.cantidadUSD + pnl;
    
    cartera.capitalActual += valorCierre;
    
    cartera.metricas.pnlTotal += pnl;
    if (pnl > 0) cartera.metricas.ganadoras++;
    else if (pnl < 0) cartera.metricas.perdedoras++;
    if (pnl > cartera.metricas.mejorOp) cartera.metricas.mejorOp = pnl;
    if (pnl < cartera.metricas.peorOp) cartera.metricas.peorOp = pnl;
    
    const opCerrada = {
        id: pos.id, symbol: pos.symbol, tipo: pos.tipo,
        precioEntrada: pos.precioEntrada, precioCierre: precioActual,
        cantidad: pos.cantidad, cantidadUSD: pos.cantidadUSD,
        sl: pos.sl, tp1: pos.tp1,
        fechaApertura: pos.fechaApertura,
        fechaCierre: new Date().toISOString(),
        pnl: pnl, pnlPct: pnlPct, valorCierre: valorCierre,
        motivo: motivo || 'manual', estado: 'cerrada'
    };
    
    cartera.posiciones.splice(idx, 1);
    cartera.historial.unshift(opCerrada);
    if (cartera.historial.length > 100) cartera.historial.pop();
    
    savePaperTrading(cartera);
    
    if (typeof showToast === 'function') {
        const emoji = pnl > 0 ? '✅' : pnl < 0 ? '❌' : '⚪';
        showToast(emoji + ' ' + pos.symbol + ' cerrada · P&L: ' + (pnl >= 0 ? '+' : '') + '$' + pnl.toFixed(2) + ' (' + (pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(2) + '%)');
    }
    
    renderizarPaperTrading();
    return opCerrada;
}

function calcularPnL(pos, precioActual) {
    if (pos.tipo === 'LONG') return (precioActual - pos.precioEntrada) * pos.cantidad;
    return (pos.precioEntrada - precioActual) * pos.cantidad;
}

function getEstadisticas() {
    const c = getPaperTrading();
    
    // ⭐ Log de diagnóstico
    console.log('📊 getEstadisticas: capitalInicial=', c.capitalInicial, 'capitalActual=', c.capitalActual, 'posiciones=', c.posiciones.length);
    // ⭐ Helper: número seguro (evita NaN)
    const num = (v, fallback = 0) => {
        const n = parseFloat(v);
        return isNaN(n) || !isFinite(n) ? fallback : n;
    };
const totalOpsCerradas = c.historial.length;
const ganadoras = c.historial.filter(o => num(o.pnl) > 0).length;
const perdedoras = c.historial.filter(o => num(o.pnl) < 0).length;

// Cálculos protegidos contra NaN/undefined
const totalOpsSeguro = totalOpsCerradas || 0;
const winRate = totalOpsSeguro > 0 ? ((ganadoras / totalOpsSeguro) * 100) : 0;

// Profit Factor seguro
const gananciaTotal = c.historial.filter(o => num(o.pnl) > 0).reduce((s, o) => s + num(o.pnl), 0);
const perdidaTotal = Math.abs(c.historial.filter(o => num(o.pnl) < 0).reduce((s, o) => s + num(o.pnl), 0));

    // ⭐ Filtrar posiciones corruptas ANTES de sumar
    const posicionesValidas = c.posiciones.filter(p => {
        if (!p) return false;
        const cantUSD = num(p.cantidadUSD, 0);
        const cant = num(p.cantidad, 0);
        return cantUSD > 0 && cant > 0;
    });
    const capitalEnPos = posicionesValidas.length > 0 
        ? posicionesValidas.reduce((s, p) => s + num(p.cantidadUSD), 0)
        : 0;
    const capitalInicial = num(c.capitalInicial, 1000);
    const capitalActual = num(c.capitalActual, 0);
    const rendimiento = capitalInicial > 0 ? ((capitalActual + capitalEnPos - capitalInicial) / capitalInicial * 100) : 0;
    // Profit factor
    const ganancias = c.historial.filter(o => num(o.pnl) > 0).reduce((s, o) => s + o.pnl, 0);
    const perdidas = Math.abs(c.historial.filter(o => num(o.pnl) < 0).reduce((s, o) => s + o.pnl, 0));
    const profitFactor = perdidas > 0 ? (ganancias / perdidas) : (ganancias > 0 ? 999 : 0);
    // ⭐ NUEVAS MÉTRICAS AVANZADAS ⭐

    // 1. Expectancy (ganancia media por op)
    const expectancy = totalOpsCerradas > 0 ? pnlTotal / totalOpsCerradas : 0;

    // 2. Racha ganadora/perdedora máxima
    let rachaGanadora = 0, rachaPerdedora = 0;
    let rachaActualGan = 0, rachaActualPer = 0;
    for (const op of c.historial.slice().reverse()) { // cronológico
        if (num(op.pnl) > 0) {
            rachaActualGan++;
            rachaActualPer = 0;
            if (rachaActualGan > rachaGanadora) rachaGanadora = rachaActualGan;
        } else if (num(op.pnl) < 0) {
            rachaActualPer++;
            rachaActualGan = 0;
            if (rachaActualPer > rachaPerdedora) rachaPerdedora = rachaActualPer;
        }
    }
    
    // 3. Max Drawdown en el historial
    let equity = c.capitalInicial;
    let maxEquity = c.capitalInicial;
    let maxDD = 0;
    for (const op of c.historial.slice().reverse()) { // cronológico
        equity += op.pnl;
        if (equity > maxEquity) maxEquity = equity;
        const dd = (maxEquity - equity) / maxEquity * 100;
        if (dd > maxDD) maxDD = dd;
    }
    
    // 4. Sharpe Ratio (simplificado, asume tasa libre 0)
    let sharpe = 0;
    if (totalOpsCerradas > 1) {
        const pnls = c.historial.map(o => num(o.pnl) / 100); // normalizado
        const media = pnls.reduce((a, b) => a + b, 0) / pnls.length;
        const varianza = pnls.reduce((s, x) => s + Math.pow(x - media, 2), 0) / pnls.length;
        const desv = Math.sqrt(varianza);
        sharpe = desv > 0 ? (media / desv) * Math.sqrt(252) : 0; // anualizado
    }
    
    // 5. Sortino Ratio (solo volatilidad negativa)
    let sortino = 0;
    if (totalOpsCerradas > 1) {
        const pnls = c.historial.map(o => num(o.pnl) / 100);
        const media = pnls.reduce((a, b) => a + b, 0) / pnls.length;
        const negativos = pnls.filter(p => p < 0);
        if (negativos.length > 0) {
            const varNeg = negativos.reduce((s, x) => s + x * x, 0) / negativos.length;
            const desvNeg = Math.sqrt(varNeg);
            sortino = desvNeg > 0 ? (media / desvNeg) * Math.sqrt(252) : 0;
        }
    }
    
    // 6. Kelly Criterion (% óptimo del capital a arriesgar)
    let kelly = 0;
    if (ganadoras > 0 && perdedoras > 0) {
        const avgWin = ganancias / ganadoras;
        const avgLoss = perdidas / perdedoras;
        const W = ganadoras / totalOpsCerradas;
        const R = avgWin / avgLoss; // ratio
        if (R > 0) kelly = Math.max(0, Math.min(0.25, W - (1 - W) / R)); // cap al 25%
    }
    
    // ⭐ PROTECCIÓN FINAL: safe() en TODOS los campos numéricos
    const safeNum = (v, fb = 0) => {
        const n = parseFloat(v);
        return isNaN(n) || !isFinite(n) ? fb : n;
    };
    
    return {
        capitalInicial: safeNum(capitalInicial, 1000),
        capitalActual: safeNum(capitalActual, 1000),
        capitalEnPosiciones: safeNum(capitalEnPos, 0),
        capitalTotal: safeNum(capitalActual, 1000) + safeNum(capitalEnPos, 0),
        posicionesAbiertas: (c.posiciones || []).length,
        totalOpsCerradas: safeNum(totalOpsCerradas, 0),
        ganadoras: safeNum(ganadoras, 0),
        perdedoras: safeNum(perdedoras, 0),
        winRate: num(winRate, 0).toFixed(1),
        pnlTotal: num(pnlTotal, 0).toFixed(2),
        rendimiento: num(rendimiento, 0).toFixed(2),
        profitFactor: num(profitFactor, 0).toFixed(2),
        mejorOp: num(c.metricas?.mejorOp).toFixed(2),
        peorOp: num(c.metricas?.peorOp).toFixed(2),
        // ⭐ AVANZADAS
        expectancy: expectancy.toFixed(2),
        rachaGanadora: rachaGanadora,
        rachaPerdedora: rachaPerdedora,
        maxDrawdown: maxDD.toFixed(2),
        sharpe: sharpe.toFixed(2),
        sortino: sortino.toFixed(2),
        kelly: (kelly * 100).toFixed(1)
    };
}

// ─────────────────────────────────────────────
// 🎨 RENDERIZADO
// ─────────────────────────────────────────────
function renderizarPaperTrading() {
    const container = document.getElementById('paperTradingContent');
    if (!container) {
        console.warn('⚠️ paperTradingContent no encontrado');
        return;
    }
    
    // ⭐ RECONSTRUIR capital si está corrupto
    try {
        const c = getPaperTrading();
        const capitalEnPos = (c.posiciones || []).reduce((s, p) => {
            const cant = parseFloat(p.cantidadUSD);
            return s + (isNaN(cant) ? 0 : cant);
        }, 0);
        
        const capIni = parseFloat(c.capitalInicial) || 1000;
        const capAct = parseFloat(c.capitalActual);
        
        if (!isFinite(capAct) || capAct < 0) {
            c.capitalActual = capIni - capitalEnPos;
            if (c.capitalActual < 0) c.capitalActual = capIni;
            savePaperTrading(c);
            console.log('🔧 Capital reconstruido al renderizar:', c.capitalActual);
        }
    } catch(e) {}
    
    // ⭐ FIX DEFINITIVO: Recargar datos frescos del localStorage
    let _freshData = null;
    try {
        _freshData = JSON.parse(localStorage.getItem('nextmoon_paper_trading_v2'));
    } catch(e) {}
    
    // Si los datos frescos tienen capital válido, usarlos
    if (_freshData && isFinite(parseFloat(_freshData.capitalActual))) {
        // Actualizar el objeto en memoria
        const c = getPaperTrading();
        c.capitalInicial = parseFloat(_freshData.capitalInicial) || 1000;
        c.capitalActual = parseFloat(_freshData.capitalActual) || 1000;
        savePaperTrading(c);
    }
    
    // ⭐ VERIFICAR NaN ANTES DE RENDERIZAR
    let c = getPaperTrading();
    const isNaNValue = (v) => isNaN(parseFloat(v)) || !isFinite(parseFloat(v));
    
    if (false) { // DESACTIVADO: no resetear cartera al renderizar
        console.warn('🚨 NaN detectado en render → RESET FORZADO');
        c = {
            capitalInicial: 1000,
            capitalActual: 1000,
            posiciones: [],
            historial: [],
            metricas: { totalOps: 0, ganadoras: 0, perdedoras: 0, pnlTotal: 0, mejorOp: 0, peorOp: 0 },
            creado: new Date().toISOString()
        };
        savePaperTrading(c);
    }
    
    // Filtrar posiciones corruptas
    c.posiciones = (c.posiciones || []).filter(p => p && !isNaNValue(p.cantidadUSD) && parseFloat(p.cantidadUSD) > 0);
    
    // Filtrar historial corrupto
    c.historial = (c.historial || []).filter(h => h && !isNaNValue(h.pnl));
    
    const stats = getEstadisticas();
    
    // ⭐ FIX DEFINITIVO: Si stats tiene NaN, resetear y recalcular
    const isNaNStats = (v) => isNaN(parseFloat(v)) || !isFinite(parseFloat(v));
    if (false) { // DESACTIVADO: no resetear cartera al detectar NaN
        console.warn('🚨 Stats con NaN → RESET FORZADO');
        const KEY = 'nextmoon_paper_trading_v2';
        localStorage.removeItem(KEY);
        // Resetear cartera en memoria
        const fresh = getPaperTrading();
        Object.assign(stats, {
            capitalInicial: 1000,
            capitalActual: 1000,
            capitalEnPosiciones: 0,
            capitalTotal: 1000,
            posicionesAbiertas: 0,
            totalOpsCerradas: 0,
            ganadoras: 0,
            perdedoras: 0,
            winRate: '0.0',
            pnlTotal: '0.00',
            rendimiento: '+0.00',
            profitFactor: '0.00',
            mejorOp: '0.00',
            peorOp: '0.00'
        });
        savePaperTrading(fresh);
    }
    const fmtUSD = (n) => {
        const num = parseFloat(n);
        return '$' + (isNaN(num) || !isFinite(num) ? '0.00' : num.toFixed(2));
    };
    const fmtPct = (n) => {
        const num = parseFloat(n);
        if (isNaN(num) || !isFinite(num)) return '0.00%';
        return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
    };
    const colorPnL = (n) => parseFloat(n) > 0 ? '#10b981' : parseFloat(n) < 0 ? '#ef4444' : '#94a3b8';
    
    const precioActual = (typeof currentTokenData !== 'undefined' && currentTokenData?.price) ? currentTokenData.price : null;
    const symbolActual = (typeof currentToken !== 'undefined' && currentToken) ? currentToken : null;
    
    let html = '';
    
    // ═══ MÉTRICAS PRINCIPALES ═══
    html += '<div class="pt-metrics">';
html += '<div class="pt-metric"><div class="pt-label">💰 Capital total</div><div class="pt-value">$' + ((stats.capitalActual || 0) + (c.posiciones || []).reduce((sum, p) => sum + (parseFloat(p.cantidadUSD) || 0), 0)).toFixed(2) + '</div></div>';
html += '<div class="pt-metric"><div class="pt-label">💵 Disponible</div><div class="pt-value">$' + (stats.capitalActual || 0).toFixed(2) + '</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">📊 Rendimiento</div><div class="pt-value" style="color:' + colorPnL(stats.rendimiento) + ';">' + fmtPct(stats.rendimiento) + '</div></div>';
    html += '</div>';
    
    html += '<div class="pt-metrics">';
    html += '<div class="pt-metric"><div class="pt-label">🎯 Win Rate</div><div class="pt-value">' + (stats.winRate !== undefined && !isNaN(stats.winRate) ? Number(stats.winRate).toFixed(2) : '0.00') + '%</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">📊 Profit Factor</div><div class="pt-value">' + (stats.profitFactor !== undefined && !isNaN(stats.profitFactor) ? Number(stats.profitFactor).toFixed(2) : '0.00') + '</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">📈 Ops</div><div class="pt-value">' + (stats.totalOpsCerradas !== undefined ? stats.totalOpsCerradas : 0) + '</div></div>';
    html += '</div>';
    
    // ⭐ MÉTRICAS AVANZADAS
    if (stats.totalOpsCerradas > 0) {
        const colorSharpe = parseFloat(stats.sharpe) > 1 ? '#10b981' : parseFloat(stats.sharpe) > 0 ? '#f59e0b' : '#ef4444';
        const colorSortino = parseFloat(stats.sortino) > 1.5 ? '#10b981' : parseFloat(stats.sortino) > 0 ? '#f59e0b' : '#ef4444';
        const colorDD = parseFloat(stats.maxDrawdown) < 20 ? '#10b981' : parseFloat(stats.maxDrawdown) < 40 ? '#f59e0b' : '#ef4444';
        const colorExpect = parseFloat(stats.expectancy) > 0 ? '#10b981' : '#ef4444';
        
        html += '<div class="pt-metrics-advanced">';
        html += '<div class="pt-advanced-title">📊 Métricas Avanzadas</div>';
        html += '<div class="pt-advanced-grid">';
        html += '<div class="pt-adv-item"><span class="pt-adv-label">📈 Sharpe</span><span class="pt-adv-value" style="color:' + colorSharpe + ';">' + stats.sharpe + '</span></div>';
        html += '<div class="pt-adv-item"><span class="pt-adv-label">📉 Sortino</span><span class="pt-adv-value" style="color:' + colorSortino + ';">' + stats.sortino + '</span></div>';
        html += '<div class="pt-adv-item"><span class="pt-adv-label">📊 Max DD</span><span class="pt-adv-value" style="color:' + colorDD + ';">-' + stats.maxDrawdown + '%</span></div>';
        html += '<div class="pt-adv-item"><span class="pt-adv-label">💰 Expectancy</span><span class="pt-adv-value" style="color:' + colorExpect + ';">$' + stats.expectancy + '</span></div>';
        html += '<div class="pt-adv-item"><span class="pt-adv-label">🔥 Racha Ganadora</span><span class="pt-adv-value" style="color:#10b981;">' + stats.rachaGanadora + '</span></div>';
        html += '<div class="pt-adv-item"><span class="pt-adv-label">❄️ Racha Perdedora</span><span class="pt-adv-value" style="color:#ef4444;">' + stats.rachaPerdedora + '</span></div>';
        html += '<div class="pt-adv-item"><span class="pt-adv-label">💎 Kelly %</span><span class="pt-adv-value" style="color:#a78bfa;">' + stats.kelly + '%</span></div>';
        html += '<div class="pt-adv-item"><span class="pt-adv-label">📊 Ops Totales</span><span class="pt-adv-value">' + (stats.totalOpsCerradas !== undefined ? stats.totalOpsCerradas : 0) + '</span></div>';
        html += '</div>';
        html += '</div>';
    }
    
    // ═══ FORMULARIO DE OPERACIÓN ═══
    if (precioActual && symbolActual) {
        const cantidadDefault = (c.capitalActual * 0.1).toFixed(2);
        html += '<div class="pt-form">';
        html += '<div class="pt-form-title">🎯 Operar ' + symbolActual + ' @ ' + fmtUSD(precioActual) + '</div>';
        html += '<div class="pt-form-row">';
        html += '<input type="number" id="ptCantidad" class="pt-input" placeholder="USD" value="' + cantidadDefault + '" min="1" step="1">';
        html += '<button class="btn-pt-buy" onclick="window.ptOperar(\'COMPRAR\')">🟢 COMPRAR</button>';
        html += '<button class="btn-pt-sell" onclick="window.ptOperar(\'VENDER\')">🔴 VENDER</button>';
        html += '</div>';
        html += '<div class="pt-form-hint">💡 Usa 1-10% del capital. Disponible: ' + fmtUSD(c.capitalActual) + '</div>';
        html += '</div>';
    } else {
        html += '<div class="pt-form"><div class="pt-form-title">🎯 Analiza una cripto para operar</div><div class="pt-form-hint">Los botones COMPRAR/VENDER aparecerán aquí</div></div>';
    }
    
    // ═══ POSICIONES ABIERTAS ═══
    if (c.posiciones.length > 0) {
        html += '<div class="pt-section">';
        html += '<div class="pt-section-title">📊 Posiciones abiertas (' + c.posiciones.length + ')</div>';
        for (const pos of c.posiciones) {
            const precioMercado = (pos.symbol === symbolActual && precioActual) ? precioActual : (pos.precioMercado || pos.precioEntrada);
            
            // ⭐ Guardar precioMercado en la posición para que persista al recargar
            if (precioActual && pos.symbol === symbolActual) {
                pos.precioMercado = precioActual;
                if (!pos._savedMercado) pos._savedMercado = true;
            }
            
            const pnl = calcularPnL(pos, precioMercado);
            const pnlPct = (pnl / pos.cantidadUSD) * 100;
            const emoji = pos.tipo === 'LONG' ? '🟢' : '🔴';
            
            html += '<div class="pt-pos">';
            html += '<div class="pt-pos-header">';
            html += '<span>' + emoji + ' <strong>' + pos.symbol + '</strong> · ' + pos.tipo + '</span>';
            html += '<span style="color:' + colorPnL(pnl) + ';font-weight:bold;">' + (pnl >= 0 ? '+' : '') + fmtUSD(pnl) + ' (' + fmtPct(pnlPct) + ')</span>';
            html += '</div>';
            html += '<div class="pt-pos-row"><span>Entrada</span><span>' + fmtUSD(pos.precioEntrada) + '</span></div>';
            html += '<div class="pt-pos-row"><span>Mercado</span><span>' + fmtUSD(precioMercado) + '</span></div>';
            html += '<div class="pt-pos-row"><span>Cantidad</span><span>' + pos.cantidad.toFixed(6) + ' (' + fmtUSD(pos.cantidadUSD) + ')</span></div>';
            if (pos.sl) html += '<div class="pt-pos-row"><span>🛑 SL</span><span>' + fmtUSD(pos.sl) + '</span></div>';
            if (pos.tp1) html += '<div class="pt-pos-row"><span>🎯 TP1</span><span>' + fmtUSD(pos.tp1) + '</span></div>';
            html += '<button class="pt-pos-close" onclick="if(confirm(\'¿Cerrar ' + pos.symbol + '?\')){var c=JSON.parse(localStorage.getItem(\'nextmoon_paper_trading_v2\'));var i=c.posiciones.findIndex(function(p){return p.id===\'' + pos.id + '\'});if(i>=0){var p=c.posiciones[i];var precio=' + (isFinite(precioMercado) ? precioMercado : 0) + ';var pnl=(p.tipo===\'LONG\')?(precio-p.precioEntrada)*p.cantidad:(p.precioEntrada-precio)*p.cantidad;c.capitalActual+=p.cantidadUSD+pnl;c.historial.unshift(Object.assign({},p,{precioCierre:precio,fechaCierre:new Date().toISOString(),pnl:pnl,pnlPct:(pnl/p.cantidadUSD)*100}));c.posiciones.splice(i,1);localStorage.setItem(\'nextmoon_paper_trading_v2\',JSON.stringify(c));location.reload();}}" style="width:100%;padding:12px;background:linear-gradient(90deg,#ef4444,#dc2626);color:white;border:none;border-radius:8px;font-weight:bold;font-size:0.75rem;cursor:pointer;">✕ Cerrar posición</button>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // ═══ HISTORIAL ═══
    if (c.historial.length > 0) {
        html += '<div class="pt-section">';
        html += '<div class="pt-section-title">📜 Historial (' + c.historial.length + ')</div>';
        for (const op of c.historial.slice(0, 10)) {
            const emoji = op.pnl > 0 ? '✅' : op.pnl < 0 ? '❌' : '⚪';
            const emojiTipo = op.tipo === 'LONG' ? '🟢' : '🔴';
            html += '<div class="pt-hist-item">';
            html += '<span>' + emoji + ' ' + emojiTipo + '</span>';
            html += '<span style="flex:1;">' + op.symbol + ' · ' + op.cantidad.toFixed(4) + ' @ ' + fmtUSD(op.precioEntrada) + '</span>';
            html += '<span style="color:' + colorPnL(op.pnl) + ';font-weight:bold;">' + (op.pnl >= 0 ? '+' : '') + fmtUSD(op.pnl) + '</span>';
            html += '</div>';
        }
        if (c.historial.length > 10) {
            html += '<div style="text-align:center;font-size:0.65rem;color:#94a3b8;margin-top:6px;">... y ' + (c.historial.length - 10) + ' más</div>';
        }
        html += '</div>';
    }
    
    // ═══ BOTÓN RESET ═══
    html += '<div style="display:flex;justify-content:center;margin-top:12px;">';
    html += '<button class="pt-reset" onclick="window.ptReset()">🔄 Resetear cartera</button>';
    html += '</div>';
    
    container.innerHTML = html;
}

// ─────────────────────────────────────────────
// 🌐 API PÚBLICA (window)
// ─────────────────────────────────────────────
function ptOperar(tipo) {
    const input = document.getElementById('ptCantidad');
    const cantidadUSD = input ? parseFloat(input.value) : 0;
    
    if (!cantidadUSD || cantidadUSD < 1) {
        if (typeof showToast === 'function') showToast('⚠️ Cantidad inválida (mínimo $1)', true);
        return;
    }
    
    const symbol = (typeof currentToken !== 'undefined') ? currentToken : 'BTC';
    const precio = (typeof currentTokenData !== 'undefined' && currentTokenData?.price) ? currentTokenData.price : 0;
    
    if (!precio) {
        if (typeof showToast === 'function') showToast('⚠️ Analiza una cripto primero', true);
        return;
    }
    
    let sl = null, tp1 = null, tp2 = null, tp3 = null;
    if (typeof window._ultimoTrading === 'object' && window._ultimoTrading?.sltp) {
        sl = window._ultimoTrading.sltp.sl;
        tp1 = window._ultimoTrading.sltp.tp1;
        tp2 = window._ultimoTrading.sltp.tp2;
        tp3 = window._ultimoTrading.sltp.tp3;
    }
    
    abrirOperacionVirtual(symbol, tipo, precio, sl, tp1, tp2, tp3, cantidadUSD);
}

function ptCerrar(id) {
    console.log('🔴 ptCerrar:', id);
    const precio = (typeof currentTokenData !== 'undefined' && currentTokenData?.price) ? currentTokenData.price : 0;
    console.log('💰 Precio:', precio);
    
    const resultado = cerrarOperacion(id, precio, 'manual');
    console.log('✅ Resultado:', resultado);
    
    // ⭐ Re-renderizar después de cerrar
    if (resultado) {
        try {
            // ⭐ Forzar re-render con datos frescos
            const c = getPaperTrading();
            // Asegurar que el capital está bien
            if (!isFinite(parseFloat(c.capitalActual))) {
                c.capitalActual = 1000;
                savePaperTrading(c);
            }
            renderizarPaperTrading();
            console.log('✅ Paper Trading re-renderizado con datos frescos');
        } catch(e) {
            console.error('❌ Error re-renderizando:', e);
        }
    }
}

function ptReset() {
    resetPaperTrading();
}

// Exponer en window
if (typeof window !== 'undefined') {
    window.abrirOperacionVirtual = abrirOperacionVirtual;
    window.cerrarOperacion = cerrarOperacion;
    window.getPaperTrading = getPaperTrading;
    window.getEstadisticas = getEstadisticas;
    window.renderizarPaperTrading = renderizarPaperTrading;
    window.ptOperar = ptOperar;
    window.ptCerrar = ptCerrar;
    window.ptReset = ptReset;
    window.resetPaperTrading = resetPaperTrading;
    window.repararCartera = () => {
        const c = getPaperTrading();
        c.capitalActual = 1000;
        c.capitalInicial = 1000;
        c.posiciones = [];
        c.historial = [];
        savePaperTrading(c);
        renderizarPaperTrading();
        console.log('✅ Cartera reparada manualmente');
        if (typeof showToast === 'function') showToast('🔧 Cartera reparada');
    };
    console.log('✅ paper_trading.js v2 (funcional) expuesto en window');
}

// ─────────────────────────────────────────────
// 🔄 AUTO-RE-RENDER cuando cambia el token
// ─────────────────────────────────────────────
let __ultimoTokenPT = null;
setInterval(() => {
    if (typeof currentToken === 'undefined') return;
    
    // Si cambió el token y el widget está visible, re-renderizar
    if (__ultimoTokenPT !== currentToken) {
        __ultimoTokenPT = currentToken;
        const widget = document.getElementById('widgetPaper');
        if (widget && widget.style.display !== 'none') {
            try { renderizarPaperTrading(); } catch(e) { console.warn('Error re-render PT:', e); }
        }
    }
}, 1000); // Cada 1 segundo

// ─────────────────────────────────────────────
// 🎯 HANDLER DEL BOTÓN "PAPER TRADING"
// ─────────────────────────────────────────────
(function initPaperTradingHandler() {
    const setup = () => {
        const btn = document.getElementById('btnPaperTrading');
        const widget = document.getElementById('widgetPaper');
        if (!btn || !widget) return;
        
        btn.onclick = () => {
            if (widget.style.display === 'none' || widget.style.display === '') {
                widget.style.display = 'block';
                renderizarPaperTrading();
                setTimeout(() => widget.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                if (typeof showToast === 'function') showToast('🎮 Trading Virtual activado');
            } else {
                widget.style.display = 'none';
            }
        };
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();

// ═══════════════════════════════════════════════════════════════
// 💰 PROYECCIÓN DE GANANCIAS
// ═══════════════════════════════════════════════════════════════
function calcularProyeccion(inversionUSD = 100) {
    const symbol = (typeof currentToken !== 'undefined') ? currentToken : 'BTC';
    const precio = (typeof currentTokenData !== 'undefined' && currentTokenData?.price) 
        ? currentTokenData.price : 0;
    
    if (!precio || !window._ultimoTrading?.sltp) {
        return null;
    }
    
    const sltp = window._ultimoTrading.sltp;
    const { sl, tp1, tp2, tp3, precioEntrada } = sltp;
    
    // Calcular cantidad
    const cantidad = inversionUSD / precioEntrada;
    
    // Calcular ganancia en cada TP
    const gananciaTP1 = (tp1 - precioEntrada) * cantidad;
    const gananciaTP2 = (tp2 - precioEntrada) * cantidad;
    const gananciaTP3 = (tp3 - precioEntrada) * cantidad;
    
    // Calcular pérdida en SL
    const perdidaSL = (precioEntrada - sl) * cantidad;
    
    return {
        symbol,
        precioEntrada,
        inversion: inversionUSD,
        cantidad,
        sl,
        tp1, tp2, tp3,
        gananciaTP1, gananciaTP2, gananciaTP3,
        perdidaSL,
        gananciaTP1Pct: (gananciaTP1 / inversionUSD) * 100,
        gananciaTP2Pct: (gananciaTP2 / inversionUSD) * 100,
        gananciaTP3Pct: (gananciaTP3 / inversionUSD) * 100,
        perdidaSLPct: (perdidaSL / inversionUSD) * 100
    };
}

function renderizarProyeccion() {
    const container = document.getElementById('proyeccionContent');
    if (!container) return;
    
    const proyeccion = calcularProyeccion(100);
    
    if (!proyeccion) {
        container.innerHTML = '<div class="proyeccion-loading">Analiza una cripto para ver proyección</div>';
        return;
    }
    
    const fmt = (n) => '$' + parseFloat(n).toFixed(2);
    
    let html = '';
    
    // Inversión y cantidad
    html += '<div class="proyeccion-grid">';
    html += '<div class="proyeccion-item"><div class="proyeccion-label">Inversión</div><div class="proyeccion-value">' + fmt(proyeccion.inversion) + '</div></div>';
    html += '<div class="proyeccion-item"><div class="proyeccion-label">Cantidad</div><div class="proyeccion-value">' + proyeccion.cantidad.toFixed(6) + '</div></div>';
    html += '</div>';
    
    // TPs
    html += '<div class="proyeccion-tp"><span class="proyeccion-tp-label">🎯 TP1 (' + fmt(proyeccion.tp1) + ')</span><span class="proyeccion-tp-ganancia">+' + fmt(proyeccion.gananciaTP1) + ' (+' + proyeccion.gananciaTP1Pct.toFixed(1) + '%)</span></div>';
    html += '<div class="proyeccion-tp"><span class="proyeccion-tp-label">🎯 TP2 (' + fmt(proyeccion.tp2) + ')</span><span class="proyeccion-tp-ganancia">+' + fmt(proyeccion.gananciaTP2) + ' (+' + proyeccion.gananciaTP2Pct.toFixed(1) + '%)</span></div>';
    html += '<div class="proyeccion-tp"><span class="proyeccion-tp-label">🎯 TP3 (' + fmt(proyeccion.tp3) + ')</span><span class="proyeccion-tp-ganancia">+' + fmt(proyeccion.gananciaTP3) + ' (+' + proyeccion.gananciaTP3Pct.toFixed(1) + '%)</span></div>';
    
    // Pérdida
    html += '<div class="proyeccion-tp" style="background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);"><span class="proyeccion-tp-label">🛑 Stop Loss (' + fmt(proyeccion.sl) + ')</span><span class="proyeccion-tp-ganancia" style="color:#ef4444;">' + fmt(proyeccion.perdidaSL) + ' (' + proyeccion.perdidaSLPct.toFixed(1) + '%)</span></div>';
    
    // Warning
    html += '<div class="proyeccion-warning">⚠️ Esta es una simulación. El mercado real puede variar. Usa esta información para tomar decisiones informadas.</div>';
    
    container.innerHTML = html;
}

// Exponer en window
if (typeof window !== 'undefined') {
    window.calcularProyeccion = calcularProyeccion;
    window.renderizarProyeccion = renderizarProyeccion;
    console.log('✅ Proyección expuesta en window');
}
