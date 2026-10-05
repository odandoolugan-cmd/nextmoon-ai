// ═══════════════════════════════════════════════════════════════════════
// 📈 ANÁLISIS TÉCNICO WASM v6 (Binance klines + 20 funciones Rust)
// ═══════════════════════════════════════════════════════════════════════

async function fetchKlines(symbol, interval = '1h', limit = 100) {
    const symUpper = symbol.toUpperCase().trim();
    try {
        const url = 'https://api.binance.com/api/v3/klines?symbol=' + symUpper + 'USDT&interval=' + interval + '&limit=' + limit;
        const r = await fetchConTimeout(url, {}, 8000);
        if (!r.ok) return null;
        const data = await r.json();
        if (!Array.isArray(data) || data.length < 30) return null;
        return {
            opens:   data.map(function(k) { return parseFloat(k[1]); }),
            highs:   data.map(function(k) { return parseFloat(k[2]); }),
            lows:    data.map(function(k) { return parseFloat(k[3]); }),
            closes:  data.map(function(k) { return parseFloat(k[4]); }),
            volumes: data.map(function(k) { return parseFloat(k[5]); }),
        };
    } catch(e) {
        console.warn('⚠️ Binance klines error:', e.message);
        return null;
    }
}

async function analizarTecnico(symbol) {
    if (!rustWASM.cargado) return null;
    const k = await fetchKlines(symbol, '1h', 100);
    if (!k) return null;
    const oJson = JSON.stringify(k.opens);
    const hJson = JSON.stringify(k.highs);
    const lJson = JSON.stringify(k.lows);
    const cJson = JSON.stringify(k.closes);
    const vJson = JSON.stringify(k.volumes);
    const wasm = rustWASM.wasm;
    try {
        return {
            rsi:          wasm.calcular_rsi(cJson, 14),
            sma20:        wasm.calcular_sma(cJson, 20),
            ema12:        wasm.calcular_ema(cJson, 12),
            macd:         JSON.parse(wasm.calcular_macd(cJson)),
            bollinger:    JSON.parse(wasm.calcular_bollinger(cJson, 20)),
            volatilidad:  wasm.calcular_volatilidad(cJson),
            tendencia:    wasm.analizar_tendencia(cJson),
            soporte:      JSON.parse(wasm.detectar_soporte_resistencia(cJson)),
            ichimoku:     JSON.parse(wasm.calcular_ichimoku(hJson, lJson, cJson)),
            fibonacci:    JSON.parse(wasm.calcular_fibonacci(hJson, lJson)),
            patrones:     JSON.parse(wasm.detectar_patron_velas(oJson, hJson, lJson, cJson)),
            adx:          wasm.calcular_adx(hJson, lJson, cJson, 14),
            obv:          wasm.calcular_obv(cJson, vJson),
            vwap:         wasm.calcular_vwap(hJson, lJson, cJson, vJson),
            divergencia:  JSON.parse(wasm.detectar_divergencia(cJson)),
            señal_global: JSON.parse(wasm.generar_senal_compra(cJson, hJson, lJson, oJson, cJson, vJson)),
        };
    } catch(e) {
        console.error('❌ Error WASM análisis técnico:', e);
        return null;
    }
}

