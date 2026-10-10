// ═══════════════════════════════════════════════════════════════
// 📈 GRÁFICOS INTERACTIVOS · NextMoon AI
// ═══════════════════════════════════════════════════════════════
// Canvas 2D · Candlestick + Indicadores + Señales
// ═══════════════════════════════════════════════════════════════

let __graficoData = null;
let __graficoInterval = '1h';

// ─────────────────────────────────────────────
// 🗺️ MAPEO DE SÍMBOLOS (nombre largo → símbolo Binance)
// ─────────────────────────────────────────────
const SYMBOL_MAP = {
    'BITCOIN': 'BTC',
    'ETHEREUM': 'ETH',
    'SOLANA': 'SOL',
    'CARDANO': 'ADA',
    'DOGECOIN': 'DOGE',
    'DOGE': 'DOGE',
    'RIPPLE': 'XRP',
    'POLYGON': 'MATIC',
    'CHAINLINK': 'LINK',
    'AVALANCHE': 'AVAX',
    'POLKADOT': 'DOT',
    'SHIBAINU': 'SHIB',
    'SHIB': 'SHIB',
    'PEPECOIN': 'PEPE',
    'PEPE': 'PEPE',
    'LITECOIN': 'LTC',
    'TRON': 'TRX',
    'UNISWAP': 'UNI',
    'COSMOS': 'ATOM',
    'FILECOIN': 'FIL',
    'APTOS': 'APT',
    'ARBITRUM': 'ARB',
    'OPTIMISM': 'OP',
    'NEAR': 'NEAR',
    'STELLAR': 'XLM',
    'VECHAIN': 'VET',
    'ALGORAND': 'ALGO',
    'FANTOM': 'FTM',
    'SAND': 'SAND',
    'MANA': 'MANA',
    'GALA': 'GALA',
    'AXIE': 'AXS',
    'CURVE': 'CRV',
    'AAVE': 'AAVE',
    'MAKER': 'MKR',
    'COMPOUND': 'COMP',
    'SUSHI': 'SUSHI',
    'YEARNFINANCE': 'YFI'
};

function normalizarSymbol(symbol) {
    const upper = symbol.toUpperCase().replace(/\$/g, '').trim();
    return SYMBOL_MAP[upper] || upper;
}

