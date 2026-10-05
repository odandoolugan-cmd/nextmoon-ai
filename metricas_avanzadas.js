        // 📊 MÉTRICAS AVANZADAS WASM v6
        // 1. Tiempo de lectura
        const tiempoMin = Math.ceil(stats.palabras / 200);
        document.getElementById('tiempoLectura').textContent = '⏱️ ' + tiempoMin + ' min';

        // 2. Tono/sentimiento
        if (rustWASM.cargado && rustWASM.wasm.sentimiento_espanol) {
            try {
                const sent = JSON.parse(rustWASM.wasm.sentimiento_espanol(analisisLimpio));
                const emoji = sent.sentimiento === 'positivo' ? '😊' : sent.sentimiento === 'negativo' ? '😟' : '😐';
                document.getElementById('sentimientoAnalisis').textContent = '🎯 Tono: ' + emoji + ' ' + sent.sentimiento + ' (' + (sent.score > 0 ? '+' : '') + sent.score + ')';
            } catch(e) { console.warn('Error sentimiento:', e); }
        }

        // 3. Legibilidad Flesch
        if (rustWASM.cargado && rustWASM.wasm.indice_flesch_espanol) {
            try {
                const flesch = rustWASM.wasm.indice_flesch_espanol(analisisLimpio);
                let nivel = '';
                if (flesch > 80) nivel = '🟢 Muy fácil';
                else if (flesch > 60) nivel = '🟢 Fácil';
                else if (flesch > 40) nivel = '🟡 Media';
                else if (flesch > 20) nivel = '🟠 Difícil';
                else nivel = '🔴 Muy difícil';
                document.getElementById('legibilidadScore').textContent = flesch.toFixed(1) + ' (' + nivel + ')';
            } catch(e) { console.warn('Error legibilidad:', e); }
        }
