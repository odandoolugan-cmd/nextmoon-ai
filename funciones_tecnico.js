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

    if (señal.razones && señal.razones.length > 0) {
        html += '<div class="tecnico-razones"><span class="tecnico-razones-title">🎯 Razones (' + señal.razones.length + ')</span>';
        for (let i = 0; i < señal.razones.length; i++) {
            html += '• ' + señal.razones[i] + '<br>';
        }
        html += '</div>';
    }

    content.innerHTML = html;
}
