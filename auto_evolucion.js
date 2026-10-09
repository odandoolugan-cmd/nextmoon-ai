// ═══════════════════════════════════════════════════════════════
// 🧠 AUTO-EVOLUCIÓN BAYESIANA · Thompson Sampling
// ═══════════════════════════════════════════════════════════════
// El sistema aprende solo. Nunca olvida. Mejora con el tiempo.
// ═══════════════════════════════════════════════════════════════

const __AE_KEY = 'nextmoon_auto_evolucion_v1';
const __AE_INTERVALO = 6 * 60 * 60 * 1000; // 6 horas
const __AE_MEJORA_MINIMA = 0.05; // 5% de mejora para notificar

// ─────────────────────────────────────────────
// 🎯 ESTADO INICIAL (7 parámetros a optimizar)
// ─────────────────────────────────────────────
function estadoInicial() {
    return {
        iteraciones: 0,
        mejorPF: 0,
        mejorConfig: null,
        historial: [],  // últimas 50 iteraciones
        parametros: {
            confianza:   { tipo: 'beta',    alpha: 2, beta: 2,          min: 0,   max: 1,    mejor: 0.15 },
            sl_atr:      { tipo: 'normal',  mu: 1.5, sigma: 0.3,        min: 0.5, max: 3.0,  mejor: 1.5 },
            tp1_atr:     { tipo: 'normal',  mu: 2.5, sigma: 0.5,        min: 1.5, max: 5.0,  mejor: 2.5 },
            tp2_atr:     { tipo: 'normal',  mu: 3.5, sigma: 0.5,        min: 2.5, max: 6.0,  mejor: 3.5 },
            tp3_atr:     { tipo: 'normal',  mu: 5.0, sigma: 0.8,        min: 4.0, max: 8.0,  mejor: 5.0 },
            sma_corta:   { tipo: 'uniform', min: 10, max: 30,           mejor: 20 },
            sma_larga:   { tipo: 'uniform', min: 40, max: 100,          mejor: 50 }
        },
        timestamp: Date.now()
    };
}

// ─────────────────────────────────────────────
// 💾 PERSISTENCIA
// ─────────────────────────────────────────────
function getEstado() {
    try {
        const saved = localStorage.getItem(__AE_KEY);
        if (saved) {
            const estado = JSON.parse(saved);
            // Validar estructura
            if (!estado.parametros) return estadoInicial();
            return estado;
        }
    } catch(e) {
        console.warn('⚠️ Error leyendo auto-evolución:', e);
    }
    return estadoInicial();
}

function guardarEstado(estado) {
    try {
        // Guardar solo últimas 50 iteraciones para no llenar localStorage
        if (estado.historial.length > 50) {
            estado.historial = estado.historial.slice(-50);
        }
        localStorage.setItem(__AE_KEY, JSON.stringify(estado));
        return true;
    } catch(e) {
        console.error('❌ Error guardando auto-evolución:', e);
        return false;
    }
}

// ─────────────────────────────────────────────
// 🎲 SAMPLEAR CONFIGURACIÓN
// ─────────────────────────────────────────────
function samplearConfig(estado) {
    const config = {};
    
    for (const [nombre, param] of Object.entries(estado.parametros)) {
        let valor;
        
        if (param.tipo === 'beta') {
            valor = window.bayes.sampleBeta(param.alpha, param.beta);
        } else if (param.tipo === 'normal') {
            valor = window.bayes.sampleNormal(param.mu, param.sigma);
            // Clamp al rango
            valor = Math.max(param.min, Math.min(param.max, valor));
        } else if (param.tipo === 'uniform') {
            valor = window.bayes.sampleUniform(param.min, param.max);
        }
        
        config[nombre] = valor;
    }
    
    return config;
}

