// ═══════════════════════════════════════════════════════════════
// 🎯 SISTEMA DE TRADING PROFESIONAL · NextMoon AI
// ═══════════════════════════════════════════════════════════════

function calcularConfluencia(tec) {
    if (!tec || !tec._datos_k) {
        console.warn('[Trading] tec o _datos_k faltan');
        return null;
    }
    const k = tec._datos_k;
    const closes = k.closes || [];
    const volumes = k.volumes || [];
    const n = closes.length;
    if (n < 30) {
        console.warn('[Trading] closes < 30');
        return null;
    }

    const precioActual = closes[n - 1];
    const señales = [];

    // 1. RSI
    const rsi = tec.rsi !== undefined ? tec.rsi : 50;
    if (rsi < 30)      señales.push({ id: 1, nombre: 'RSI sobreventa',       tipo: 'COMPRAR', fuerza: 3, valor: rsi.toFixed(1) });
    else if (rsi > 70) señales.push({ id: 1, nombre: 'RSI sobrecompra',      tipo: 'VENDER',  fuerza: 3, valor: rsi.toFixed(1) });
    else if (rsi < 40) señales.push({ id: 1, nombre: 'RSI bajo',             tipo: 'COMPRAR', fuerza: 1, valor: rsi.toFixed(1) });
    else if (rsi > 60) señales.push({ id: 1, nombre: 'RSI alto',             tipo: 'VENDER',  fuerza: 1, valor: rsi.toFixed(1) });
    else               señales.push({ id: 1, nombre: 'RSI neutral',          tipo: 'NEUTRAL', fuerza: 0, valor: rsi.toFixed(1) });

    // 2. MACD
    const macd = tec.macd || { tendencia: 'neutral', histogram: 0 };
    const hist = macd.histogram !== undefined ? macd.histogram : 0;
    if (macd.tendencia === 'alcista' && hist > 0)      señales.push({ id: 2, nombre: 'MACD cruce alcista',  tipo: 'COMPRAR', fuerza: 2, valor: hist.toFixed(4) });
    else if (macd.tendencia === 'bajista' && hist < 0) señales.push({ id: 2, nombre: 'MACD cruce bajista', tipo: 'VENDER',  fuerza: 2, valor: hist.toFixed(4) });
    else                                                señales.push({ id: 2, nombre: 'MACD neutral',       tipo: 'NEUTRAL', fuerza: 0, valor: hist.toFixed(4) });

    // 3. Bollinger
    const boll = tec.bollinger || { posicion: 'neutral', superior: 0, inferior: 0 };
    if (boll.posicion === 'sobreventa')       señales.push({ id: 3, nombre: 'Bollinger sobreventa',  tipo: 'COMPRAR', fuerza: 2, valor: 'P < I' });
    else if (boll.posicion === 'sobrecompra') señales.push({ id: 3, nombre: 'Bollinger sobrecompra', tipo: 'VENDER',  fuerza: 2, valor: 'P > S' });
    else                                       señales.push({ id: 3, nombre: 'Bollinger neutral',     tipo: 'NEUTRAL', fuerza: 0, valor: 'Dentro de bandas' });

    // 4. Precio vs SMA20
    const sma20 = tec.sma20 !== undefined ? tec.sma20 : precioActual;
    if (precioActual > sma20) señales.push({ id: 4, nombre: 'Precio > SMA20', tipo: 'COMPRAR', fuerza: 1, valor: '$' + precioActual.toFixed(2) });
    else                       señales.push({ id: 4, nombre: 'Precio < SMA20', tipo: 'VENDER',  fuerza: 1, valor: '$' + precioActual.toFixed(2) });

    // 5. Precio vs EMA12
    const ema12 = tec.ema12 !== undefined ? tec.ema12 : precioActual;
    if (precioActual > ema12) señales.push({ id: 5, nombre: 'Precio > EMA12', tipo: 'COMPRAR', fuerza: 1, valor: '$' + precioActual.toFixed(2) });
    else                       señales.push({ id: 5, nombre: 'Precio < EMA12', tipo: 'VENDER',  fuerza: 1, valor: '$' + precioActual.toFixed(2) });

    // 6. Tendencia
    const tend = tec.tendencia || 'lateral';
    if (tend.includes('alcista_fuerte'))     señales.push({ id: 6, nombre: 'Tendencia alcista fuerte',  tipo: 'COMPRAR', fuerza: 3, valor: tend });
    else if (tend.includes('alcista'))       señales.push({ id: 6, nombre: 'Tendencia alcista',         tipo: 'COMPRAR', fuerza: 2, valor: tend });
    else if (tend.includes('bajista_fuerte')) señales.push({ id: 6, nombre: 'Tendencia bajista fuerte', tipo: 'VENDER',  fuerza: 3, valor: tend });
    else if (tend.includes('bajista'))       señales.push({ id: 6, nombre: 'Tendencia bajista',         tipo: 'VENDER',  fuerza: 2, valor: tend });
    else                                      señales.push({ id: 6, nombre: 'Tendencia lateral',         tipo: 'NEUTRAL', fuerza: 0, valor: tend });

    // 7. Divergencia
    const div = tec.divergencia || { tipo: 'sin_divergencia', fuerza: 0 };
    if (div.tipo === 'divergencia_alcista')       señales.push({ id: 7, nombre: 'Divergencia alcista', tipo: 'COMPRAR', fuerza: 3, valor: 'Alcista' });
    else if (div.tipo === 'divergencia_bajista')  señales.push({ id: 7, nombre: 'Divergencia bajista', tipo: 'VENDER',  fuerza: 3, valor: 'Bajista' });
    else                                           señales.push({ id: 7, nombre: 'Sin divergencia',    tipo: 'NEUTRAL', fuerza: 0, valor: 'Sin señal' });

    // 8. Soporte/Resistencia
    const sr = tec.soporte || { soporte: 0, resistencia: 0 };
    const soporteVal = sr.soporte || 0;
    const resistVal = sr.resistencia || 0;
    if (soporteVal > 0 && (precioActual - soporteVal) / soporteVal < 0.02)      señales.push({ id: 8, nombre: 'Cerca de soporte',     tipo: 'COMPRAR', fuerza: 2, valor: '$' + soporteVal.toFixed(2) });
    else if (resistVal > 0 && (resistVal - precioActual) / resistVal < 0.02)    señales.push({ id: 8, nombre: 'Cerca de resistencia', tipo: 'VENDER',  fuerza: 2, valor: '$' + resistVal.toFixed(2) });
    else                                                                          señales.push({ id: 8, nombre: 'S/R lejos',           tipo: 'NEUTRAL', fuerza: 0, valor: 'Sin confluencia' });

    // 9. Patrones
    const pat = tec.patrones || { patrones: [], es_alcista: false, es_bajista: false };
    if (pat.es_alcista)      señales.push({ id: 9, nombre: 'Patrón alcista',    tipo: 'COMPRAR', fuerza: 2, valor: (pat.patrones || []).join(', ') });
    else if (pat.es_bajista) señales.push({ id: 9, nombre: 'Patrón bajista',    tipo: 'VENDER',  fuerza: 2, valor: (pat.patrones || []).join(', ') });
    else                     señales.push({ id: 9, nombre: 'Sin patrón claro',  tipo: 'NEUTRAL', fuerza: 0, valor: 'Sin patrón' });

    // 10. ADX
    const adx = tec.adx !== undefined ? tec.adx : 0;
    const esTend = tend.includes('alcista') || tend.includes('bajista');
    const direccion = tend.includes('alcista') ? 'COMPRAR' : 'VENDER';
    if (adx > 25 && esTend) señales.push({ id: 10, nombre: 'ADX fuerte (' + adx.toFixed(1) + ')', tipo: direccion, fuerza: 2, valor: adx.toFixed(1) });
    else if (adx < 20)      señales.push({ id: 10, nombre: 'ADX débil (' + adx.toFixed(1) + ')',  tipo: 'NEUTRAL', fuerza: 0, valor: adx.toFixed(1) });
    else                    señales.push({ id: 10, nombre: 'ADX moderado (' + adx.toFixed(1) + ')', tipo: esTend ? direccion : 'NEUTRAL', fuerza: 1, valor: adx.toFixed(1) });

    // 11. Volumen
    const volReciente = volumes.length >= 5 ? volumes.slice(-5).reduce((a, b) => a + b, 0) / 5 : 0;
    const volPromedio = volumes.length >= 20 ? volumes.slice(-20).reduce((a, b) => a + b, 0) / 20 : 1;
    if (volReciente > volPromedio * 1.2) señales.push({ id: 11, nombre: 'Volumen creciente', tipo: tend.includes('alcista') ? 'COMPRAR' : 'VENDER', fuerza: 1, valor: Math.round(volReciente / volPromedio * 100) + '%' });
    else                                  señales.push({ id: 11, nombre: 'Volumen normal',    tipo: 'NEUTRAL', fuerza: 0, valor: Math.round(volReciente / volPromedio * 100) + '%' });

    // 12. Volatilidad
    const vol = tec.volatilidad !== undefined ? tec.volatilidad : 0;
    señales.push({ id: 12, nombre: vol > 5 ? 'Volatilidad alta' : vol < 1 ? 'Volatilidad baja' : 'Volatilidad normal', tipo: 'NEUTRAL', fuerza: 0, valor: vol.toFixed(2) + '%' });

    // SCORE
    let scoreCompra = 0, scoreVenta = 0, scoreNeutral = 0;
    for (const s of señales) {
        if (s.tipo === 'COMPRAR') scoreCompra += s.fuerza;
        else if (s.tipo === 'VENDER') scoreVenta += s.fuerza;
        else scoreNeutral += 1;
    }
    const totalFuerza = scoreCompra + scoreVenta;
    const confianza = totalFuerza > 0 ? Math.round(Math.abs(scoreCompra - scoreVenta) / totalFuerza * 100) : 0;

    let decision, decisionColor, decisionEmoji;
    if (scoreCompra >= 12 && confianza >= 60)     { decision = 'COMPRAR FUERTE'; decisionColor = '#10b981'; decisionEmoji = '🟢🟢🟢'; }
    else if (scoreCompra >= 7 && confianza >= 40) { decision = 'COMPRAR';        decisionColor = '#10b981'; decisionEmoji = '🟢🟢'; }
    else if (scoreVenta >= 12 && confianza >= 60) { decision = 'VENDER FUERTE';  decisionColor = '#ef4444'; decisionEmoji = '🔴🔴🔴'; }
    else if (scoreVenta >= 7 && confianza >= 40)  { decision = 'VENDER';         decisionColor = '#ef4444'; decisionEmoji = '🔴🔴'; }
    else                                           { decision = 'ESPERAR';        decisionColor = '#f59e0b'; decisionEmoji = '🟡'; }

    return { señales, scoreCompra, scoreVenta, scoreNeutral, confianza, decision, decisionColor, decisionEmoji, totalSeñales: señales.length };
}

