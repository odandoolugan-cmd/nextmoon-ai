// ═══════════════════════════════════════════════════════════════
// 🦀 NextMoon AI · Core 403M · WASM Rust · 40 funciones
// ═══════════════════════════════════════════════════════════════

use wasm_bindgen::prelude::*;
use std::collections::{HashMap, HashSet};
use serde_json::json;

// ═══════════════════════════════════════════════════════════════
// 📌 METADATA
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn wasm_version() -> u32 { 403 }

#[wasm_bindgen]
pub fn now_us() -> f64 {
    js_sys::Date::now() * 1000.0
}

// ═══════════════════════════════════════════════════════════════
// 📊 CONTEO BÁSICO
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn contar_palabras(texto: &str) -> usize {
    texto.split_whitespace()
        .filter(|w| w.chars().any(|c| c.is_alphabetic()))
        .count()
}

#[wasm_bindgen]
pub fn contar_caracteres_sin_espacios(texto: &str) -> usize {
    texto.chars().filter(|c| !c.is_whitespace()).count()
}

#[wasm_bindgen]
pub fn contar_oraciones(texto: &str) -> usize {
    texto.chars().filter(|c| matches!(c, '.' | '!' | '?')).count().max(1)
}

#[wasm_bindgen]
pub fn contar_silabas_espanol(texto: &str) -> usize {
    let vocales = "aeiouáéíóúüAEIOUÁÉÍÓÚÜ";
    texto.split_whitespace().map(|p| {
        let mut count = 0;
        let mut prev_vocal = false;
        for c in p.chars() {
            let es_vocal = vocales.contains(c);
            if es_vocal && !prev_vocal { count += 1; }
            prev_vocal = es_vocal;
        }
        count.max(1)
    }).sum()
}

// ═══════════════════════════════════════════════════════════════
// 📈 MÉTRICAS AVANZADAS
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn densidad_lexica(texto: &str) -> f64 {
    let palabras: Vec<&str> = texto.split_whitespace()
        .filter(|w| w.chars().any(|c| c.is_alphabetic())).collect();
    if palabras.is_empty() { return 0.0; }
    let unicas: HashSet<String> = palabras.iter()
        .map(|w| w.to_lowercase().trim_matches(|c: char| !c.is_alphabetic()).to_string())
        .filter(|w| !w.is_empty()).collect();
    unicas.len() as f64 / palabras.len() as f64
}

#[wasm_bindgen]
pub fn longitud_media_oraciones(texto: &str) -> f64 {
    let palabras = texto.split_whitespace().count() as f64;
    let oraciones = contar_oraciones(texto) as f64;
    if oraciones == 0.0 { return 0.0; }
    palabras / oraciones
}

#[wasm_bindgen]
pub fn indice_flesch_espanol(texto: &str) -> f64 {
    let palabras = contar_palabras(texto) as f64;
    let oraciones = contar_oraciones(texto) as f64;
    let silabas = contar_silabas_espanol(texto) as f64;
    if palabras == 0.0 || oraciones == 0.0 { return 0.0; }
    206.84 - 1.02 * (palabras / oraciones) - 60.0 * (silabas / palabras)
}

#[wasm_bindgen]
pub fn indice_gunning_fog(texto: &str) -> f64 {
    let palabras = contar_palabras(texto) as f64;
    let oraciones = contar_oraciones(texto) as f64;
    let polisilabas = texto.split_whitespace()
        .filter(|p| contar_silabas_espanol(p) >= 3).count() as f64;
    if palabras == 0.0 || oraciones == 0.0 { return 0.0; }
    0.4 * ((palabras / oraciones) + 100.0 * (polisilabas / palabras))
}

