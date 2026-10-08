// ═══════════════════════════════════════════════════════════════
// 🎮 PAPER TRADING FUNCIONAL · NextMoon AI
// ═══════════════════════════════════════════════════════════════

const __PT_KEY = 'nextmoon_paper_trading_v2';
const __PT_CAPITAL_INICIAL = 1000;
const __PT_RIESGO_DEFECTO = 1;

function getPaperTrading() {
    try {
        const data = localStorage.getItem(__PT_KEY);
        if (data) {
            const cartera = JSON.parse(data);
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
    const totalOpsCerradas = c.historial.length;
    const ganadoras = c.historial.filter(o => o.pnl > 0).length;
    const perdedoras = c.historial.filter(o => o.pnl < 0).length;
    const winRate = totalOpsCerradas > 0 ? (ganadoras / totalOpsCerradas * 100) : 0;
    const pnlTotal = c.historial.reduce((s, o) => s + o.pnl, 0);
    const capitalEnPos = c.posiciones.reduce((s, p) => s + p.cantidadUSD, 0);
    const rendimiento = c.capitalInicial > 0 ? ((c.capitalActual + capitalEnPos - c.capitalInicial) / c.capitalInicial * 100) : 0;
    
    // Profit factor
    const ganancias = c.historial.filter(o => o.pnl > 0).reduce((s, o) => s + o.pnl, 0);
    const perdidas = Math.abs(c.historial.filter(o => o.pnl < 0).reduce((s, o) => s + o.pnl, 0));
    const profitFactor = perdidas > 0 ? (ganancias / perdidas) : (ganancias > 0 ? 999 : 0);
    
    // ⭐ NUEVAS MÉTRICAS AVANZADAS ⭐
    
    // 1. Expectancy (ganancia media por op)
    const expectancy = totalOpsCerradas > 0 ? pnlTotal / totalOpsCerradas : 0;
    
    // 2. Racha ganadora/perdedora máxima
    let rachaGanadora = 0, rachaPerdedora = 0;
    let rachaActualGan = 0, rachaActualPer = 0;
    for (const op of c.historial.slice().reverse()) { // cronológico
        if (op.pnl > 0) {
            rachaActualGan++;
            rachaActualPer = 0;
            if (rachaActualGan > rachaGanadora) rachaGanadora = rachaActualGan;
        } else if (op.pnl < 0) {
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
        const pnls = c.historial.map(o => o.pnl / 100); // normalizado
        const media = pnls.reduce((a, b) => a + b, 0) / pnls.length;
        const varianza = pnls.reduce((s, x) => s + Math.pow(x - media, 2), 0) / pnls.length;
        const desv = Math.sqrt(varianza);
        sharpe = desv > 0 ? (media / desv) * Math.sqrt(252) : 0; // anualizado
    }
    
    // 5. Sortino Ratio (solo volatilidad negativa)
    let sortino = 0;
    if (totalOpsCerradas > 1) {
        const pnls = c.historial.map(o => o.pnl / 100);
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
    
    return {
        capitalInicial: c.capitalInicial,
        capitalActual: c.capitalActual,
        capitalEnPosiciones: capitalEnPos,
        capitalTotal: c.capitalActual + capitalEnPos,
        posicionesAbiertas: c.posiciones.length,
        totalOpsCerradas,
        ganadoras,
        perdedoras,
        winRate: winRate.toFixed(1),
        pnlTotal: pnlTotal.toFixed(2),
        rendimiento: rendimiento.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        mejorOp: c.metricas.mejorOp.toFixed(2),
        peorOp: c.metricas.peorOp.toFixed(2),
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
    
    const c = getPaperTrading();
    const stats = getEstadisticas();
    const fmtUSD = (n) => '$' + parseFloat(n).toFixed(2);
    const fmtPct = (n) => (n >= 0 ? '+' : '') + parseFloat(n).toFixed(2) + '%';
    const colorPnL = (n) => parseFloat(n) > 0 ? '#10b981' : parseFloat(n) < 0 ? '#ef4444' : '#94a3b8';
    
    const precioActual = (typeof currentTokenData !== 'undefined' && currentTokenData?.price) ? currentTokenData.price : null;
    const symbolActual = (typeof currentToken !== 'undefined' && currentToken) ? currentToken : null;
    
    let html = '';
    
    // ═══ MÉTRICAS PRINCIPALES ═══
    html += '<div class="pt-metrics">';
    html += '<div class="pt-metric"><div class="pt-label">💰 Capital total</div><div class="pt-value" style="color:#10b981;">' + fmtUSD(stats.capitalTotal) + '</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">💵 Disponible</div><div class="pt-value">' + fmtUSD(stats.capitalActual) + '</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">📊 Rendimiento</div><div class="pt-value" style="color:' + colorPnL(stats.rendimiento) + ';">' + fmtPct(stats.rendimiento) + '</div></div>';
    html += '</div>';
    
    html += '<div class="pt-metrics">';
    html += '<div class="pt-metric"><div class="pt-label">🎯 Win Rate</div><div class="pt-value">' + stats.winRate + '%</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">📊 Profit Factor</div><div class="pt-value">' + stats.profitFactor + '</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">📈 Ops</div><div class="pt-value">' + stats.totalOpsCerradas + '</div></div>';
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
        html += '<div class="pt-adv-item"><span class="pt-adv-label">📊 Ops Totales</span><span class="pt-adv-value">' + stats.totalOpsCerradas + '</span></div>';
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
            const precioMercado = (pos.symbol === symbolActual && precioActual) ? precioActual : pos.precioEntrada;
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
            html += '<button class="pt-pos-close" onclick="window.ptCerrar(\'' + pos.id + '\')">✕ Cerrar posición</button>';
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
    const precio = (typeof currentTokenData !== 'undefined' && currentTokenData?.price) ? currentTokenData.price : 0;
    cerrarOperacion(id, precio, 'manual');
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
    console.log('✅ paper_trading.js v2 (funcional) expuesto en window');
}

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