function calcularSLTP(tec, confluencia) {
    if (!tec || !confluencia || !tec._datos_k) return null;
    const closes = tec._datos_k.closes || [];
    const highs = tec._datos_k.highs || [];
    const lows = tec._datos_k.lows || [];
    const n = closes.length;
    if (n < 20) return null;

    const precioEntrada = closes[n - 1];
    let atrSum = 0;
    for (let i = n - 14; i < n; i++) {
        if (i < 0) continue;
        atrSum += (highs[i] - lows[i]);
    }
    const atr = atrSum / 14;

    const esCompra = confluencia.decision.indexOf('COMPRAR') >= 0;
    const esVenta = confluencia.decision.indexOf('VENDER') >= 0;

    // ⭐ Multiplicadores ATR ajustados para R/B ≥ 2.0
    // SL = 1.0 ATR  →  TP1 = 2.0 ATR (R/B 2.0) · TP2 = 3.5 ATR (R/B 3.5) · TP3 = 5.0 ATR (R/B 5.0)
    const ATR_SL  = 1.0;
    const ATR_TP1 = 2.0;
    const ATR_TP2 = 3.5;
    const ATR_TP3 = 5.0;
    
    let sl, tp1, tp2, tp3;
    if (esCompra) {
        sl  = precioEntrada - ATR_SL  * atr;
        tp1 = precioEntrada + ATR_TP1 * atr;
        tp2 = precioEntrada + ATR_TP2 * atr;
        tp3 = precioEntrada + ATR_TP3 * atr;
    } else if (esVenta) {
        sl  = precioEntrada + ATR_SL  * atr;
        tp1 = precioEntrada - ATR_TP1 * atr;
        tp2 = precioEntrada - ATR_TP2 * atr;
        tp3 = precioEntrada - ATR_TP3 * atr;
    } else {
        // ESPERAR: usar setup alcista por defecto (solo informativo)
        sl  = precioEntrada - ATR_SL  * atr;
        tp1 = precioEntrada + ATR_TP1 * atr;
        tp2 = precioEntrada + ATR_TP2 * atr;
        tp3 = precioEntrada + ATR_TP3 * atr;
    }

    const riesgo = Math.abs(precioEntrada - sl);
    return {
        precioEntrada, sl, tp1, tp2, tp3, atr,
        rr1: riesgo > 0 ? (Math.abs(tp1 - precioEntrada) / riesgo).toFixed(2) : '0',
        rr2: riesgo > 0 ? (Math.abs(tp2 - precioEntrada) / riesgo).toFixed(2) : '0',
        rr3: riesgo > 0 ? (Math.abs(tp3 - precioEntrada) / riesgo).toFixed(2) : '0'
    };
}

