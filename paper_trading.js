// ═══════════════════════════════════════════════════════════════
// 🎮 BLOQUE 3: PAPER TRADING · NextMoon AI
// ═══════════════════════════════════════════════════════════════
// Cartera virtual · Aprende a operar sin arriesgar dinero real
// ═══════════════════════════════════════════════════════════════

const __PAPER_TRADING_KEY = 'nextmoon_paper_trading';
const __CAPITAL_INICIAL = 1000;
const __RIESGO_PORCENTAJE = 1; // 1% del capital por operación

// ─────────────────────────────────────────────
// 💾 PERSISTENCIA (localStorage)
// ─────────────────────────────────────────────
function getPaperTrading() {
    try {
        const data = localStorage.getItem(__PAPER_TRADING_KEY);
        if (data) {
            const cartera = JSON.parse(data);
            // Validar estructura
            if (cartera.capitalActual === undefined) cartera.capitalActual = __CAPITAL_INICIAL;
            if (!cartera.operacionesAbiertas) cartera.operacionesAbiertas = [];
            if (!cartera.historial) cartera.historial = [];
            if (!cartera.metricas) cartera.metricas = { totalOps: 0, ganadoras: 0, perdedoras: 0 };
            return cartera;
        }
    } catch(e) {
        console.warn('⚠️ Error leyendo paper trading:', e);
    }
    return {
        capitalInicial: __CAPITAL_INICIAL,
        capitalActual: __CAPITAL_INICIAL,
        operacionesAbiertas: [],
        historial: [],
        metricas: {
            totalOps: 0,
            ganadoras: 0,
            perdedoras: 0,
            mejorOp: 0,
            peorOp: 0
        },
        fechaInicio: new Date().toISOString()
    };
}

function guardarPaperTrading(cartera) {
    try {
        localStorage.setItem(__PAPER_TRADING_KEY, JSON.stringify(cartera));
        console.log('💾 Cartera guardada:', cartera.capitalActual.toFixed(2));
    } catch(e) {
        console.warn('⚠️ Error guardando paper trading:', e);
    }
}

function resetearPaperTrading() {
    if (!confirm('⚠️ ¿Resetear la cartera virtual a $1,000?\n\nSe perderá todo el historial.')) return;
    const nueva = {
        capitalInicial: __CAPITAL_INICIAL,
        capitalActual: __CAPITAL_INICIAL,
        operacionesAbiertas: [],
        historial: [],
        metricas: { totalOps: 0, ganadoras: 0, perdedoras: 0, mejorOp: 0, peorOp: 0 },
        fechaInicio: new Date().toISOString()
    };
    guardarPaperTrading(nueva);
    renderizarPaperTrading();
    if (typeof showToast === 'function') showToast('✅ Cartera reseteada a $1,000');
}

// ─────────────────────────────────────────────
// 🎮 ABRIR OPERACIÓN VIRTUAL
// ─────────────────────────────────────────────
function abrirOperacionVirtual(symbol, tipo, entrada, sl, tp1, tp2, tp3) {
    const cartera = getPaperTrading();
    
    // Verificar que no hay operación abierta del mismo símbolo
    const yaAbierta = cartera.operacionesAbiertas.find(o => o.symbol === symbol && o.estado === 'abierta');
    if (yaAbierta) {
        if (typeof showToast === 'function') showToast(`⚠️ Ya hay una operación abierta en ${symbol}`, true);
        return null;
    }
    
    // Calcular tamaño de posición (1% de riesgo)
    const riesgoUSD = cartera.capitalActual * (__RIESGO_PORCENTAJE / 100);
    const distanciaSL = Math.abs(entrada - sl);
    
    if (distanciaSL === 0) {
        if (typeof showToast === 'function') showToast('❌ SL igual a entrada', true);
        return null;
    }
    
    const tamaño = riesgoUSD / distanciaSL;
    
    if (tamaño <= 0 || !isFinite(tamaño)) {
        if (typeof showToast === 'function') showToast('❌ Tamaño inválido', true);
        return null;
    }
    
    const operacion = {
        id: 'op_' + Date.now(),
        symbol: symbol,
        tipo: tipo,
        entrada: entrada,
        sl: sl,
        tp1: tp1,
        tp2: tp2,
        tp3: tp3,
        tamaño: tamaño,
        riesgoUSD: riesgoUSD,
        fechaApertura: new Date().toISOString(),
        estado: 'abierta',
        ganancia: 0,
        tpsCerrados: []
    };
    
    cartera.operacionesAbiertas.push(operacion);
    guardarPaperTrading(cartera);
    renderizarPaperTrading();
    
    if (typeof showToast === 'function') {
        showToast(`🎮 ${tipo} virtual en ${symbol} a $${entrada.toFixed(2)}`);
    }
    
    return operacion;
}

