// ═══════════════════════════════════════════════════════════════
// 🔔 ALERTAS DE PRECIO · NextMoon AI
// ═══════════════════════════════════════════════════════════════
// Alertas por encima/abajo del precio · Notificaciones nativas
// ═══════════════════════════════════════════════════════════════

const __ALERTAS_KEY = 'nextmoon_alertas_v1';

// ─────────────────────────────────────────────
// 💾 PERSISTENCIA
// ─────────────────────────────────────────────
function getAlertas() {
    try {
        const data = localStorage.getItem(__ALERTAS_KEY);
        return data ? JSON.parse(data) : { activas: [], historial: [] };
    } catch(e) {
        console.warn('⚠️ Error leyendo alertas:', e);
        return { activas: [], historial: [] };
    }
}

function saveAlertas(data) {
    try {
        localStorage.setItem(__ALERTAS_KEY, JSON.stringify(data));
        return true;
    } catch(e) {
        console.error('❌ Error guardando alertas:', e);
        return false;
    }
}

// ─────────────────────────────────────────────
// 🔔 CREAR / ELIMINAR
// ─────────────────────────────────────────────
function crearAlerta(symbol, precioObjetivo, direccion) {
    if (!symbol || !precioObjetivo) {
        if (typeof showToast === 'function') showToast('⚠️ Datos incompletos', true);
        return null;
    }
    
    const data = getAlertas();
    const precioActual = (typeof currentTokenData !== 'undefined' && currentTokenData?.price) || 0;
    
    // Validar dirección
    if (direccion === 'arriba' && precioObjetivo <= precioActual) {
        if (typeof showToast === 'function') showToast('⚠️ El precio objetivo debe ser mayor al actual (' + precioActual.toFixed(2) + ')', true);
        return null;
    }
    if (direccion === 'abajo' && precioObjetivo >= precioActual) {
        if (typeof showToast === 'function') showToast('⚠️ El precio objetivo debe ser menor al actual (' + precioActual.toFixed(2) + ')', true);
        return null;
    }
    
    const alerta = {
        id: 'al_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        symbol: symbol.toUpperCase(),
        precioObjetivo: parseFloat(precioObjetivo),
        precioAlCrear: precioActual,
        direccion: direccion,
        fechaCreacion: new Date().toISOString(),
        estado: 'activa'
    };
    
    data.activas.push(alerta);
    saveAlertas(data);
    
    if (typeof showToast === 'function') {
        const flecha = direccion === 'arriba' ? '▲' : '▼';
        showToast('🔔 Alerta creada: ' + alerta.symbol + ' ' + flecha + ' $' + alerta.precioObjetivo.toLocaleString());
    }
    
    renderizarAlertas();
    return alerta;
}

function eliminarAlerta(id) {
    const data = getAlertas();
    const idx = data.activas.findIndex(a => a.id === id);
    if (idx === -1) return null;
    
    const eliminada = data.activas[idx];
    data.activas.splice(idx, 1);
    saveAlertas(data);
    
    if (typeof showToast === 'function') showToast('🗑️ Alerta eliminada');
    renderizarAlertas();
    return eliminada;
}

function limpiarHistorial() {
    if (!confirm('⚠️ ¿Borrar todo el historial de alertas disparadas?')) return;
    const data = getAlertas();
    data.historial = [];
    saveAlertas(data);
    renderizarAlertas();
    if (typeof showToast === 'function') showToast('🗑️ Historial limpiado');
}

// ─────────────────────────────────────────────
// 🎯 VERIFICAR ALERTAS (se llama al actualizar precio)
// ─────────────────────────────────────────────
function verificarAlertas(symbol, precioActual) {
    if (!symbol || !precioActual) return;
    
    const data = getAlertas();
    const alertasSymbol = data.activas.filter(a => a.symbol === symbol.toUpperCase());
    if (alertasSymbol.length === 0) return;
    
    const disparadas = [];
    
    for (const alerta of alertasSymbol) {
        const cumple = alerta.direccion === 'arriba' 
            ? precioActual >= alerta.precioObjetivo
            : precioActual <= alerta.precioObjetivo;
        
        if (cumple) {
            // Disparar alerta
            disparadas.push(alerta);
            
            // Notificación nativa
            mostrarNotificacion(
                '🔔 Alerta ' + alerta.symbol,
                alerta.direccion === 'arriba' 
                    ? '¡Precio superó $' + alerta.precioObjetivo.toLocaleString() + '! Actual: $' + precioActual.toFixed(2)
                    : '¡Precio bajó a $' + alerta.precioObjetivo.toLocaleString() + '! Actual: $' + precioActual.toFixed(2)
            );
            
            // Toast
            if (typeof showToast === 'function') {
                const flecha = alerta.direccion === 'arriba' ? '▲' : '▼';
                showToast('🔔 ' + alerta.symbol + ' ' + flecha + ' $' + alerta.precioObjetivo.toLocaleString() + ' (actual: $' + precioActual.toFixed(2) + ')');
            }
        }
    }
    
    // Mover disparadas al historial
    if (disparadas.length > 0) {
        for (const d of disparadas) {
            d.estado = 'disparada';
            d.fechaDisparo = new Date().toISOString();
            d.precioAlDisparar = precioActual;
            data.historial.unshift(d);
            
            const idx = data.activas.findIndex(a => a.id === d.id);
            if (idx > -1) data.activas.splice(idx, 1);
        }
        if (data.historial.length > 50) data.historial = data.historial.slice(0, 50);
        saveAlertas(data);
        renderizarAlertas();
    }
}