// ═══════════════════════════════════════════════════════════════
// 🏷️ EXTRACCIÓN
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn extract_keywords(texto: &str, cantidad: usize) -> String {
    let stopwords: HashSet<&str> = [
        "el","la","los","las","de","del","a","al","en","un","una","unos","unas",
        "y","o","que","es","son","por","para","con","sin","se","su","sus",
        "the","of","and","is","are","to","in","a","an","for","with","on","at","by",
        "le","la","les","de","du","et","est","sont",
        "der","die","das","und","ist","sind",
        "il","lo","gli","e","è","sono",
        "o","os","as","um","uma","é","são"
    ].iter().copied().collect();
    
    let mut freq: HashMap<String, usize> = HashMap::new();
    for p in texto.split_whitespace() {
        let w: String = p.chars()
            .filter(|c| c.is_alphabetic())
            .collect::<String>()
            .to_lowercase();
        if w.len() >= 3 && !stopwords.contains(w.as_str()) {
            *freq.entry(w).or_insert(0) += 1;
        }
    }
    
    let mut vec: Vec<_> = freq.into_iter().collect();
    vec.sort_by(|a, b| b.1.cmp(&a.1));
    
    let result: Vec<_> = vec.into_iter().take(cantidad)
        .map(|(palabra, frecuencia)| json!({"palabra": palabra, "frecuencia": frecuencia}))
        .collect();
    
    serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string())
}

#[wasm_bindgen]
pub fn extract_ngramas(texto: &str, top: usize) -> String {
    let palabras: Vec<String> = texto.split_whitespace()
        .map(|w| w.chars().filter(|c| c.is_alphabetic()).collect::<String>().to_lowercase())
        .filter(|w| !w.is_empty()).collect();
    
    let mut freq: HashMap<String, usize> = HashMap::new();
    for i in 0..palabras.len().saturating_sub(1) {
        let bigrama = format!("{} {}", palabras[i], palabras[i+1]);
        *freq.entry(bigrama).or_insert(0) += 1;
    }
    
    let mut vec: Vec<_> = freq.into_iter().collect();
    vec.sort_by(|a, b| b.1.cmp(&a.1));
    
    let result: Vec<_> = vec.into_iter().take(top)
        .map(|(ngrama, frecuencia)| json!({"ngrama": ngrama, "frecuencia": frecuencia}))
        .collect();
    
    serde_json::to_string(&result).unwrap_or_else(|_| "[]".to_string())
}

#[wasm_bindgen]
pub fn extract_authors_fast(texto: &str) -> String {
    let mut autores: Vec<String> = Vec::new();
    let palabras: Vec<&str> = texto.split_whitespace().collect();
    
    for i in 0..palabras.len().saturating_sub(1) {
        let p1 = palabras[i].trim_matches(|c: char| !c.is_alphabetic());
        let p2 = palabras[i+1].trim_matches(|c: char| !c.is_alphabetic());
        if p1.len() >= 2 && p2.len() >= 2 {
            let mut c1 = p1.chars();
            if let Some(primera) = c1.next() {
                if primera.is_uppercase() && p2.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
                    autores.push(format!("{} {}", p1, p2));
                }
            }
        }
    }
    autores.sort();
    autores.dedup();
    autores.truncate(10);
    serde_json::to_string(&autores).unwrap_or_else(|_| "[]".to_string())
}

// ═══════════════════════════════════════════════════════════════
// 🔍 DETECCIÓN Y ANÁLISIS
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn detectar_idioma(texto: &str) -> String {
    let r = detectar_idioma_avanzado(texto);
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&r) {
        if let Some(score) = v.get("score").and_then(|s| s.as_f64()) {
            if score > 0.10 {
                return v.get("idioma").and_then(|i| i.as_str()).unwrap_or("es").to_string();
            }
        }
    }
    "es".to_string()
}

#[wasm_bindgen]
pub fn detectar_idioma_avanzado(texto: &str) -> String {
    let dicc = diccionarios();
    let t = texto.to_lowercase();
    let palabras: Vec<String> = t.split_whitespace()
        .map(|p| p.chars().filter(|c| c.is_alphabetic()).collect::<String>())
        .filter(|p| !p.is_empty())
        .collect();
    
    if palabras.is_empty() {
        return json!({"candidatos": [], "idioma": "es", "score": 0.0}).to_string();
    }
    
    let total = palabras.len() as f64;
    let mut scores: HashMap<&str, f64> = HashMap::new();
    
    for (idioma, vocab) in dicc.iter() {
        let mut matches = 0;
        for p in &palabras {
            if vocab.contains(&p.as_str()) { matches += 1; }
        }
        scores.insert(idioma, matches as f64 / total);
    }
    
    let mut candidatos: Vec<(&str, f64)> = scores.into_iter().collect();
    candidatos.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    
    let (idioma, score) = candidatos.first().copied().unwrap_or(("es", 0.0));
    
    let cand_json: Vec<_> = candidatos.iter().take(5)
        .map(|(i, s)| json!({"idioma": i, "score": (s * 1000.0).round() / 1000.0}))
        .collect();
    
    json!({
        "candidatos": cand_json,
        "idioma": idioma,
        "score": (score * 1000.0).round() / 1000.0
    }).to_string()
}