// ─────────────────────────────────────────────
// 📥 OBTENER DATOS (klines)
// ─────────────────────────────────────────────
async function cargarDatosGrafico(symbol, interval = '1h', limit = 100) {
    const symNorm = normalizarSymbol(symbol);
    console.log('📈 Gráfico: symbol original =', symbol, '→ normalizado =', symNorm);
    try {
        const url = 'https://api.binance.com/api/v3/klines?symbol=' + symNorm + 'USDT&interval=' + interval + '&limit=' + limit;
        const r = await fetch(url);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        if (!Array.isArray(data) || data.length < 10) return null;
        
        return data.map(k => ({
            time: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
    } catch(e) {
        console.warn('⚠️ Error cargando datos del gráfico:', e);
        return null;
    }
}

// ─────────────────────────────────────────────
// 🎨 DIBUJAR GRÁFICO
// ─────────────────────────────────────────────
function dibujarGrafico(klines, tec) {
    const canvas = document.getElementById('graficoCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    
    // Limpiar
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, W, H);
    
    if (!klines || klines.length < 10) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos', W/2, H/2);
        return;
    }
    
    // Dimensiones
    const paddingTop = 30;
    const paddingBottom = 80;  // espacio para volumen
    const paddingLeft = 50;
    const paddingRight = 10;
    const chartW = W - paddingLeft - paddingRight;
    const chartH = H - paddingTop - paddingBottom;
    const volH = 60;
    
    // Calcular rango de precios
    const highs = klines.map(k => k.high);
    const lows = klines.map(k => k.low);
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const priceRange = maxPrice - minPrice || 1;
    
    // Volumen máximo
    const maxVol = Math.max(...klines.map(k => k.volume));
    
    // Funciones de escala
    const xScale = (i) => paddingLeft + (i / (klines.length - 1)) * chartW;
    const yScale = (p) => paddingTop + chartH - ((p - minPrice) / priceRange) * chartH;
    
    // ─── GRID ───
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = paddingTop + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(W - paddingRight, y);
        ctx.stroke();
        
        // Etiquetas de precio
        const price = maxPrice - (priceRange / 4) * i;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('$' + price.toFixed(0), paddingLeft - 4, y + 3);
    }
    
    // ─── VELAS JAPONESAS ───
    const velaW = Math.max(1, (chartW / klines.length) * 0.7);
    
    for (let i = 0; i < klines.length; i++) {
        const k = klines[i];
        const x = xScale(i);
        const alcista = k.close >= k.open;
        const color = alcista ? '#10b981' : '#ef4444';
        
        // Mechas (high-low)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yScale(k.high));
        ctx.lineTo(x, yScale(k.low));
        ctx.stroke();
        
        // Cuerpo (open-close)
        ctx.fillStyle = color;
        const yOpen = yScale(k.open);
        const yClose = yScale(k.close);
        const bodyH = Math.max(1, Math.abs(yClose - yOpen));
        ctx.fillRect(x - velaW/2, Math.min(yOpen, yClose), velaW, bodyH);
    }
    
    // ─── SMA20 ───
    if (klines.length >= 20) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 19; i < klines.length; i++) {
            const suma = klines.slice(i - 19, i + 1).reduce((s, k) => s + k.close, 0);
            const sma = suma / 20;
            const x = xScale(i);
            const y = yScale(sma);
            if (i === 19) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // ─── EMA12 ───
    if (klines.length >= 12) {
        const ema = [];
        const k = 2 / (12 + 1);
        ema[0] = klines[0].close;
        for (let i = 1; i < klines.length; i++) {
            ema[i] = klines[i].close * k + ema[i-1] * (1 - k);
        }
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < klines.length; i++) {
            const x = xScale(i);
            const y = yScale(ema[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // ─── BOLLINGER BANDS ───
    if (klines.length >= 20) {
        const superiores = [];
        const inferiores = [];
        for (let i = 19; i < klines.length; i++) {
            const ventana = klines.slice(i - 19, i + 1).map(k => k.close);
            const media = ventana.reduce((a, b) => a + b, 0) / 20;
            const varianza = ventana.reduce((s, x) => s + Math.pow(x - media, 2), 0) / 20;
            const desv = Math.sqrt(varianza);
            superiores.push({ i, valor: media + 2 * desv });
            inferiores.push({ i, valor: media - 2 * desv });
        }
        
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        // Superior
        ctx.beginPath();
        for (const p of superiores) {
            const x = xScale(p.i);
            const y = yScale(p.valor);
            if (p.i === 19) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Inferior
        ctx.beginPath();
        for (const p of inferiores) {
            const x = xScale(p.i);
            const y = yScale(p.valor);
            if (p.i === 19) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    // ─── VOLUMEN ───
    const volTop = paddingTop + chartH + 10;
    const volMaxH = volH - 10;
    for (let i = 0; i < klines.length; i++) {
        const k = klines[i];
        const alcista = k.close >= k.open;
        const color = alcista ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        const x = xScale(i);
        const h = (k.volume / maxVol) * volMaxH;
        ctx.fillStyle = color;
        ctx.fillRect(x - velaW/2, volTop + volMaxH - h, velaW, h);
    }
    
    // ─── SL/TP (del sistema de trading) ───
    if (tec && tec._datos_k && window._ultimoTrading) {
        const sltp = window._ultimoTrading.sltp;
        if (sltp) {
            const niveles = [
                { valor: sltp.sl, color: '#ef4444', label: 'SL' },
                { valor: sltp.tp1, color: '#10b981', label: 'TP1' },
                { valor: sltp.tp2, color: '#10b981', label: 'TP2' },
                { valor: sltp.tp3, color: '#10b981', label: 'TP3' }
            ];
            
            // Solo dibujar si están en el rango visible
            for (const nivel of niveles) {
                if (nivel.valor >= minPrice && nivel.valor <= maxPrice) {
                    ctx.strokeStyle = nivel.color;
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(paddingLeft, yScale(nivel.valor));
                    ctx.lineTo(W - paddingRight, yScale(nivel.valor));
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Label
                    ctx.fillStyle = nivel.color;
                    ctx.font = 'bold 9px monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(nivel.label, paddingLeft + 2, yScale(nivel.valor) - 2);
                }
            }
        }
    }
    
    // ─── PRECIO ACTUAL ───
    const precioActual = klines[klines.length - 1].close;
    if (precioActual >= minPrice && precioActual <= maxPrice) {
        const yActual = yScale(precioActual);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, yActual);
        ctx.lineTo(W - paddingRight, yActual);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Badge del precio actual
        ctx.fillStyle = '#10b981';
        ctx.fillRect(W - paddingRight - 60, yActual - 8, 60, 16);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('$' + precioActual.toFixed(2), W - paddingRight - 30, yActual + 4);
    }
    
    // ─── LEYENDA ───
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('━ SMA20', paddingLeft + 5, paddingTop - 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('━ EMA12', paddingLeft + 70, paddingTop - 10);
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('┅ Bollinger', paddingLeft + 135, paddingTop - 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('┅ SL', paddingLeft + 210, paddingTop - 10);
    ctx.fillStyle = '#10b981';
    ctx.fillText('┅ TP', paddingLeft + 250, paddingTop - 10);
}

// ─────────────────────────────────────────────
// 🎨 RENDERIZAR GRÁFICO (desde el análisis)
// ─────────────────────────────────────────────
async function renderizarGrafico() {
    const container = document.getElementById('graficoContent');
    if (!container) return;
    
    const symbol = (typeof currentToken !== 'undefined') ? currentToken : 'BTC';
    
    container.innerHTML = '<div class="grafico-loading">📈 Cargando datos de ' + symbol + '...</div>';
    
    const klines = await cargarDatosGrafico(symbol, __graficoInterval, 100);
    if (!klines) {
        container.innerHTML = '<div class="grafico-loading">❌ Error cargando datos</div>';
        return;
    }
    
    __graficoData = klines;
    
    const tec = (typeof currentTokenData !== 'undefined' && currentTokenData?._ultimoTec) ? currentTokenData._ultimoTec : null;
    
    container.innerHTML = '<canvas id="graficoCanvas" width="800" height="400" style="width:100%;height:auto;border-radius:8px;"></canvas>';
    
    dibujarGrafico(klines, tec);
}

// ─────────────────────────────────────────────
// 🔄 CAMBIAR TIMEFRAME
// ─────────────────────────────────────────────
function cambiarTimeframe(interval) {
    __graficoInterval = interval;
    
    // Actualizar botones activos
    document.querySelectorAll('.grafico-tf-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tf === interval);
    });
    
    renderizarGrafico();
}

// ─────────────────────────────────────────────
// 🌐 API PÚBLICA
// ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.cargarDatosGrafico = cargarDatosGrafico;
    window.dibujarGrafico = dibujarGrafico;
    window.renderizarGrafico = renderizarGrafico;
    window.cambiarTimeframe = cambiarTimeframe;
    console.log('✅ graficos.js expuesto en window');
}

// ─────────────────────────────────────────────
// 🎯 HANDLER DEL BOTÓN "GRÁFICO"
// ─────────────────────────────────────────────
(function initGraficoHandler() {
    const setup = () => {
        const btn = document.getElementById('btnGrafico');
        const widget = document.getElementById('widgetGrafico');
        if (!btn || !widget) return;
        
        btn.onclick = () => {
            if (widget.style.display === 'none' || widget.style.display === '') {
                widget.style.display = 'block';
                renderizarGrafico();
                setTimeout(() => widget.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                if (typeof showToast === 'function') showToast('📈 Gráfico activado');
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
