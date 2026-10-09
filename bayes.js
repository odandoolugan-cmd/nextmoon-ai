// ═══════════════════════════════════════════════════════════════
// 🧠 BAYES · Distribuciones Bayesianas + Thompson Sampling
// ═══════════════════════════════════════════════════════════════
// Beta · Normal · Uniforme
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 🎲 UTILIDADES MATEMÁTICAS
// ─────────────────────────────────────────────

// Muestreo de una distribución normal estándar (Box-Muller)
function randNormal() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Muestreo de una distribución gamma (Marsaglia-Tsang)
function randGamma(alpha, beta) {
    if (alpha < 1) {
        // Boost: Gamma(α) = Gamma(α+1) × U^(1/α)
        return randGamma(alpha + 1, beta) * Math.pow(Math.random(), 1 / alpha);
    }
    const d = alpha - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
        let x, v;
        do {
            x = randNormal();
            v = 1 + c * x;
        } while (v <= 0);
        v = v * v * v;
        const u = Math.random();
        if (u < 1 - 0.0331 * x * x * x * x) return d * v / beta;
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v / beta;
    }
}

// ─────────────────────────────────────────────
// 📊 DISTRIBUCIONES
// ─────────────────────────────────────────────

// 1. BETA(α, β) — Para probabilidades (confianza, win rate)
function sampleBeta(alpha, beta) {
    const x = randGamma(alpha, 1);
    const y = randGamma(beta, 1);
    return x / (x + y);
}

// 2. NORMAL(μ, σ) — Para parámetros continuos (SL, TP, ATR)
function sampleNormal(mu, sigma) {
    return mu + sigma * randNormal();
}

// 3. UNIFORME(min, max) — Para parámetros sin sesgo
function sampleUniform(min, max) {
    return min + Math.random() * (max - min);
}

// ─────────────────────────────────────────────
// 🔄 ACTUALIZACIÓN BAYESIANA
// ─────────────────────────────────────────────

// Actualizar Beta con resultado binario
function updateBeta(param, exito) {
    if (exito) {
        param.alpha += 1;
    } else {
        param.beta += 1;
    }
    return param;
}

// Actualizar Normal con resultado (media móvil exponencial)
function updateNormal(param, valor, lr = 0.1) {
    // Mueve la media hacia el valor observado
    param.mu = param.mu * (1 - lr) + valor * lr;
    // Ajusta sigma (más certeza con más datos)
    param.sigma = param.sigma * 0.99;
    return param;
}

// Actualizar Uniforme con resultado (mueve hacia el valor observado)
function updateUniform(param, valor, exito, lr = 0.05) {
    if (exito) {
        // Mueve el rango hacia el valor exitoso
        param.min = param.min * (1 - lr) + valor * lr;
        param.max = param.max * (1 - lr) + valor * lr;
    }
    return param;
}

// ─────────────────────────────────────────────
// 📊 ESTADÍSTICAS DE DISTRIBUCIONES
// ─────────────────────────────────────────────

function meanBeta(p) {
    return p.alpha / (p.alpha + p.beta);
}

function varianceBeta(p) {
    const a = p.alpha, b = p.beta;
    return (a * b) / ((a + b) ** 2 * (a + b + 1));
}

function meanNormal(p) {
    return p.mu;
}

function meanUniform(p) {
    return (p.min + p.max) / 2;
}

// Intervalo de credibilidad (aproximado)
function credibleInterval(param, nivel = 0.95) {
    if (param.tipo === 'beta') {
        const mean = meanBeta(param);
        const std = Math.sqrt(varianceBeta(param));
        const z = 1.96; // 95%
        return {
            lower: Math.max(0, mean - z * std),
            upper: Math.min(1, mean + z * std)
        };
    } else if (param.tipo === 'normal') {
        const z = 1.96;
        return {
            lower: param.mu - z * param.sigma,
            upper: param.mu + z * param.sigma
        };
    } else if (param.tipo === 'uniform') {
        return { lower: param.min, upper: param.max };
    }
}

// ─────────────────────────────────────────────
// 🎯 CLASE: DISTRIBUCIÓN BAYESIANA
// ─────────────────────────────────────────────

class DistribucionBayesiana {
    constructor(nombre, tipo, params) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.params = params;
        this.historial = [];
    }
    
    // Samplear un valor
    sample() {
        if (this.tipo === 'beta') {
            return sampleBeta(this.params.alpha, this.params.beta);
        } else if (this.tipo === 'normal') {
            return sampleNormal(this.params.mu, this.params.sigma);
        } else if (this.tipo === 'uniform') {
            return sampleUniform(this.params.min, this.params.max);
        }
    }
    
    // Actualizar con un resultado
    update(valor, exito) {
        this.historial.push({ valor, exito, ts: Date.now() });
        if (this.historial.length > 100) this.historial.shift();
        
        if (this.tipo === 'beta') {
            this.params = updateBeta(this.params, exito);
        } else if (this.tipo === 'normal') {
            this.params = updateNormal(this.params, valor);
        } else if (this.tipo === 'uniform') {
            this.params = updateUniform(this.params, valor, exito);
        }
    }
    
    // Media actual
    mean() {
        if (this.tipo === 'beta') return meanBeta(this.params);
        if (this.tipo === 'normal') return meanNormal(this.params);
        if (this.tipo === 'uniform') return meanUniform(this.params);
    }
    
    // Intervalo de credibilidad
    ci(nivel = 0.95) {
        return credibleInterval({ tipo: this.tipo, ...this.params }, nivel);
    }
    
    // Serializar
    toJSON() {
        return {
            nombre: this.nombre,
            tipo: this.tipo,
            params: this.params,
            historial: this.historial.slice(-20)
        };
    }
    
    // Deserializar
    static fromJSON(obj) {
        const d = new DistribucionBayesiana(obj.nombre, obj.tipo, obj.params);
        d.historial = obj.historial || [];
        return d;
    }
}

// ─────────────────────────────────────────────
// 🌐 EXPORTAR
// ─────────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.bayes = {
        sampleBeta,
        sampleNormal,
        sampleUniform,
        updateBeta,
        updateNormal,
        updateUniform,
        meanBeta,
        meanNormal,
        meanUniform,
        varianceBeta,
        credibleInterval,
        DistribucionBayesiana
    };
    console.log('✅ bayes.js cargado');
}

// Para uso en Node (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sampleBeta,
        sampleNormal,
        sampleUniform,
        updateBeta,
        updateNormal,
        updateUniform,
        meanBeta,
        meanNormal,
        meanUniform,
        DistribucionBayesiana
    };
}