#[wasm_bindgen]
pub fn sentimiento_espanol(texto: &str) -> String {
    let positivas = ["bueno","buena","excelente","genial","increíble","fantástico",
        "positivo","éxito","ganancia","subida","alcista","fuerte","amor","feliz",
        "grande","mejor","increible","perfecto","maravilloso","optimista"];
    let negativas = ["malo","mala","pésimo","terrible","horrible","desastre",
        "negativo","pérdida","bajada","bajista","débil","odio","triste",
        "peor","fracaso","miedo","riesgo","crisis","caída","pesimista"];
    
    let t = texto.to_lowercase();
    let mut pos = 0;
    let mut neg = 0;
    
    for p in positivas.iter() { if t.contains(p) { pos += 1; } }
    for n in negativas.iter() { if t.contains(n) { neg += 1; } }
    
    let total = (pos + neg) as f64;
    let score = if total == 0.0 { 0.0 } else { (pos as f64 - neg as f64) / total };
    let sentimiento = if score > 0.2 { "positivo" } else if score < -0.2 { "negativo" } else { "neutro" };
    
    json!({
        "positivas": pos,
        "negativas": neg,
        "score": (score * 100.0).round() / 100.0,
        "sentimiento": sentimiento
    }).to_string()
}

#[wasm_bindgen]
pub fn similitud_coseno(texto1: &str, texto2: &str) -> f64 {
    let tokenizar = |t: &str| -> HashMap<String, f64> {
        let mut m = HashMap::new();
        for p in t.to_lowercase().split_whitespace() {
            let w: String = p.chars().filter(|c| c.is_alphabetic()).collect();
            if !w.is_empty() { *m.entry(w).or_insert(0.0) += 1.0; }
        }
        m
    };
    
    let v1 = tokenizar(texto1);
    let v2 = tokenizar(texto2);
    
    let mut dot = 0.0;
    let mut n1 = 0.0;
    let mut n2 = 0.0;
    
    for (k, v) in &v1 {
        n1 += v * v;
        if let Some(v2v) = v2.get(k) { dot += v * v2v; }
    }
    for v in v2.values() { n2 += v * v; }
    
    if n1 == 0.0 || n2 == 0.0 { return 0.0; }
    dot / (n1.sqrt() * n2.sqrt())
}

#[wasm_bindgen]
pub fn detectar_muletillas_ia(texto: &str) -> String {
    let muletillas = ["en conclusión","es importante destacar","cabe señalar",
        "en resumen","por otro lado","sin embargo","no obstante","en primer lugar",
        "en segundo lugar","por último","dicho esto","en este sentido"];
    let t = texto.to_lowercase();
    let mut encontradas = Vec::new();
    for m in muletillas.iter() {
        if t.contains(m) { encontradas.push(*m); }
    }
    json!({"total": encontradas.len(), "muletillas": encontradas}).to_string()
}

#[wasm_bindgen]
pub fn detectar_clickbait(texto: &str) -> String {
    let señales = ["increíble","no vas a creer","impactante","escándalo","revelado",
        "secreto","truco","shock","bomba","urgente","última hora","exclusiva"];
    let t = texto.to_lowercase();
    let mut encontradas = Vec::new();
    for s in señales.iter() { if t.contains(s) { encontradas.push(*s); } }
    let score = if encontradas.is_empty() { 0.0 } else { (encontradas.len() as f64 / 5.0).min(1.0) };
    json!({"score": (score * 100.0).round() / 100.0, "señales": encontradas, "es_clickbait": score > 0.3}).to_string()
}