// ─────────────────────────────────────────────
// 🎮 CERRAR OPERACIÓN VIRTUAL
// ─────────────────────────────────────────────
function cerrarOperacionVirtual(id, precioCierre, razon = 'manual') {
    const cartera = getPaperTrading();
    const idx = cartera.operacionesAbiertas.findIndex(o => o.id === id);
    
    if (idx === -1) {
        if (typeof showToast === 'function') showToast('⚠️ Operación no encontrada', true);
        return;
    }
    
    const op = cartera.operacionesAbiertas[idx];
    
    // Calcular ganancia total
    let ganancia = 0;
    if (op.tipo === 'COMPRAR') {
        ganancia = (precioCierre - op.entrada) * op.tamaño;
    } else {
        ganancia = (op.entrada - precioCierre) * op.tamaño;
    }
    
    // Actualizar capital
    cartera.capitalActual += ganancia;
    
    // Actualizar métricas
    cartera.metricas.totalOps++;
    if (ganancia > 0) {
        cartera.metricas.ganadoras++;
        if (ganancia > cartera.metricas.mejorOp) cartera.metricas.mejorOp = ganancia;
    } else {
        cartera.metricas.perdedoras++;
        if (ganancia < cartera.metricas.peorOp) cartera.metricas.peorOp = ganancia;
    }
    
    // Mover a historial
    op.estado = 'cerrada';
    op.precioCierre = precioCierre;
    op.razon = razon;
    op.ganancia = ganancia;
    op.fechaCierre = new Date().toISOString();
    op.duracion = new Date(op.fechaCierre) - new Date(op.fechaApertura);
    
    cartera.historial.unshift(op);
    cartera.operacionesAbiertas.splice(idx, 1);
    
    // Limitar historial a 100 operaciones
    if (cartera.historial.length > 100) cartera.historial = cartera.historial.slice(0, 100);
    
    guardarPaperTrading(cartera);
    renderizarPaperTrading();
    
    const emoji = ganancia >= 0 ? '✅' : '❌';
    if (typeof showToast === 'function') {
        showToast(`${emoji} ${op.symbol} cerrada: ${ganancia >= 0 ? '+' : ''}$${ganancia.toFixed(2)}`);
    }
    
    return ganancia;
}

// ─────────────────────────────────────────────
// 🔄 ACTUALIZAR OPERACIONES ABIERTAS (SL/TP)
// ─────────────────────────────────────────────
function actualizarOperacionesAbiertas(symbol, precioActual) {
    const cartera = getPaperTrading();
    const ops = cartera.operacionesAbiertas.filter(o => o.symbol === symbol);
    
    for (const op of ops) {
        // Chequear Stop Loss
        if (op.tipo === 'COMPRAR' && precioActual <= op.sl) {
            cerrarOperacionVirtual(op.id, op.sl, 'SL');
            continue;
        }
        if (op.tipo === 'VENDER' && precioActual >= op.sl) {
            cerrarOperacionVirtual(op.id, op.sl, 'SL');
            continue;
        }
        
        // Chequear Take Profits
        if (op.tipo === 'COMPRAR') {
            if (precioActual >= op.tp3 && !op.tpsCerrados.includes('tp3')) {
                cerrarOperacionVirtual(op.id, op.tp3, 'TP3');
                continue;
            }
            if (precioActual >= op.tp2 && !op.tpsCerrados.includes('tp2')) {
                op.tpsCerrados.push('tp2');
            }
            if (precioActual >= op.tp1 && !op.tpsCerrados.includes('tp1')) {
                op.tpsCerrados.push('tp1');
            }
        } else {
            if (precioActual <= op.tp3 && !op.tpsCerrados.includes('tp3')) {
                cerrarOperacionVirtual(op.id, op.tp3, 'TP3');
                continue;
            }
            if (precioActual <= op.tp2 && !op.tpsCerrados.includes('tp2')) {
                op.tpsCerrados.push('tp2');
            }
            if (precioActual <= op.tp1 && !op.tpsCerrados.includes('tp1')) {
                op.tpsCerrados.push('tp1');
            }
        }
    }
    
    guardarPaperTrading(cartera);
    renderizarPaperTrading();
}

