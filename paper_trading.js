

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

// ═══════════════════════════════════════════════════════════════
// 🌐 EXPONER FUNCIONES AL SCOPE GLOBAL
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