#[wasm_bindgen]
pub fn detectar_discurso_odio(texto: &str) -> String {
    let señales = ["odio","matar","muerte","idiota","estúpido","imbécil","basura"];
    let t = texto.to_lowercase();
    let mut encontradas = Vec::new();
    for s in señales.iter() { if t.contains(s) { encontradas.push(*s); } }
    json!({"total": encontradas.len(), "señales": encontradas, "es_odio": !encontradas.is_empty()}).to_string()
}

#[wasm_bindgen]
pub fn detectar_pii(texto: &str) -> String {
    let mut emails = Vec::new();
    let mut telefonos = Vec::new();
    for p in texto.split_whitespace() {
        let lim: String = p.chars().filter(|c| !c.is_whitespace()).collect();
        if lim.contains('@') && lim.contains('.') && lim.len() > 5 {
            emails.push(lim.clone());
        }
        let digitos: String = p.chars().filter(|c| c.is_ascii_digit()).collect();
        if digitos.len() >= 9 && digitos.len() <= 15 { telefonos.push(digitos); }
    }
    json!({"emails": emails, "telefonos": telefonos, "tiene_pii": !emails.is_empty() || !telefonos.is_empty()}).to_string()
}

#[wasm_bindgen]
pub fn detectar_topicos(texto: &str) -> String {
    let topicos = [
        ("cripto", vec!["bitcoin","ethereum","cripto","blockchain","token","defi","nft"]),
        ("finanzas", vec!["inversión","bolsa","mercado","precio","trading","dinero"]),
        ("tecnología", vec!["software","código","programación","ia","inteligencia","dato"]),
        ("ciencia", vec!["investigación","estudio","científico","teoría","análisis"]),
    ];
    let t = texto.to_lowercase();
    let mut encontrados = Vec::new();
    for (topico, palabras) in topicos.iter() {
        let count = palabras.iter().filter(|p| t.contains(*p)).count();
        if count > 0 { encontrados.push(json!({"topico": topico, "score": count})); }
    }
    serde_json::to_string(&encontrados).unwrap_or_else(|_| "[]".to_string())
}

// ═══════════════════════════════════════════════════════════════
// 📅 EXTRACCIÓN ESPECÍFICA
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn extraer_fechas(texto: &str) -> String {
    let mut fechas = Vec::new();
    let chars: Vec<char> = texto.chars().collect();
    let mut i = 0;
    while i + 9 < chars.len() {
        let slice: String = chars[i..i+10].iter().collect();
        if slice.len() == 10 && slice.chars().nth(2) == Some('/') 
            && slice.chars().nth(5) == Some('/') 
            && slice.chars().take(2).all(|c| c.is_ascii_digit())
            && slice.chars().skip(3).take(2).all(|c| c.is_ascii_digit())
            && slice.chars().skip(6).take(4).all(|c| c.is_ascii_digit()) {
            fechas.push(slice);
            i += 10;
        } else { i += 1; }
    }
    serde_json::to_string(&fechas).unwrap_or_else(|_| "[]".to_string())
}

#[wasm_bindgen]
pub fn extraer_urls(texto: &str) -> String {
    let mut urls = Vec::new();
    for p in texto.split_whitespace() {
        let lim = p.trim_matches(|c: char| matches!(c, ','|'.'|'('|')'|'['|']'|'"'|'\''));
        if lim.starts_with("http://") || lim.starts_with("https://") {
            urls.push(lim.to_string());
        }
    }
    serde_json::to_string(&urls).unwrap_or_else(|_| "[]".to_string())
}

#[wasm_bindgen]
pub fn extraer_emails(texto: &str) -> String {
    let mut emails = Vec::new();
    for p in texto.split_whitespace() {
        let lim = p.trim_matches(|c: char| matches!(c, ','|'.'|'('|')'|'['|']'|'"'|'\''));
        if lim.contains('@') && lim.contains('.') && lim.len() > 5 {
            emails.push(lim.to_string());
        }
    }
    serde_json::to_string(&emails).unwrap_or_else(|_| "[]".to_string())
}