function calcularPositionSizing(precioEntrada, sl, capitalTotal, riesgoPorcentaje) {
    capitalTotal = capitalTotal || 1000;
    riesgoPorcentaje = riesgoPorcentaje || 1;
    const riesgoPorOperacion = capitalTotal * (riesgoPorcentaje / 100);
    const distanciaSL = Math.abs(precioEntrada - sl);
    if (distanciaSL === 0) return null;
    
    // ⭐ FIX: unidades = riesgo / distanciaSL (NO multiplicar por precioEntrada al final)
    // Antes: tamañoPosicion = (riesgo / distanciaSL) * precioEntrada  ← BUG
    // Ahora: unidades = riesgo / distanciaSL ; valorPosicion = unidades * precioEntrada
    const unidades = riesgoPorOperacion / distanciaSL;
    const valorPosicion = unidades * precioEntrada;
    
    // ⭐ Cap al 100% del capital (no se puede invertir más de lo que tienes)
    const valorPosicionFinal = Math.min(valorPosicion, capitalTotal);
    const porcentajeCapital = (valorPosicionFinal / capitalTotal) * 100;
    
    return {
        capitalTotal,
        riesgoPorcentaje,
        riesgoPorOperacion,
        unidades: unidades.toFixed(6),
        tamañoPosicion: valorPosicionFinal,
        porcentajeCapital: porcentajeCapital.toFixed(2),
        distanciaSL: distanciaSL.toFixed(2)
    };
}

