// ═══════════════════════════════════════════════════════════════
// 🌍 i18n · INTERNACIONALIZACIÓN · NextMoon AI
// ═══════════════════════════════════════════════════════════════
// Español (es) · Inglés (en) · Alemán (de)
// ═══════════════════════════════════════════════════════════════

const __I18N_KEY = 'nextmoon_idioma';
const __I18N_DEFAULT = 'es';

const __TRADUCCIONES = {
    // ═══ GENERAL ═══
    es: {
        // Títulos
        app_titulo: '🔮 NextMoon AI',
        // Botones principales
        btn_analizar: '🚀 ANALIZAR',
        btn_reanalizar: '🔄 RE-ANALIZAR TOKEN ACTUAL',
        btn_comprar: '🟢 COMPRAR',
        btn_vender: '🔴 VENDER',
        btn_cerrar: '✕ Cerrar',
        // Widgets
        widget_datos: '🎯 DATOS DEL TOKEN',
        widget_recomendacion: '📈 RECOMENDACIÓN',
        widget_analisis: '📊 Análisis (WASM Rust)',
        widget_confianza: '🎯 Confianza',
        widget_estado: '🔌 Estado del Sistema',
        widget_estructura: '🏗️ Estructura',
        widget_tecnico: '📈 Análisis Técnico',
        widget_trading: '🎯 Sistema de Trading',
        widget_paper: '🎮 Trading Virtual',
        widget_alertas: '🔔 Alertas de Precio',
        widget_grafico: '📈 Gráfico de Precio',
        widget_backtest: '🎯 Backtesting',
        // Métricas
        metrica_volumen: 'Volumen 24h',
        metrica_liquidez: 'Liquidez',
        metrica_cambio: 'Cambio 24h',
        metrica_fuente: 'Fuente',
        metrica_palabras: 'Palabras',
        metrica_unicas: 'Únicas',
        metrica_citas: 'Citas',
        metrica_apis: 'APIs',
        metrica_winrate: 'Win Rate',
        metrica_pf: 'Profit Factor',
        metrica_retorno: 'Retorno',
        metrica_dd: 'Drawdown',
        metrica_sharpe: 'Sharpe',
        metrica_sortino: 'Sortino',
        metrica_expectancy: 'Expectancy',
        metrica_kelly: 'Kelly %',
        // Sistema de trading
        st_entrada: '📍 Entrada',
        st_sl: '🛑 Stop Loss',
        st_tp1: '🎯 TP1',
        st_tp2: '🎯 TP2',
        st_tp3: '🎯 TP3',
        st_capital: 'Capital',
        st_riesgo: 'Riesgo',
        st_posicion: 'Posición',
        st_distancia_sl: 'Distancia SL',
        // Recomendaciones
        rec_comprar: 'COMPRAR',
        rec_no_comprar: 'NO COMPRAR',
        rec_esperar: 'ESPERAR',
        rec_comprar_fuerte: 'COMPRAR FUERTE',
        rec_vender: 'VENDER',
        rec_vender_fuerte: 'VENDER FUERTE',
        // Paper Trading
        pt_titulo: '🎮 Trading Virtual',
        pt_badge: '🦀 Aprende sin arriesgar',
        pt_capital_total: '💰 Capital total',
        pt_disponible: '💵 Disponible',
        pt_rendimiento: '📊 Rendimiento',
        pt_ops: '📈 Ops',
        pt_historial: '📜 Historial',
        pt_posiciones: '📊 Posiciones abiertas',
        pt_operar: '🎯 Operar',
        pt_resetear: '🔄 Resetear cartera',
        // Alertas
        alerta_titulo: '🔔 Alertas de Precio',
        alerta_badge: '🦀 Notificaciones nativas',
        alerta_activas: '📋 Alertas activas',
        alerta_historial: '📜 Historial',
        alerta_arriba: '▲ ARRIBA de',
        alerta_abajo: '▼ ABAJO de',
        alerta_activar: 'Activar notificaciones',
        // Gráfico
        grafico_titulo: '📈 Gráfico de Precio',
        grafico_badge: '🦀 Canvas 2D · 100 velas',
        grafico_cargando: '📈 Cargando datos de',
        // Backtest
        bt_titulo: '🎯 Backtesting',
        bt_no_rentable: '❌ SISTEMA NO RENTABLE',
        bt_operaciones: 'operaciones',
        bt_velas: 'velas',
        // Análisis técnico
        tec_rsi: 'RSI(14)',
        tec_macd: 'MACD',
        tec_adx: 'ADX(14)',
        tec_tendencia: 'Tendencia',
        tec_volatilidad: 'Volatilidad',
        tec_ichimoku: 'Ichimoku',
        tec_estocastico: 'Estocástico',
        tec_cci: 'CCI(20)',
        tec_williams: 'Williams %R',
        tec_mfi: 'MFI(14)',
        // Mensajes
        msg_buscando: 'Buscando datos de',
        msg_analizando: 'Analizando',
        msg_no_encontrado: 'No se encontraron datos para',
        msg_listo: 'Listo para analizar',
        msg_escribe_cripto: 'Escribe cualquier cripto arriba y pulsa ANALIZAR',
        // Idiomas
        lang_es: 'Español',
        lang_en: 'English',
        lang_de: 'Deutsch',
    },
    en: {
        // Títulos
        app_titulo: '🔮 NextMoon AI',
        // Botones
        btn_analizar: '🚀 ANALYZE',
        btn_reanalizar: '🔄 RE-ANALYZE CURRENT TOKEN',
        btn_comprar: '🟢 BUY',
        btn_vender: '🔴 SELL',
        btn_cerrar: '✕ Close',
        // Widgets
        widget_datos: '🎯 TOKEN DATA',
        widget_recomendacion: '📈 RECOMMENDATION',
        widget_analisis: '📊 Analysis (WASM Rust)',
        widget_confianza: '🎯 Confidence',
        widget_estado: '🔌 System Status',
        widget_estructura: '🏗️ Structure',
        widget_tecnico: '📈 Technical Analysis',
        widget_trading: '🎯 Trading System',
        widget_paper: '🎮 Virtual Trading',
        widget_alertas: '🔔 Price Alerts',
        widget_grafico: '📈 Price Chart',
        widget_backtest: '🎯 Backtesting',
        // Métricas
        metrica_volumen: 'Volume 24h',
        metrica_liquidez: 'Liquidity',
        metrica_cambio: 'Change 24h',
        metrica_fuente: 'Source',
        metrica_palabras: 'Words',
        metrica_unicas: 'Unique',
        metrica_citas: 'Quotes',
        metrica_apis: 'APIs',
        metrica_winrate: 'Win Rate',
        metrica_pf: 'Profit Factor',
        metrica_retorno: 'Return',
        metrica_dd: 'Drawdown',
        metrica_sharpe: 'Sharpe',
        metrica_sortino: 'Sortino',
        metrica_expectancy: 'Expectancy',
        metrica_kelly: 'Kelly %',
        // Sistema de trading
        st_entrada: '📍 Entry',
        st_sl: '🛑 Stop Loss',
        st_tp1: '🎯 TP1',
        st_tp2: '🎯 TP2',
        st_tp3: '🎯 TP3',
        st_capital: 'Capital',
        st_riesgo: 'Risk',
        st_posicion: 'Position',
        st_distancia_sl: 'SL Distance',
        // Recomendaciones
        rec_comprar: 'BUY',
        rec_no_comprar: 'DO NOT BUY',
        rec_esperar: 'WAIT',
        rec_comprar_fuerte: 'STRONG BUY',
        rec_vender: 'SELL',
        rec_vender_fuerte: 'STRONG SELL',
        // Paper Trading
        pt_titulo: '🎮 Virtual Trading',
        pt_badge: '🦀 Learn without risk',
        pt_capital_total: '💰 Total capital',
        pt_disponible: '💵 Available',
        pt_rendimiento: '📊 Performance',
        pt_ops: '📈 Ops',
        pt_historial: '📜 History',
        pt_posiciones: '📊 Open positions',
        pt_operar: '🎯 Trade',
        pt_resetear: '🔄 Reset portfolio',
        // Alertas
        alerta_titulo: '🔔 Price Alerts',
        alerta_badge: '🦀 Native notifications',
        alerta_activas: '📋 Active alerts',
        alerta_historial: '📜 History',
        alerta_arriba: '▲ ABOVE',
        alerta_abajo: '▼ BELOW',
        alerta_activar: 'Enable notifications',
        // Gráfico
        grafico_titulo: '📈 Price Chart',
        grafico_badge: '🦀 Canvas 2D · 100 candles',
        grafico_cargando: '📈 Loading data for',
        // Backtest
        bt_titulo: '🎯 Backtesting',
        bt_no_rentable: '❌ NOT PROFITABLE',
        bt_operaciones: 'trades',
        bt_velas: 'candles',
        // Análisis técnico
        tec_rsi: 'RSI(14)',
        tec_macd: 'MACD',
        tec_adx: 'ADX(14)',
        tec_tendencia: 'Trend',
        tec_volatilidad: 'Volatility',
        tec_ichimoku: 'Ichimoku',
        tec_estocastico: 'Stochastic',
        tec_cci: 'CCI(20)',
        tec_williams: 'Williams %R',
        tec_mfi: 'MFI(14)',
        // Mensajes
        msg_buscando: 'Searching data for',
        msg_analizando: 'Analyzing',
        msg_no_encontrado: 'No data found for',
        msg_listo: 'Ready to analyze',
        msg_escribe_cripto: 'Type any crypto above and press ANALYZE',
        // Idiomas
        lang_es: 'Español',
        lang_en: 'English',
        lang_de: 'Deutsch',
    },
    de: {
        // Títulos
        app_titulo: '🔮 NextMoon AI',
        // Botones
        btn_analizar: '🚀 ANALYSIEREN',
        btn_reanalizar: '🔄 TOKEN NEU ANALYSIEREN',
        btn_comprar: '🟢 KAUFEN',
        btn_vender: '🔴 VERKAUFEN',
        btn_cerrar: '✕ Schließen',
        // Widgets
        widget_datos: '🎯 TOKEN-DATEN',
        widget_recomendacion: '📈 EMPFEHLUNG',
        widget_analisis: '📊 Analyse (WASM Rust)',
        widget_confianza: '🎯 Vertrauen',
        widget_estado: '🔌 Systemstatus',
        widget_estructura: '🏗️ Struktur',
        widget_tecnico: '📈 Technische Analyse',
        widget_trading: '🎯 Handelssystem',
        widget_paper: '🎮 Virtueller Handel',
        widget_alertas: '🔔 Preisalarme',
        widget_grafico: '📈 Preischart',
        widget_backtest: '🎯 Backtesting',
        // Métricas
        metrica_volumen: 'Volumen 24h',
        metrica_liquidez: 'Liquidität',
        metrica_cambio: 'Änderung 24h',
        metrica_fuente: 'Quelle',
        metrica_palabras: 'Wörter',
        metrica_unicas: 'Einzigartig',
        metrica_citas: 'Zitate',
        metrica_apis: 'APIs',
        metrica_winrate: 'Gewinnrate',
        metrica_pf: 'Profitfaktor',
        metrica_retorno: 'Rendite',
        metrica_dd: 'Drawdown',
        metrica_sharpe: 'Sharpe',
        metrica_sortino: 'Sortino',
        metrica_expectancy: 'Erwartung',
        metrica_kelly: 'Kelly %',
        // Sistema de trading
        st_entrada: '📍 Einstieg',
        st_sl: '🛑 Stop Loss',
        st_tp1: '🎯 TP1',
        st_tp2: '🎯 TP2',
        st_tp3: '🎯 TP3',
        st_capital: 'Kapital',
        st_riesgo: 'Risiko',
        st_posicion: 'Position',
        st_distancia_sl: 'SL-Abstand',
        // Recomendaciones
        rec_comprar: 'KAUFEN',
        rec_no_comprar: 'NICHT KAUFEN',
        rec_esperar: 'WARTEN',
        rec_comprar_fuerte: 'STARK KAUFEN',
        rec_vender: 'VERKAUFEN',
        rec_vender_fuerte: 'STARK VERKAUFEN',
        // Paper Trading
        pt_titulo: '🎮 Virtueller Handel',
        pt_badge: '🦀 Ohne Risiko lernen',
        pt_capital_total: '💰 Gesamtkapital',
        pt_disponible: '💵 Verfügbar',
        pt_rendimiento: '📊 Performance',
        pt_ops: '📈 Ops',
        pt_historial: '📜 Verlauf',
        pt_posiciones: '📊 Offene Positionen',
        pt_operar: '🎯 Handeln',
        pt_resetear: '🔄 Portfolio zurücksetzen',
        // Alertas
        alerta_titulo: '🔔 Preisalarme',
        alerta_badge: '🦀 Native Benachrichtigungen',
        alerta_activas: '📋 Aktive Alarme',
        alerta_historial: '📜 Verlauf',
        alerta_arriba: '▲ ÜBER',
        alerta_abajo: '▼ UNTER',
        alerta_activar: 'Benachrichtigungen aktivieren',
        // Gráfico
        grafico_titulo: '📈 Preischart',
        grafico_badge: '🦀 Canvas 2D · 100 Kerzen',
        grafico_cargando: '📈 Lade Daten für',
        // Backtest
        bt_titulo: '🎯 Backtesting',
        bt_no_rentable: '❌ NICHT PROFITABEL',
        bt_operaciones: 'Trades',
        bt_velas: 'Kerzen',
        // Análisis técnico
        tec_rsi: 'RSI(14)',
        tec_macd: 'MACD',
        tec_adx: 'ADX(14)',
        tec_tendencia: 'Trend',
        tec_volatilidad: 'Volatilität',
        tec_ichimoku: 'Ichimoku',
        tec_estocastico: 'Stochastik',
        tec_cci: 'CCI(20)',
        tec_williams: 'Williams %R',
        tec_mfi: 'MFI(14)',
        // Mensajes
        msg_buscando: 'Suche Daten für',
        msg_analizando: 'Analysiere',
        msg_no_encontrado: 'Keine Daten gefunden für',
        msg_listo: 'Bereit zur Analyse',
        msg_escribe_cripto: 'Gib eine Krypto oben ein und drücke ANALYSIEREN',
        // Idiomas
        lang_es: 'Español',
        lang_en: 'English',
        lang_de: 'Deutsch',
    }
};