// ─────────────────────────────────────────────
// 📊 EVALUAR CONFIGURACIÓN (backtest simplificado)
// ─────────────────────────────────────────────
async function evaluarConfig(config) {
    try {
        // Usar el backtest existente con parámetros custom
        const symbol = (typeof currentToken !== 'undefined') ? currentToken : 'BTC';
        
        console.log('🧪 Evaluando config:', {
            confianza: config.confianza.toFixed(2),
            sl_atr: config.sl_atr.toFixed(2),
            tp1_atr: config.tp1_atr.toFixed(2)
        });
        
        // Llamar al backtest con los parámetros
        const reporte = await window.ejecutarBacktestConConfig(symbol, 30, config);
        
        return {
            pf: reporte.metricas?.profitFactor || 0,
            sharpe: reporte.metricas?.sharpe || 0,
            dd: reporte.metricas?.drawdownMax || 0,
            retorno: reporte.metricas?.retornoTotal || 0,
            ops: reporte.metricas?.totalOperaciones || 0
        };
    } catch(e) {
        console.warn('⚠️ Error evaluando config:', e);
        return { pf: 0, sharpe: 0, dd: 0, retorno: 0, ops: 0 };
    }
}

// ─────────────────────────────────────────────
// 🔄 ACTUALIZAR CREENCIAS CON RESULTADO
// ─────────────────────────────────────────────
function actualizarCreencias(estado, config, resultado) {
    // El "éxito" se define como PF > 1.2
    const exito = resultado.pf > 1.2;
    
    // Calcular "score" compuesto: PF (60%) + Sharpe (30%) - DD (10%)
    const score = resultado.pf * 0.6 + resultado.sharpe * 0.3 - Math.abs(resultado.dd) * 0.1;
    
    for (const [nombre, param] of Object.entries(estado.parametros)) {
        const valor = config[nombre];
        
        if (param.tipo === 'beta') {
            // Beta: actualizar α/β según éxito
            if (exito) param.alpha += 1;
            else param.beta += 1;
            
        } else if (param.tipo === 'normal') {
            // Normal: media móvil exponencial
            const lr = 0.1; // learning rate
            param.mu = param.mu * (1 - lr) + valor * lr;
            // Reducir sigma (más certeza)
            param.sigma = Math.max(0.05, param.sigma * 0.98);
            
        } else if (param.tipo === 'uniform') {
            // Uniforme: mover rango si fue exitoso
            if (exito) {
                const lr = 0.05;
                param.min = param.min * (1 - lr) + valor * lr;
                param.max = param.max * (1 - lr) + valor * lr;
            }
        }
        
        // Guardar el mejor valor observado
        if (score > (param.mejorScore || 0)) {
            param.mejor = valor;
            param.mejorScore = score;
        }
    }
    
    return { exito, score };
}

// ─────────────────────────────────────────────
// 🚀 EJECUTAR UNA ITERACIÓN
// ─────────────────────────────────────────────
async function ejecutarIteracion() {
    console.log('🧠 [Auto-Evolución] Iniciando iteración...');
    
    const estado = getEstado();
    
    // 1. Samplear config
    const config = samplearConfig(estado);
    
    // 2. Evaluar
    const resultado = await evaluarConfig(config);
    
    // 3. Actualizar creencias
    const { exito, score } = actualizarCreencias(estado, config, resultado);
    
    // 4. Guardar en historial
    estado.historial.push({
        iteracion: estado.iteraciones + 1,
        config,
        resultado,
        score,
        exito,
        ts: Date.now()
    });
    
    // 5. Verificar mejora
    if (resultado.pf > estado.mejorPF * (1 + __AE_MEJORA_MINIMA)) {
        const mejora = ((resultado.pf / estado.mejorPF - 1) * 100).toFixed(1);
        estado.mejorPF = resultado.pf;
        estado.mejorConfig = { ...config };
        
        console.log(`🎉 [Auto-Evolución] ¡Mejora detectada! PF: ${resultado.pf.toFixed(2)} (+${mejora}%)`);
        
        if (typeof showToast === 'function') {
            showToast(`🧠 Auto-evolución: PF mejoró a ${resultado.pf.toFixed(2)} (+${mejora}%)`);
        }
    }
    
    // 6. Actualizar contadores
    estado.iteraciones += 1;
    estado.timestamp = Date.now();
    
    // 7. Guardar
    guardarEstado(estado);
    
    console.log(`✅ [Auto-Evolución] Iteración ${estado.iteraciones} completada · PF: ${resultado.pf.toFixed(2)} · Mejor: ${estado.mejorPF.toFixed(2)}`);
    
    // 8. Actualizar UI si existe
    if (typeof window.renderizarAutoEvolucion === 'function') {
        window.renderizarAutoEvolucion();
    }
    
    // 9. Guardar en Core 403M
    if (typeof core403M !== 'undefined') {
        try {
            core403M.registrarConsulta('auto_evolucion', JSON.stringify({
                iteracion: estado.iteraciones,
                pf: resultado.pf,
                exito
            }));
        } catch(e) {}
    }
    
    return { estado, resultado };
}

