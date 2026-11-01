// 🧬 Núcleo Setun 1958 - Lógica Ternaria y Analógica
// Inspirado en BitNet (2025) y la computadora soviética Setun

window.SetunCore = {
    // 1. Función Ternaria: Convierte un valor (ej. RSI) a -1, 0 o 1
    ternario: function(valor, umbralBajo = 30, umbralAlto = 70) {
        if (valor <= umbralBajo) return -1; // Sobrevendido (Posible compra)
        if (valor >= umbralAlto) return 1;   // Sobrecomprado (Posible venta)
        return 0;                            // Zona Neutra (El "truco" soviético)
    },

    // 2. Filtro Analógico: Suaviza las señales para evitar ruido (como un condensador)
    filtroAnalogico: function(señalesArray) {
        if (!señalesArray || señalesArray.length === 0) return 0;
        const suma = señalesArray.reduce((acc, val) => acc + val, 0);
        const promedio = suma / señalesArray.length;
        
        // Aplicamos el redondeo ternario al promedio
        if (promedio > 0.33) return 1;
        if (promedio < -0.33) return -1;
        return 0;
    },

    // 3. Inferencia BitNet (Simulación de pesos ternarios)
    inferenciaBitNet: function(datosMercado) {
        // Simulamos una red de 3 capas con pesos de -1, 0, 1
        let capa1 = [];
        
        // Capa 1: Evaluar indicadores
        if (datosMercado.rsi) capa1.push(this.ternario(datosMercado.rsi));
        if (datosMercado.macd) capa1.push(datosMercado.macd === 'alcista' ? 1 : -1);
        if (datosMercado.adx) capa1.push(datosMercado.adx > 25 ? 1 : 0); // 0 si es tendencia débil
        
        // Capa 2: Filtro Analógico
        const resultadoFiltrado = this.filtroAnalogico(capa1);
        
        // Capa 3: Decisión final
        let decision = "MANTENER (0)";
        let color = "#f59e0b"; // Amarillo
        
        if (resultadoFiltrado === 1) {
            decision = "COMPRAR (1)";
            color = "#10b981"; // Verde
        } else if (resultadoFiltrado === -1) {
            decision = "VENDER (-1)";
            color = "#ef4444"; // Rojo
        }

        return {
            valorTernario: resultadoFiltrado,
            decision: decision,
            color: color,
            capa1: capa1 // Para debug
        };
    }
};

console.log("🧬 Setun Core 1958 cargado. Lógica Ternaria activa.");