// ─────────────────────────────────────────────
// 🌐 FUNCIONES DE TRADUCCIÓN
// ─────────────────────────────────────────────
function getIdiomaActual() {
    try {
        const saved = localStorage.getItem(__I18N_KEY);
        if (saved && __TRADUCCIONES[saved]) return saved;
        
        // Detectar idioma del navegador
        const navLang = (navigator.language || 'es').substring(0, 2).toLowerCase();
        if (__TRADUCCIONES[navLang]) return navLang;
        
        return __I18N_DEFAULT;
    } catch(e) {
        return __I18N_DEFAULT;
    }
}

function setIdioma(idioma) {
    if (!__TRADUCCIONES[idioma]) return false;
    try {
        localStorage.setItem(__I18N_KEY, idioma);
        return true;
    } catch(e) {
        return false;
    }
}

function t(clave) {
    const idioma = getIdiomaActual();
    const trad = __TRADUCCIONES[idioma] || __TRADUCCIONES[__I18N_DEFAULT];
    return trad[clave] || clave;
}

// ─────────────────────────────────────────────
// 🌐 APLICAR TRADUCCIONES AL DOM
// ─────────────────────────────────────────────
function aplicarIdioma() {
    const idioma = getIdiomaActual();
    
    // Título de la página
    document.title = 'NextMoon AI · ' + idioma.toUpperCase();
    
    // Elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const clave = el.getAttribute('data-i18n');
        const trad = t(clave);
        if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
            el.placeholder = trad;
        } else {
            el.textContent = trad;
        }
    });
    
    // Elementos con data-i18n-html (permite HTML)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const clave = el.getAttribute('data-i18n-html');
        el.innerHTML = t(clave);
    });
    
    // Actualizar selector de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === idioma);
    });
    
    console.log('🌍 Idioma aplicado:', idioma);
}

function cambiarIdioma(idioma) {
    if (setIdioma(idioma)) {
        aplicarIdioma();
        if (typeof showToast === 'function') showToast('🌍 ' + t('lang_' + idioma));
    }
}

// ─────────────────────────────────────────────
// 🌐 API PÚBLICA
// ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.t = t;
    window.getIdiomaActual = getIdiomaActual;
    window.setIdioma = setIdioma;
    window.aplicarIdioma = aplicarIdioma;
    window.cambiarIdioma = cambiarIdioma;
    window.__TRADUCCIONES = __TRADUCCIONES;
    console.log('✅ i18n.js expuesto en window');
}

// Aplicar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarIdioma);
} else {
    setTimeout(aplicarIdioma, 100);
}