// ─────────────────────────────────────────────
// 📊 CALCULAR MÉTRICAS ACTUALES
// ─────────────────────────────────────────────
function calcularMetricasPaperTrading() {
    const cartera = getPaperTrading();
    const totalOps = cartera.metricas.totalOps;
    
    if (totalOps === 0) {
        return {
            rendimiento: 0,
            winRate: 0,
            profitFactor: 0,
            opsAbiertas: cartera.operacionesAbiertas.length,
            totalOps: 0,
            capitalActual: cartera.capitalActual
        };
    }
    
    const rendimiento = ((cartera.capitalActual - cartera.capitalInicial) / cartera.capitalInicial) * 100;
    const winRate = (cartera.metricas.ganadoras / totalOps) * 100;
    
    const gananciaTotal = cartera.historial
        .filter(o => o.ganancia > 0)
        .reduce((s, o) => s + o.ganancia, 0);
    const perdidaTotal = Math.abs(cartera.historial
        .filter(o => o.ganancia <= 0)
        .reduce((s, o) => s + o.ganancia, 0));
    const profitFactor = perdidaTotal > 0 ? gananciaTotal / perdidaTotal : gananciaTotal > 0 ? 999 : 0;
    
    return {
        rendimiento,
        winRate,
        profitFactor,
        opsAbiertas: cartera.operacionesAbiertas.length,
        totalOps,
        capitalActual: cartera.capitalActual,
        ganadoras: cartera.metricas.ganadoras,
        perdedoras: cartera.metricas.perdedoras
    };
}