function renderizarTradingSystem(tec) {
    console.log('[Trading] renderizarTradingSystem llamado');
    if (!tec) { console.warn('[Trading] tec null'); return; }
    
    const confluencia = calcularConfluencia(tec);
    if (!confluencia) { console.warn('[Trading] confluencia null'); return; }
    console.log('[Trading] confluencia OK:', confluencia.decision);
    
    const sltp = calcularSLTP(tec, confluencia);
    const sizing = sltp ? calcularPositionSizing(sltp.precioEntrada, sltp.sl, 1000, 1) : null;

    const container = document.getElementById('tradingSystemContent');
    if (!container) { console.warn('[Trading] container NO existe'); return; }
    console.log('[Trading] container OK');

    const fmt = (p) => '$' + p.toFixed(2);
    let html = '';

    // Señal principal
    html += '<div class="trading-decision" style="background:' + confluencia.decisionColor + '20;border:2px solid ' + confluencia.decisionColor + ';color:' + confluencia.decisionColor + ';">';
    html += '<div class="trading-decision-emoji">' + confluencia.decisionEmoji + '</div>';
    html += '<div class="trading-decision-text">' + confluencia.decision + '</div>';
    html += '<div class="trading-decision-sub">Confianza: ' + confluencia.confianza + '% · ' + confluencia.totalSeñales + ' señales</div>';
    html += '</div>';

    // Contadores
    html += '<div class="trading-counters">';
    html += '<div class="counter counter-comprar"><div class="counter-num">' + confluencia.scoreCompra + '</div><div class="counter-label">Score Compra</div></div>';
    html += '<div class="counter counter-vender"><div class="counter-num">' + confluencia.scoreVenta + '</div><div class="counter-label">Score Venta</div></div>';
    html += '<div class="counter counter-neutral"><div class="counter-num">' + confluencia.scoreNeutral + '</div><div class="counter-label">Neutral</div></div>';
    html += '</div>';

    // SL/TP
    if (sltp) {
        html += '<div class="trading-levels">';
        html += '<div class="level level-entrada"><span class="level-label">📍 Entrada</span><span class="level-value">' + fmt(sltp.precioEntrada) + '</span></div>';
        html += '<div class="level level-sl"><span class="level-label">🛑 Stop Loss</span><span class="level-value">' + fmt(sltp.sl) + '</span></div>';
        html += '<div class="level level-tp"><span class="level-label">🎯 TP1</span><span class="level-value">' + fmt(sltp.tp1) + ' <small>R/B ' + sltp.rr1 + '</small></span></div>';
        html += '<div class="level level-tp"><span class="level-label">🎯 TP2</span><span class="level-value">' + fmt(sltp.tp2) + ' <small>R/B ' + sltp.rr2 + '</small></span></div>';
        html += '<div class="level level-tp"><span class="level-label">🎯 TP3</span><span class="level-value">' + fmt(sltp.tp3) + ' <small>R/B ' + sltp.rr3 + '</small></span></div>';
        html += '</div>';
    }

    // Position sizing
    if (sizing) {
        html += '<div class="trading-sizing">';
        html += '<div class="sizing-title">💰 Gestión de capital (ejemplo $1000 · riesgo 1%)</div>';
        html += '<div class="sizing-grid">';
        html += '<div class="sizing-item"><span>Capital</span><strong>$' + sizing.capitalTotal + '</strong></div>';
        html += '<div class="sizing-item"><span>Riesgo</span><strong>$' + sizing.riesgoPorOperacion.toFixed(2) + '</strong></div>';
        html += '<div class="sizing-item"><span>Posición</span><strong>$' + sizing.tamañoPosicion.toFixed(2) + ' (' + sizing.porcentajeCapital + '%)</strong></div>';
        html += '<div class="sizing-item"><span>Distancia SL</span><strong>$' + sizing.distanciaSL + '</strong></div>';
        html += '</div>';
        html += '</div>';
    }

    // Señales
    html += '<div class="trading-señales">';
    html += '<div class="señales-title">📊 Detalle de ' + confluencia.totalSeñales + ' señales</div>';
    for (const s of confluencia.señales) {
        const color = s.tipo === 'COMPRAR' ? '#10b981' : s.tipo === 'VENDER' ? '#ef4444' : '#94a3b8';
        const icon = s.tipo === 'COMPRAR' ? '✅' : s.tipo === 'VENDER' ? '❌' : '⚪';
        html += '<div class="señal-item" style="border-left:3px solid ' + color + ';">';
        html += '<div class="señal-header"><span class="señal-icon">' + icon + '</span><span class="señal-name">' + s.nombre + '</span><span class="señal-fuerza">Fuerza ' + s.fuerza + '</span></div>';
        html += '<div class="señal-valor">' + s.valor + '</div>';
        html += '</div>';
    }
    html += '</div>';

    // ═══ WARNINGS (calidad de la operación) ═══
    const warnings = [];
    if (sltp) {
        if (parseFloat(sltp.rr1) < 2.0) warnings.push('⚠️ R/B del TP1 es ' + sltp.rr1 + ' (recomendado >= 2.0)');
        if (confluencia.confianza < 20) warnings.push('⚠️ Confianza baja: ' + confluencia.confianza + '%');
        if (confluencia.decision === 'ESPERAR') warnings.push('ℹ️ Señal ESPERAR: sin confluencia suficiente');
    }
    if (sizing && parseFloat(sizing.porcentajeCapital) > 20) warnings.push('⚠️ Posición ' + sizing.porcentajeCapital + '% del capital (riesgo alto)');
    
    if (warnings.length > 0) {
        html += '<div class="trading-warnings">';
        html += '<div class="warnings-title">⚡ Advertencias (' + warnings.length + ')</div>';
        for (const w of warnings) {
            html += '<div class="warning-item">' + w + '</div>';
        }
        html += '</div>';
    }

    // Botones virtuales
    if (sltp && (confluencia.decision.indexOf('COMPRAR') >= 0 || confluencia.decision.indexOf('VENDER') >= 0)) {
        const symbolActual = window.currentToken || 'BTC';
        html += '<div class="tecnico-acciones">';
        html += '<button onclick="window.abrirOperacionVirtual(\'' + symbolActual + '\', \'' + confluencia.decision + '\', ' + sltp.precioEntrada + ', ' + sltp.sl + ', ' + sltp.tp1 + ', ' + sltp.tp2 + ', ' + sltp.tp3 + ')" class="btn-virtual-comprar">🎮 ' + confluencia.decision + ' VIRTUAL</button>';
        html += '<button onclick="this.parentElement.style.display=\'none\'" class="btn-virtual-ignorar">❌ Ignorar</button>';
        html += '</div>';
    }

    container.innerHTML = html;
    
    // ⭐ Guardar para integración con Paper Trading
    window._ultimoTrading = { confluencia, sltp, sizing, tec };
    
    // ⭐ MOSTRAR el widget
    const widget = document.getElementById('widgetTrading');
    if (widget) {
        widget.style.display = 'block';
        console.log('[Trading] ✅ Renderizado OK, widget display: block');
    }
}

// Exponer al scope global
if (typeof window !== 'undefined') {
    window.calcularConfluencia = calcularConfluencia;
    window.calcularSLTP = calcularSLTP;
    window.calcularPositionSizing = calcularPositionSizing;
    window.renderizarTradingSystem = renderizarTradingSystem;
    console.log('✅ trading_system.js expuesto en window');
}