// ─────────────────────────────────────────────
// 🔔 NOTIFICACIÓN NATIVA
// ─────────────────────────────────────────────
function mostrarNotificacion(titulo, cuerpo) {
    try {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(titulo, {
                body: cuerpo,
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                tag: 'nextmoon-alerta'
            });
        }
    } catch(e) {
        console.warn('⚠️ Error notificación:', e);
    }
}

async function pedirPermisoNotificaciones() {
    if (!('Notification' in window)) {
        if (typeof showToast === 'function') showToast('⚠️ Tu navegador no soporta notificaciones', true);
        return false;
    }
    
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
        if (typeof showToast === 'function') showToast('⚠️ Notificaciones bloqueadas. Actívalas en configuración', true);
        return false;
    }
    
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') {
        if (typeof showToast === 'function') showToast('✅ Notificaciones activadas');
        return true;
    }
    return false;
}

// ─────────────────────────────────────────────
// 🎨 RENDERIZADO
// ─────────────────────────────────────────────
function renderizarAlertas() {
    const container = document.getElementById('alertasContent');
    if (!container) return;
    
    const data = getAlertas();
    const precioActual = (typeof currentTokenData !== 'undefined' && currentTokenData?.price) || 0;
    const symbolActual = (typeof currentToken !== 'undefined' && currentToken) || 'BTC';
    
    const fmt = (n) => '$' + parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const tiempo = (iso) => {
        const diff = (Date.now() - new Date(iso).getTime()) / 1000;
        if (diff < 60) return 'hace ' + Math.floor(diff) + 's';
        if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + 'm';
        if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + 'h';
        return 'hace ' + Math.floor(diff / 86400) + 'd';
    };
    
    let html = '';
    
    // ═══ CREAR ALERTA ═══
    if (precioActual > 0) {
        const sugerenciaArriba = (precioActual * 1.05).toFixed(0);
        const sugerenciaAbajo = (precioActual * 0.95).toFixed(0);
        html += '<div class="alerta-form">';
        html += '<div class="alerta-form-title">🔔 Nueva alerta para ' + symbolActual + ' · Precio actual: ' + fmt(precioActual) + '</div>';
        html += '<div class="alerta-form-row">';
        html += '<input type="number" id="alertaPrecio" class="alerta-input" placeholder="Precio objetivo" value="' + sugerenciaArriba + '" step="0.01">';
        html += '</div>';
        html += '<div class="alerta-form-row">';
        html += '<button class="btn-alerta-arriba" onclick="window.ptCrearAlerta(\'arriba\')">▲ ARRIBA de</button>';
        html += '<button class="btn-alerta-abajo" onclick="window.ptCrearAlerta(\'abajo\')">▼ ABAJO de</button>';
        html += '</div>';
        html += '<div class="alerta-form-hint">💡 Te notificaremos cuando el precio cruce tu objetivo</div>';
        html += '</div>';
    } else {
        html += '<div class="alerta-form"><div class="alerta-form-title">🔔 Analiza una cripto para crear alertas</div></div>';
    }
    
    // ═══ PERMISO NOTIFICACIONES ═══
    if ('Notification' in window && Notification.permission !== 'granted') {
        html += '<div class="alerta-permiso">';
        html += '<span>🔔 Activa notificaciones para recibir avisos</span>';
        html += '<button class="btn-permiso" onclick="window.ptPedirPermiso()">Activar</button>';
        html += '</div>';
    }
    
    // ═══ ALERTAS ACTIVAS ═══
    if (data.activas.length > 0) {
        html += '<div class="alerta-section">';
        html += '<div class="alerta-section-title">📋 Alertas activas (' + data.activas.length + ')</div>';
        for (const a of data.activas) {
            const flecha = a.direccion === 'arriba' ? '▲' : '▼';
            const color = a.direccion === 'arriba' ? '#10b981' : '#ef4444';
            const distancia = precioActual > 0 && a.symbol === symbolActual 
                ? ((a.precioObjetivo - precioActual) / precioActual * 100).toFixed(2)
                : null;
            html += '<div class="alerta-item" style="border-left:3px solid ' + color + ';">';
            html += '<div class="alerta-item-header">';
            html += '<span style="color:' + color + ';font-weight:bold;">🔔 ' + a.symbol + ' ' + flecha + ' ' + fmt(a.precioObjetivo) + '</span>';
            if (distancia !== null) {
                html += '<span style="color:#94a3b8;font-size:0.65rem;">' + (parseFloat(distancia) > 0 ? '+' : '') + distancia + '%</span>';
            }
            html += '</div>';
            html += '<div class="alerta-item-sub">Creada ' + tiempo(a.fechaCreacion) + ' · Desde ' + fmt(a.precioAlCrear) + '</div>';
            html += '<button class="btn-alerta-eliminar" onclick="window.ptEliminarAlerta(\'' + a.id + '\')">✕ Eliminar</button>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // ═══ HISTORIAL ═══
    if (data.historial.length > 0) {
        html += '<div class="alerta-section">';
        html += '<div class="alerta-section-title">';
        html += '<span>📜 Historial (' + data.historial.length + ')</span>';
        html += '<button class="btn-alerta-limpiar" onclick="window.ptLimpiarHistorial()">🗑️ Limpiar</button>';
        html += '</div>';
        for (const h of data.historial.slice(0, 10)) {
            const flecha = h.direccion === 'arriba' ? '▲' : '▼';
            const color = h.direccion === 'arriba' ? '#10b981' : '#ef4444';
            html += '<div class="alerta-hist-item">';
            html += '<span style="color:' + color + ';font-weight:bold;">✅ ' + h.symbol + ' ' + flecha + ' ' + fmt(h.precioObjetivo) + '</span>';
            html += '<span style="color:#94a3b8;font-size:0.65rem;">' + tiempo(h.fechaDisparo) + ' · Precio: ' + fmt(h.precioAlDisparar) + '</span>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // ═══ VACÍO ═══
    if (data.activas.length === 0 && data.historial.length === 0 && precioActual === 0) {
        html += '<div class="alerta-vacio">';
        html += '<div style="font-size:2rem;">🔔</div>';
        html += '<div>Analiza una cripto para empezar a crear alertas</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// ─────────────────────────────────────────────
// 🌐 API PÚBLICA (window)
// ─────────────────────────────────────────────
function ptCrearAlerta(direccion) {
    const input = document.getElementById('alertaPrecio');
    const precio = input ? parseFloat(input.value) : 0;
    const symbol = (typeof currentToken !== 'undefined') ? currentToken : 'BTC';
    
    if (!precio || precio <= 0) {
        if (typeof showToast === 'function') showToast('⚠️ Precio inválido', true);
        return;
    }
    
    crearAlerta(symbol, precio, direccion);
}

function ptEliminarAlerta(id) {
    eliminarAlerta(id);
}

function ptLimpiarHistorial() {
    limpiarHistorial();
}

function ptPedirPermiso() {
    pedirPermisoNotificaciones().then(() => renderizarAlertas());
}

// Exponer en window
if (typeof window !== 'undefined') {
    window.crearAlerta = crearAlerta;
    window.eliminarAlerta = eliminarAlerta;
    window.verificarAlertas = verificarAlertas;
    window.renderizarAlertas = renderizarAlertas;
    window.ptCrearAlerta = ptCrearAlerta;
    window.ptEliminarAlerta = ptEliminarAlerta;
    window.ptLimpiarHistorial = ptLimpiarHistorial;
    window.ptPedirPermiso = ptPedirPermiso;
    console.log('✅ alertas.js expuesto en window');
}

// ─────────────────────────────────────────────
// 🎯 HANDLER DEL BOTÓN "ALERTAS"
// ─────────────────────────────────────────────
(function initAlertasHandler() {
    const setup = () => {
        const btn = document.getElementById('btnAlertas');
        const widget = document.getElementById('widgetAlertas');
        if (!btn || !widget) return;
        
        btn.onclick = () => {
            if (widget.style.display === 'none' || widget.style.display === '') {
                widget.style.display = 'block';
                renderizarAlertas();
                setTimeout(() => widget.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                if (typeof showToast === 'function') showToast('🔔 Alertas activadas');
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