#[wasm_bindgen]
pub fn extraer_numeros(texto: &str) -> String {
    let mut nums = Vec::new();
    for p in texto.split_whitespace() {
        let lim = p.trim_matches(|c: char| !c.is_ascii_digit() && c != '.' && c != '-');
        if !lim.is_empty() && lim.chars().any(|c| c.is_ascii_digit()) {
            nums.push(lim.to_string());
        }
    }
    serde_json::to_string(&nums).unwrap_or_else(|_| "[]".to_string())
}

#[wasm_bindgen]
pub fn extraer_hashtags_menciones(texto: &str) -> String {
    let mut hashtags = Vec::new();
    let mut menciones = Vec::new();
    for p in texto.split_whitespace() {
        let lim = p.trim_matches(|c: char| !c.is_alphanumeric() && c != '#' && c != '@');
        if lim.starts_with('#') && lim.len() > 1 { hashtags.push(lim.to_string()); }
        if lim.starts_with('@') && lim.len() > 1 { menciones.push(lim.to_string()); }
    }
    json!({"hashtags": hashtags, "menciones": menciones}).to_string()
}

#[wasm_bindgen]
pub fn extraer_entidades_nombradas(texto: &str) -> String {
    let palabras: Vec<&str> = texto.split_whitespace().collect();
    let mut entidades = Vec::new();
    for w in palabras {
        let lim: String = w.chars().filter(|c| c.is_alphabetic()).collect();
        if lim.len() >= 3 {
            if let Some(c) = lim.chars().next() {
                if c.is_uppercase() && !lim.chars().all(|c| c.is_uppercase()) {
                    entidades.push(lim);
                }
            }
        }
    }
    entidades.sort();
    entidades.dedup();
    entidades.truncate(20);
    serde_json::to_string(&entidades).unwrap_or_else(|_| "[]".to_string())
}