function renderizarAnalisisTecnico(tec) {
    const widget = document.getElementById('widgetTecnico');
    const content = document.getElementById('tecnicoContent');
    if (!tec) {
        widget.style.display = 'none';
        return;
    }
    widget.style.display = 'block';
    const señal = tec.señal_global;
    const colorSeñal = señal.señal.indexOf('COMPRAR') >= 0 ? '#10b981' : señal.señal.indexOf('VENDER') >= 0 ? '#ef4444' : '#f59e0b';
    const bgSeñal = señal.señal.indexOf('COMPRAR') >= 0 ? 'rgba(16,185,129,0.15)' : señal.señal.indexOf('VENDER') >= 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';
    const colorRSI = tec.rsi < 30 ? '#10b981' : tec.rsi > 70 ? '#ef4444' : '#60a5fa';
    const colorADX = tec.adx > 25 ? '#10b981' : '#94a3b8';
    const colorTend = tec.tendencia.indexOf('alcista') >= 0 ? '#10b981' : tec.tendencia.indexOf('bajista') >= 0 ? '#ef4444' : '#f59e0b';
    const colorMACD = tec.macd.tendencia === 'alcista' ? '#10b981' : '#ef4444';
    const rsiLabel = tec.rsi < 30 ? '🟢 Sobreventa' : tec.rsi > 70 ? '🔴 Sobrecompra' : '⚪ Neutral';
    const flechaMACD = tec.macd.tendencia === 'alcista' ? '📈' : '📉';
    const adxLabel = tec.adx > 25 ? '💪 Fuerte' : '😴 Débil';

    let html = '';
    html += '<div class="tecnico-señal" style="background:' + bgSeñal + ';border-color:' + colorSeñal + ';color:' + colorSeñal + ';">';
    html += señal.señal;
    html += '<div class="tecnico-señal-sub">Score: ' + señal.score + ' · Confianza: ' + señal.confianza_pct + '%</div>';
    html += '</div>';

    html += '<div class="tecnico-grid">';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">RSI(14)</span><span class="tecnico-item-value" style="color:' + colorRSI + ';">' + tec.rsi.toFixed(1) + '</span><span class="tecnico-item-sub">' + rsiLabel + '</span></div>';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">MACD</span><span class="tecnico-item-value" style="color:' + colorMACD + ';">' + flechaMACD + '</span><span class="tecnico-item-sub">' + tec.macd.tendencia + '</span></div>';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">ADX(14)</span><span class="tecnico-item-value" style="color:' + colorADX + ';">' + tec.adx.toFixed(1) + '</span><span class="tecnico-item-sub">' + adxLabel + '</span></div>';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">Tendencia</span><span class="tecnico-item-value" style="color:' + colorTend + ';">' + tec.tendencia.replace(/_/g, ' ') + '</span></div>';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">Volatilidad</span><span class="tecnico-item-value" style="color:#60a5fa;">' + tec.volatilidad.toFixed(2) + '%</span></div>';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">Ichimoku</span><span class="tecnico-item-value" style="color:#a78bfa;font-size:0.7rem;">' + (tec.ichimoku.posicion || 'N/A') + '</span></div>';
    html += '</div>';

    // ═══ NUEVO: Grid 4 columnas con Bollinger, Soporte, Resistencia, Divergencia ═══
    const colorBoll = tec.bollinger.posicion === 'sobreventa' ? '#10b981' : tec.bollinger.posicion === 'sobrecompra' ? '#ef4444' : '#60a5fa';
    const bollLabel = tec.bollinger.posicion === 'sobreventa' ? '🟢 Sobreventa' : tec.bollinger.posicion === 'sobrecompra' ? '🔴 Sobrecompra' : '⚪ Neutral';
    const divColor = tec.divergencia.tipo === 'divergencia_alcista' ? '#10b981' : tec.divergencia.tipo === 'divergencia_bajista' ? '#ef4444' : '#94a3b8';
    const divLabel = tec.divergencia.tipo === 'divergencia_alcista' ? '🟢 Alcista' : tec.divergencia.tipo === 'divergencia_bajista' ? '🔴 Bajista' : '⚪ Sin divergencia';
    const soporteFmt = tec.soporte.soporte > 0 ? '$' + tec.soporte.soporte.toFixed(2) : 'N/A';
    const resistFmt = tec.soporte.resistencia > 0 ? '$' + tec.soporte.resistencia.toFixed(2) : 'N/A';

    html += '<div class="tecnico-grid-4">';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">Bollinger</span><span class="tecnico-item-value" style="color:' + colorBoll + ';font-size:0.75rem;">' + bollLabel + '</span><span class="tecnico-item-sub">S:' + tec.bollinger.superior.toFixed(0) + ' I:' + tec.bollinger.inferior.toFixed(0) + '</span></div>';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">Soporte</span><span class="tecnico-item-value" style="color:#10b981;font-size:0.75rem;">' + soporteFmt + '</span><span class="tecnico-item-sub">' + (tec.soporte.niveles_soporte || 0) + ' niveles</span></div>';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">Resistencia</span><span class="tecnico-item-value" style="color:#ef4444;font-size:0.75rem;">' + resistFmt + '</span><span class="tecnico-item-sub">' + (tec.soporte.niveles_resistencia || 0) + ' niveles</span></div>';
    html += '<div class="tecnico-item"><span class="tecnico-item-label">Divergencia</span><span class="tecnico-item-value" style="color:' + divColor + ';font-size:0.7rem;">' + divLabel + '</span><span class="tecnico-item-sub">Fuerza: ' + (tec.divergencia.fuerza * 100).toFixed(0) + '%</span></div>';
    html += '</div>';

    // ═══ NUEVO: Sección de patrones de velas ═══
    if (tec.patrones && tec.patrones.patrones && tec.patrones.patrones.length > 0) {
        const patronColor = tec.patrones.es_alcista ? '#10b981' : tec.patrones.es_bajista ? '#ef4444' : '#94a3b8';
        html += '<div class="tecnico-patrones" style="border-color:' + patronColor + '40;">';
        html += '<span class="tecnico-patrones-title" style="color:' + patronColor + ';">🕯️ Patrones de velas (' + tec.patrones.total + ')</span>';
        for (let i = 0; i < tec.patrones.patrones.length; i++) {
            const p = tec.patrones.patrones[i];
            const esBajista = p.indexOf('bearish') >= 0 || p === 'shooting_star' || p === 'three_black_crows';
            const clase = esBajista ? 'bajista' : '';
            html += '<span class="tecnico-patron-item ' + clase + '">' + p.replace(/_/g, ' ') + '</span>';
        }
        html += '</div>';
    }

    if (señal.razones && señal.razones.length > 0) {
        html += '<div class="tecnico-razones"><span class="tecnico-razones-title">🎯 Razones (' + señal.razones.length + ')</span>';
        for (let i = 0; i < señal.razones.length; i++) {
            html += '• ' + señal.razones[i] + '<br>';
        }
        html += '</div>';
    }

    content.innerHTML = html;
}