// ─────────────────────────────────────────────
// 📊 OBTENER MEJOR CONFIGURACIÓN ACTUAL
// ─────────────────────────────────────────────
function getMejorConfig() {
    const estado = getEstado();
    const config = {};
    
    for (const [nombre, param] of Object.entries(estado.parametros)) {
        // Usar el "mejor" observado (o la media si no hay mejor)
        config[nombre] = param.mejor || window.bayes.meanBeta(param) || param.mu || param.min;
    }
    
    return config;
}

// ─────────────────────────────────────────────
// 📊 ESTADÍSTICAS
// ─────────────────────────────────────────────
function getEstadisticas() {
    const estado = getEstado();
    
    const estadisticas = {
        iteraciones: estado.iteraciones,
        mejorPF: estado.mejorPF,
        mejorConfig: estado.mejorConfig,
        tiempoActivo: Date.now() - (estado.historial[0]?.ts || Date.now()),
        convergencia: {}
    };
    
    // Calcular convergencia de cada parámetro
    for (const [nombre, param] of Object.entries(estado.parametros)) {
        if (param.tipo === 'beta') {
            const media = window.bayes.meanBeta(param);
            const varianza = window.bayes.varianceBeta(param);
            estadisticas.convergencia[nombre] = {
                media,
                varianza,
                // Convergencia = 1 / (1 + varianza)
                convergencia: 1 / (1 + varianza * 100)
            };
        } else if (param.tipo === 'normal') {
            estadisticas.convergencia[nombre] = {
                media: param.mu,
                varianza: param.sigma * param.sigma,
                convergencia: 1 / (1 + param.sigma * 10)
            };
        }
    }
    
    return estadisticas;
}

// ─────────────────────────────────────────────
// 🔄 RESET
// ─────────────────────────────────────────────
function resetAutoEvolucion() {
    if (!confirm('⚠️ ¿Resetear el aprendizaje bayesiano? Se perderá todo lo aprendido.')) return;
    localStorage.removeItem(__AE_KEY);
    console.log('🔄 Auto-evolución reseteada');
    if (typeof showToast === 'function') showToast('🔄 Aprendizaje reseteado');
    if (typeof window.renderizarAutoEvolucion === 'function') {
        window.renderizarAutoEvolucion();
    }
}

// ─────────────────────────────────────────────
// 🎯 SCHEDULER (cada 6h)
// ─────────────────────────────────────────────
let __ae_scheduler = null;

function iniciarScheduler() {
    if (__ae_scheduler) return;
    
    console.log('⏰ [Auto-Evolución] Scheduler iniciado (cada 6h)');
    
    // Primera iteración a los 30 segundos (para no bloquear la carga)
    setTimeout(() => {
        ejecutarIteracion().catch(e => console.warn('Error iteración inicial:', e));
    }, 30000);
    
    // Luego cada 6h
    __ae_scheduler = setInterval(() => {
        ejecutarIteracion().catch(e => console.warn('Error iteración:', e));
    }, __AE_INTERVALO);
}

function detenerScheduler() {
    if (__ae_scheduler) {
        clearInterval(__ae_scheduler);
        __ae_scheduler = null;
        console.log('⏸️ [Auto-Evolución] Scheduler detenido');
    }
}

// ─────────────────────────────────────────────
// 🌐 API PÚBLICA
// ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.autoEvolucion = {
        getEstado,
        getMejorConfig,
        getEstadisticas,
        ejecutarIteracion,
        iniciarScheduler,
        detenerScheduler,
        resetAutoEvolucion,
        // Exponer para debug
        _estadoInicial: estadoInicial
    };
    
    console.log('✅ auto_evolucion.js cargado');
    
    // Auto-iniciar scheduler
    if (typeof window !== 'undefined' && !window.__AE_DISABLED) {
        iniciarScheduler();
    }
}