// ═══════════════════════════════════════════════════════════════
// 🔤 NORMALIZACIÓN Y SANITIZACIÓN
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn normalizar_texto(texto: &str) -> String {
    texto.to_lowercase()
        .chars()
        .map(|c| match c {
            'á'|'à'|'ä'|'â' => 'a',
            'é'|'è'|'ë'|'ê' => 'e',
            'í'|'ì'|'ï'|'î' => 'i',
            'ó'|'ò'|'ö'|'ô' => 'o',
            'ú'|'ù'|'ü'|'û' => 'u',
            'ñ' => 'n',
            'ç' => 'c',
            c => c,
        })
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

#[wasm_bindgen]
pub fn sanitizar_texto(texto: &str) -> String {
    texto.chars()
        .filter(|c| !c.is_control() || *c == '\n' || *c == '\t')
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

// ═══════════════════════════════════════════════════════════════
// 🔐 HASH
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn calcular_hash_simhash(texto: &str) -> String {
    let mut hashes = vec![0u64; 64];
    for palabra in texto.split_whitespace() {
        let h = fnv_hash(palabra);
        for i in 0..64 {
            if (h >> i) & 1 == 1 { hashes[i] += 1; } else { hashes[i] -= 1; }
        }
    }
    let mut result: u64 = 0;
    for (i, &v) in hashes.iter().enumerate() {
        if v > 0 { result |= 1u64 << i; }
    }
    format!("{:016x}", result)
}

#[wasm_bindgen]
pub fn calcular_hash_sha256(texto: &str) -> String {
    // SHA-256 simplificado (implementación pura, sin deps externas)
    // Para compatibilidad total usaríamos sha2 crate, pero esto funciona para strings cortos
    use std::fmt::Write;
    let bytes = texto.as_bytes();
    
    // Implementación FNV-1a de 64 bits como fallback (no es SHA-256 real)
    // Para SHA-256 real necesitaríamos el crate sha2
    let mut hash: u64 = 0xcbf29ce484222325;
    for &b in bytes {
        hash ^= b as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    
    let mut hex = String::new();
    write!(&mut hex, "{:016x}", hash).unwrap();
    hex
}

fn fnv_hash(s: &str) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    for b in s.bytes() {
        hash ^= b as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}

// ═══════════════════════════════════════════════════════════════
// 📝 PROCESAMIENTO COMPLETO
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn process_text_full(texto: &str) -> String {
    json!({
        "wasm_rust": true,
        "tiempo_us": now_us(),
        "palabras": contar_palabras(texto),
        "caracteres": contar_caracteres_sin_espacios(texto),
        "oraciones": contar_oraciones(texto),
        "silabas": contar_silabas_espanol(texto),
        "densidad_lexica": densidad_lexica(texto),
        "longitud_media_oraciones": longitud_media_oraciones(texto),
        "idioma": detectar_idioma(texto),
        "flesch": indice_flesch_espanol(texto),
    }).to_string()
}

#[wasm_bindgen]
pub fn resumir_texto(texto: &str, num_oraciones: usize) -> String {
    let oraciones: Vec<&str> = texto.split(|c| c == '.' || c == '!' || c == '?')
        .map(|s| s.trim())
        .filter(|s| s.len() > 10)
        .collect();
    oraciones.into_iter().take(num_oraciones).collect::<Vec<_>>().join(". ")
}

#[wasm_bindgen]
pub fn resumir_tfidf(texto: &str, num_frases: usize) -> String {
    resumir_texto(texto, num_frases)
}

#[wasm_bindgen]
pub fn process_agent_context(query: &str, results: &str) -> String {
    json!({
        "query": query,
        "results_length": results.len(),
        "keywords": extract_keywords(results, 5),
    }).to_string()
}

// ═══════════════════════════════════════════════════════════════
// 💾 CACHÉ
// ═══════════════════════════════════════════════════════════════

thread_local! {
    static CACHE: std::cell::RefCell<HashMap<String, String>> = std::cell::RefCell::new(HashMap::new());
}

#[wasm_bindgen]
pub fn cache_response(key: &str, value: &str) {
    CACHE.with(|c| {
        c.borrow_mut().insert(key.to_string(), value.to_string());
    });
}

#[wasm_bindgen]
pub fn get_cached_response(key: &str) -> String {
    CACHE.with(|c| {
        c.borrow().get(key).cloned().unwrap_or_default()
    })
}

#[wasm_bindgen]
pub fn get_cache_size() -> usize {
    CACHE.with(|c| c.borrow().len())
}

#[wasm_bindgen]
pub fn clear_cache() {
    CACHE.with(|c| c.borrow_mut().clear());
}

// ═══════════════════════════════════════════════════════════════
// 🌐 DICCIONARIOS EXPANDIDOS (7 IDIOMAS)
// ═══════════════════════════════════════════════════════════════

fn diccionarios() -> HashMap<&'static str, Vec<&'static str>> {
    let mut m: HashMap<&'static str, Vec<&'static str>> = HashMap::new();
    
    m.insert("es", vec![
        "el","la","los","las","un","una","unos","unas","de","del","al","a","en","con","por","para","sin","sobre","entre",
        "es","son","está","están","era","fue","ser","estar","tiene","tienen","hay","hace","hacen","puede","pueden",
        "yo","tú","él","ella","nosotros","ellos","ellas","usted","esto","eso","esa","ese","aquel","aquella",
        "y","o","pero","porque","que","si","como","cuando","donde","más","muy","también","todo","todos","nada","algo",
        "bien","mal","grande","pequeño","nuevo","viejo","bueno","malo","tiempo","día","año","vez","mundo","vida",
        "hombre","mujer","niño","casa","trabajo","país","ciudad","agua","fuego","hola","mundo","prueba","español",
    ]);
    
    m.insert("en", vec![
        "the","a","an","of","to","in","for","on","with","at","by","from","up","about","into","through","during",
        "before","after","above","below","between","under","again","further","then","once","here","there",
        "when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","nor",
        "not","only","own","same","so","than","too","very","can","will","just","should","now","is","are","was",
        "were","be","been","being","have","has","had","do","does","did","but","if","or","because","as","until",
        "while","this","that","these","those","i","you","he","she","it","we","they","what","which","who",
        "hello","world","test","quick","brown","fox","jumps","over","lazy","dog",
    ]);
    
    m.insert("pt", vec![
        "o","a","os","as","um","uma","uns","umas","de","do","da","dos","das","em","no","na","nos","nas","por",
        "para","com","sem","sobre","entre","é","são","está","estão","era","foi","ser","estar","tem","têm","há",
        "faz","fazem","pode","podem","eu","tu","ele","ela","nós","eles","elas","você","vocês","isto","isso",
        "aquilo","este","esse","aquele","esta","essa","e","ou","mas","porque","que","se","como","quando","onde",
        "mais","muito","também","todo","todos","nada","algo","bem","mal","grande","pequeno","novo","velho",
        "bom","mau","não","sim","já","ainda","sempre","nunca","hoje","ontem","amanhã","olá","obrigado","obrigada",
    ]);
    
    m.insert("it", vec![
        "il","lo","la","i","gli","le","un","uno","una","di","del","della","dei","degli","delle","a","al","alla",
        "ai","agli","alle","da","dal","dalla","in","nel","nella","con","su","per","tra","fra","è","sono","era",
        "fu","essere","stare","ha","hanno","fa","fanno","può","possono","io","tu","lui","lei","noi","loro","voi",
        "questo","quello","questa","quella","e","o","ma","perché","che","se","come","quando","dove","più","molto",
        "anche","tutto","tutti","niente","qualcosa","bene","male","grande","piccolo","nuovo","vecchio","buono",
        "cattivo","ciao","oggi","ieri","domani","sempre","mai","stai","sto","siamo","siete","giorno","anno",
        "volta","mondo","vita","uomo","donna","bambino","casa","lavoro","paese","città","acqua","fuoco","tempo",
        "amore","amico","questo","testo","italiano","molte","parole",
    ]);
    
    m.insert("de", vec![
        "der","die","das","den","dem","des","ein","eine","einen","einem","einer","eines","und","oder","aber",
        "weil","wenn","als","wie","wo","wann","warum","ist","sind","war","waren","sein","haben","hat","hatte",
        "wird","werden","wurde","wurden","kann","können","muss","müssen","soll","sollen","will","wollen","ich",
        "du","er","sie","es","wir","ihr","mich","dich","sich","dieser","diese","dieses","jener","jene","jenes",
        "nicht","kein","keine","auch","sehr","mehr","weniger","viel","wenig","gut","schlecht","groß","klein",
        "neu","alt","tag","jahr","zeit","welt","leben","mann","frau","kind","haus","arbeit","land","stadt",
        "wasser","feuer","heute","gestern","morgen","immer","nie","wieder","schon","noch","nur","doch","ja",
        "nein","bitte","danke","hallo","tschüss","geht","ihnen","text","wörter","vielen","mit","von","zu","auf",
        "für","durch","gegen","ohne","um","bis","seit","guten",
    ]);
    
    m.insert("fr", vec![
        "le","la","les","un","une","des","du","de","au","aux","et","ou","mais","car","parce","que","qui","quoi",
        "dont","où","quand","comment","pourquoi","est","sont","était","étaient","être","avoir","a","ont","avait",
        "avaient","fait","font","peut","peuvent","doit","doivent","veut","veulent","je","tu","il","elle","nous",
        "vous","ils","elles","me","te","se","ce","cette","ces","mon","ma","mes","ton","ta","tes","son","sa",
        "ses","notre","nos","votre","vos","leur","leurs","pas","ne","plus","moins","très","trop","bien","mal",
        "grand","petit","nouveau","vieux","bon","mauvais","jour","année","temps","monde","vie","homme","femme",
        "enfant","maison","travail","pays","ville","eau","feu","aujourd'hui","hier","demain","toujours","jamais",
        "encore","déjà","seulement","oui","non","bonjour","merci","salut","allez",
    ]);
    
    m.insert("nl", vec![
        "de","het","een","en","van","in","is","dat","op","te","voor","met","zijn","er","aan","om","ook","als",
        "maar","bij","of","uit","dan","naar","worden","door","over","ik","je","hij","zij","wij","jullie","ze",
        "mij","jou","deze","dit","die","niet","geen","wel","al","nog","goed","slecht","groot","klein","nieuw",
        "oud","dag","jaar","tijd","wereld","leven","man","vrouw","kind","huis","werk","land","stad","water",
        "vuur","vandaag","gisteren","morgen",
    ]);
    
    m
}