// ─────────────────────────────────────────────
// 🎨 RENDERIZAR WIDGET
// ─────────────────────────────────────────────
function renderizarPaperTrading() {
    const container = document.getElementById('paperTradingContent');
    if (!container) return;
    
    const cartera = getPaperTrading();
    const metricas = calcularMetricasPaperTrading();
    
    const colorRend = metricas.rendimiento >= 0 ? '#10b981' : '#ef4444';
    const emojiRend = metricas.rendimiento >= 0 ? '📈' : '📉';
    const colorWR = metricas.winRate >= 60 ? '#10b981' : metricas.winRate >= 50 ? '#f59e0b' : '#ef4444';
    const colorPF = metricas.profitFactor >= 1.5 ? '#10b981' : metricas.profitFactor >= 1.2 ? '#f59e0b' : '#ef4444';
    
    let html = '';
    
    // ═══ MÉTRICAS DE CARTERA ═══
    html += '<div class="pt-metrics">';
    html += '<div class="pt-metric"><div class="pt-label">💰 Capital inicial</div><div class="pt-value">$' + cartera.capitalInicial.toFixed(2) + '</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">📊 Capital actual</div><div class="pt-value" style="color:' + colorRend + ';">$' + metricas.capitalActual.toFixed(2) + '</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">' + emojiRend + ' Rendimiento</div><div class="pt-value" style="color:' + colorRend + ';">' + (metricas.rendimiento >= 0 ? '+' : '') + metricas.rendimiento.toFixed(2) + '%</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">🎯 Win Rate</div><div class="pt-value" style="color:' + colorWR + ';">' + metricas.winRate.toFixed(1) + '%</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">📊 Profit Factor</div><div class="pt-value" style="color:' + colorPF + ';">' + (metricas.profitFactor === 999 ? '∞' : metricas.profitFactor.toFixed(2)) + '</div></div>';
    html += '<div class="pt-metric"><div class="pt-label">🔓 Ops abiertas</div><div class="pt-value" style="color:#60a5fa;">' + metricas.opsAbiertas + '</div></div>';
    html += '</div>';
    
    // ═══ OPERACIONES ABIERTAS ═══
    if (cartera.operacionesAbiertas.length > 0) {
        html += '<div class="pt-section"><div class="pt-section-title">🔓 Operaciones abiertas (' + cartera.operacionesAbiertas.length + ')</div>';
        for (const op of cartera.operacionesAbiertas) {
            const color = op.tipo === 'COMPRAR' ? '#10b981' : '#ef4444';
            html += '<div class="pt-op">';
            html += '<div class="pt-op-header"><span style="color:' + color + ';">' + (op.tipo === 'COMPRAR' ? '🟢 COMPRAR' : '🔴 VENDER') + ' ' + op.symbol + '</span>';
            html += '<button onclick="cerrarOperacionVirtual(\'' + op.id + '\', ' + op.entrada + ', \'manual\')" class="pt-op-close">Cerrar</button></div>';
            html += '<div class="pt-op-row"><span>Entrada:</span><strong>$' + op.entrada.toFixed(2) + '</strong></div>';
            html += '<div class="pt-op-row"><span>🛑 SL:</span><strong style="color:#ef4444;">$' + op.sl.toFixed(2) + '</strong></div>';
            html += '<div class="pt-op-row"><span>🎯 TP1:</span><strong style="color:#10b981;">$' + op.tp1.toFixed(2) + '</strong></div>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // ═══ HISTORIAL (últimas 10) ═══
    if (cartera.historial.length > 0) {
        html += '<div class="pt-section"><div class="pt-section-title">📜 Historial (' + cartera.historial.length + ')</div>';
        for (const op of cartera.historial.slice(0, 10)) {
            const color = op.ganancia >= 0 ? '#10b981' : '#ef4444';
            const icon = op.ganancia >= 0 ? '✅' : '❌';
            const fecha = new Date(op.fechaCierre).toLocaleDateString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            html += '<div class="pt-hist-item">';
            html += '<span style="color:' + color + ';">' + icon + '</span>';
            html += '<span style="font-size:0.65rem;color:#94a3b8;">' + fecha + '</span>';
            html += '<span>' + op.tipo + ' ' + op.symbol + '</span>';
            html += '<span style="color:#94a3b8;font-size:0.65rem;">' + op.razon + '</span>';
            html += '<strong style="color:' + color + ';margin-left:auto;">' + (op.ganancia >= 0 ? '+' : '') + '$' + op.ganancia.toFixed(2) + '</strong>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // ═══ BOTÓN RESET ═══
    html += '<div style="text-align:center;margin-top:12px;">';
    html += '<button onclick="resetearPaperTrading()" class="pt-reset">🔄 Resetear cartera</button>';
    html += '</div>';
    
    container.innerHTML = html;
}

// ─────────────────────────────────────────────
// 📚 EDUCACIÓN: CONCEPTOS DE TRADING
// ─────────────────────────────────────────────
const CONCEPTOS_TRADING = {
    stopLoss: {
        titulo: '🛑 ¿Qué es un Stop Loss?',
        contenido: `Un Stop Loss es una orden automática que cierra tu operación si el precio va en tu contra.

📚 EJEMPLO:
• Compras BTC a $85,000
• Pones Stop Loss en $84,500 (-0.59%)
• Si BTC baja a $84,500, la operación se cierra automáticamente
• Pérdida máxima: -$50 (en vez de perder todo)

🎯 POR QUÉ ES IMPORTANTE:
Sin Stop Loss, una operación perdedora puede convertirse en pérdida total.
Con Stop Loss, tu pérdida máxima está controlada.

⚠️ REGLA DE ORO:
NUNCA operes sin Stop Loss. Es tu cinturón de seguridad.`
    },
    riesgoBeneficio: {
        titulo: '📊 ¿Qué es el R/B (Risk/Reward)?',
        contenido: `R/B = Cuánto puedes ganar vs cuánto puedes perder.

📚 EJEMPLO:
• Entrada: $85,000
• Stop Loss: $84,500 → Riesgo: $500
• Take Profit: $86,500 → Beneficio: $1,500
• R/B = 1500 / 500 = 3.0

🎯 INTERPRETACIÓN:
• R/B > 2.0 → ✅ Excelente
• R/B 1.5-2.0 → 🟡 Bueno
• R/B 1.0-1.5 → ⚠️ Justo
• R/B < 1.0 → ❌ No operar

💡 POR QUÉ IMPORTA:
Con R/B 3.0, puedes ganar dinero incluso con solo 30% de aciertos:
• 3 ganadoras × $1,500 = +$4,500
• 7 perdedoras × $500 = -$3,500
• NETO: +$1,000 ✅`
    },
    winRate: {
        titulo: '🎯 ¿Qué es el Win Rate?',
        contenido: `Win Rate = % de operaciones ganadoras.

📚 EJEMPLO:
• 100 operaciones
• 62 ganadoras
• 38 perdedoras
• Win Rate = 62%

🎯 INTERPRETACIÓN:
• >60% → ✅ Excelente
• 50-60% → 🟡 Bueno
• 40-50% → ⚠️ Necesita buen R/B
• <40% → ❌ Mal sistema

💡 LO MÁS IMPORTANTE:
Un win rate bajo puede ser rentable SI el R/B es alto.

EJEMPLO:
• 40% win rate + R/B 3.0 → RENTABLE ✅
• 70% win rate + R/B 0.5 → PÉRDIDA ❌

No te obsesiones con el win rate. Mira el conjunto.`
    },
    drawdown: {
        titulo: '📉 ¿Qué es el Drawdown?',
        contenido: `Drawdown = La peor caída desde un máximo.

📚 EJEMPLO:
• Capital: $1,000
• Sube a $1,500 (+50%)
• Baja a $1,200 (-20% desde máximo)
• Drawdown máximo: -20%

🎯 INTERPRETACIÓN:
• <15% → ✅ Muy bueno
• 15-25% → 🟡 Normal
• 25-40% → ⚠️ Riesgoso
• >40% → ❌ Muy riesgoso

💡 POR QUÉ IMPORTA:
Un drawdown alto significa que puedes perder mucho en poco tiempo.
Psicológicamente, es muy duro seguir operando con -40%.

REGLA PRÁCTICA:
Nunca arriesgues más de 1-2% por operación para mantener drawdown bajo.`
    },
    positionSizing: {
        titulo: '💰 ¿Cómo elegir el tamaño de posición?',
        contenido: `El tamaño de posición determina cuánto arriesgas por operación.

📚 FÓRMULA:
Tamaño = (Capital × %Riesgo) / Distancia al SL

EJEMPLO:
• Capital: $1,000
• Riesgo por operación: 1% = $10
• Distancia SL: $500 (de $85,000 a $84,500)
• Tamaño = $10 / $500 = 0.02 BTC

🎯 RESULTADO:
• Si BTC sube $1,000 → ganancia $20 (+2%)
• Si BTC baja $500 → pérdida $10 (-1%)

💡 REGLA DE ORO:
• Riesgo por operación: 1-2% máximo
• Nunca más de 5% en una sola operación
• Esto protege tu capital a largo plazo

CON 1% DE RIESGO:
Incluso 10 operaciones perdedoras seguidas = -10% capital
Puedes recuperarte.`
    }
};

function mostrarConceptoTrading(conceptoKey) {
    const concepto = CONCEPTOS_TRADING[conceptoKey];
    if (!concepto) return;
    
    // Eliminar modal anterior
    const anterior = document.getElementById('conceptoModal');
    if (anterior) anterior.remove();
    
    const modal = document.createElement('div');
    modal.id = 'conceptoModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto;';
    modal.innerHTML = `
        <div style="background:#0f172a;border-radius:1.5rem;max-width:600px;width:100%;padding:1.5rem;border:2px solid #a78bfa;max-height:85vh;overflow-y:auto;">
            <h3 style="color:#a78bfa;margin-bottom:1rem;">${concepto.titulo}</h3>
            <div style="white-space:pre-wrap;font-size:0.8rem;line-height:1.7;color:#eef2ff;">${concepto.contenido}</div>
            <button onclick="document.getElementById('conceptoModal').remove()" style="margin-top:1rem;background:#8b5cf6;border:none;padding:0.5rem 1rem;border-radius:2rem;color:white;cursor:pointer;font-weight:bold;">Entendido ✓</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════════════
// 🌐 EXPONER FUNCIONES AL SCOPE GLOBAL (para el handler del módulo)
// ═══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
    window.getPaperTrading = getPaperTrading;
    window.guardarPaperTrading = guardarPaperTrading;
    window.resetearPaperTrading = resetearPaperTrading;
    window.abrirOperacionVirtual = abrirOperacionVirtual;
    window.cerrarOperacionVirtual = cerrarOperacionVirtual;
    window.actualizarOperacionesAbiertas = actualizarOperacionesAbiertas;
    window.calcularMetricasPaperTrading = calcularMetricasPaperTrading;
    window.renderizarPaperTrading = renderizarPaperTrading;
    window.mostrarConceptoTrading = mostrarConceptoTrading;
    console.log('✅ Paper Trading expuesto en window');
}

// ═══════════════════════════════════════════════════════════════
// 🎯 HANDLER DEL BOTÓN "PAPER TRADING"
// ═══════════════════════════════════════════════════════════════
(function initPaperTradingHandler() {
    const setup = () => {
        const btn = document.getElementById('btnPaperTrading');
        const widget = document.getElementById('widgetPaper');
        console.log('🎮 init:', { btn: !!btn, widget: !!widget });
        if (!btn || !widget) return;
        btn.onclick = () => {
            console.log('🎮 Click!');
            if (widget.style.display === 'none' || widget.style.display === '') {
                widget.style.display = 'block';
                if (typeof renderizarPaperTrading === 'function') {
                    try { renderizarPaperTrading(); console.log('✅ render OK'); }
                    catch(e) { console.error('❌ Error:', e); }
                }
                setTimeout(() => widget.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            } else {
                widget.style.display = 'none';
            }
        };
        console.log('✅ Handler registrado');
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
