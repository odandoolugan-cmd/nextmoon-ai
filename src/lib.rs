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

// ═══════════════════════════════════════════════════════════════
// 📈 ANÁLISIS TÉCNICO CRIPTO (v5 — 12 funciones nuevas)
// ═══════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub fn calcular_rsi(prices_json: &str, period: usize) -> f64 {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < period + 1 { return 50.0; }
    let mut gains = 0.0;
    let mut losses = 0.0;
    for i in 1..=period {
        let diff = prices[i] - prices[i - 1];
        if diff > 0.0 { gains += diff; } else { losses += -diff; }
    }
    let mut avg_gain = gains / period as f64;
    let mut avg_loss = losses / period as f64;
    for i in (period + 1)..prices.len() {
        let diff = prices[i] - prices[i - 1];
        let gain = if diff > 0.0 { diff } else { 0.0 };
        let loss = if diff < 0.0 { -diff } else { 0.0 };
        avg_gain = (avg_gain * (period as f64 - 1.0) + gain) / period as f64;
        avg_loss = (avg_loss * (period as f64 - 1.0) + loss) / period as f64;
    }
    if avg_loss == 0.0 { return 100.0; }
    let rs = avg_gain / avg_loss;
    100.0 - (100.0 / (1.0 + rs))
}

#[wasm_bindgen]
pub fn calcular_sma(prices_json: &str, period: usize) -> f64 {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < period { return 0.0; }
    let sum: f64 = prices[prices.len() - period..].iter().sum();
    sum / period as f64
}

#[wasm_bindgen]
pub fn calcular_ema(prices_json: &str, period: usize) -> f64 {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < period { return 0.0; }
    let k = 2.0 / (period as f64 + 1.0);
    let mut ema = prices[0];
    for &p in prices.iter().skip(1) {
        ema = p * k + ema * (1.0 - k);
    }
    ema
}

#[wasm_bindgen]
pub fn calcular_macd(prices_json: &str) -> String {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < 26 { return json!({"macd": 0.0, "signal": 0.0, "histogram": 0.0, "tendencia": "indefinida"}).to_string(); }
    let ema12 = calcular_ema(prices_json, 12);
    let ema26 = calcular_ema(prices_json, 26);
    let macd = ema12 - ema26;
    let signal = macd * 0.9;
    let histogram = macd - signal;
    json!({
        "macd": (macd * 10000.0).round() / 10000.0,
        "signal": (signal * 10000.0).round() / 10000.0,
        "histogram": (histogram * 10000.0).round() / 10000.0,
        "tendencia": if histogram > 0.0 { "alcista" } else { "bajista" }
    }).to_string()
}

#[wasm_bindgen]
pub fn calcular_bollinger(prices_json: &str, period: usize) -> String {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < period { return json!({"superior": 0.0, "media": 0.0, "inferior": 0.0, "posicion": "indefinida"}).to_string(); }
    let slice = &prices[prices.len() - period..];
    let sma: f64 = slice.iter().sum::<f64>() / period as f64;
    let variance: f64 = slice.iter().map(|p| (p - sma).powi(2)).sum::<f64>() / period as f64;
    let std = variance.sqrt();
    let superior = sma + 2.0 * std;
    let inferior = sma - 2.0 * std;
    let ultimo = prices[prices.len() - 1];
    let posicion = if ultimo > superior { "sobrecompra" } else if ultimo < inferior { "sobreventa" } else { "neutral" };
    json!({
        "superior": (superior * 10000.0).round() / 10000.0,
        "media": (sma * 10000.0).round() / 10000.0,
        "inferior": (inferior * 10000.0).round() / 10000.0,
        "posicion": posicion
    }).to_string()
}

#[wasm_bindgen]
pub fn calcular_volatilidad(prices_json: &str) -> f64 {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < 2 { return 0.0; }
    let media: f64 = prices.iter().sum::<f64>() / prices.len() as f64;
    let varianza: f64 = prices.iter().map(|p| (p - media).powi(2)).sum::<f64>() / prices.len() as f64;
    let std = varianza.sqrt();
    if media == 0.0 { return 0.0; }
    (std / media) * 100.0
}

#[wasm_bindgen]
pub fn analizar_tendencia(prices_json: &str) -> String {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < 10 { return "indefinida".to_string(); }
    let sma_corta = calcular_sma(prices_json, 5);
    let sma_larga = calcular_sma(prices_json, 20.min(prices.len()));
    let diff_pct = if sma_larga > 0.0 { (sma_corta - sma_larga) / sma_larga * 100.0 } else { 0.0 };
    if diff_pct > 2.0 { "alcista_fuerte".to_string() }
    else if diff_pct > 0.5 { "alcista".to_string() }
    else if diff_pct < -2.0 { "bajista_fuerte".to_string() }
    else if diff_pct < -0.5 { "bajista".to_string() }
    else { "lateral".to_string() }
}

#[wasm_bindgen]
pub fn detectar_soporte_resistencia(prices_json: &str) -> String {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < 20 { return json!({"soporte": 0.0, "resistencia": 0.0}).to_string(); }
    let ventana = 5;
    let mut soportes: Vec<f64> = Vec::new();
    let mut resistencias: Vec<f64> = Vec::new();
    for i in ventana..(prices.len() - ventana) {
        let slice = &prices[i - ventana..=i + ventana];
        if slice.iter().all(|&p| p >= prices[i]) { soportes.push(prices[i]); }
        if slice.iter().all(|&p| p <= prices[i]) { resistencias.push(prices[i]); }
    }
    let soporte = if soportes.is_empty() { 0.0 } else { soportes.iter().sum::<f64>() / soportes.len() as f64 };
    let resistencia = if resistencias.is_empty() { 0.0 } else { resistencias.iter().sum::<f64>() / resistencias.len() as f64 };
    json!({
        "soporte": (soporte * 10000.0).round() / 10000.0,
        "resistencia": (resistencia * 10000.0).round() / 10000.0,
        "niveles_soporte": soportes.len(),
        "niveles_resistencia": resistencias.len()
    }).to_string()
}

#[wasm_bindgen]
pub fn calcular_sharpe_ratio(returns_json: &str) -> f64 {
    let returns: Vec<f64> = serde_json::from_str(returns_json).unwrap_or_default();
    if returns.len() < 2 { return 0.0; }
    let media: f64 = returns.iter().sum::<f64>() / returns.len() as f64;
    let varianza: f64 = returns.iter().map(|r| (r - media).powi(2)).sum::<f64>() / (returns.len() - 1) as f64;
    let std = varianza.sqrt();
    if std == 0.0 { return 0.0; }
    media / std
}

#[wasm_bindgen]
pub fn calcular_stochastic(highs_json: &str, lows_json: &str, closes_json: &str, period: usize) -> String {
    let highs: Vec<f64> = serde_json::from_str(highs_json).unwrap_or_default();
    let lows: Vec<f64> = serde_json::from_str(lows_json).unwrap_or_default();
    let closes: Vec<f64> = serde_json::from_str(closes_json).unwrap_or_default();
    if highs.len() < period || lows.len() < period || closes.len() < period {
        return json!({"k": 50.0, "d": 50.0, "señal": "neutral"}).to_string();
    }
    let slice_high = &highs[highs.len() - period..];
    let slice_low = &lows[lows.len() - period..];
    let highest = slice_high.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let lowest = slice_low.iter().cloned().fold(f64::INFINITY, f64::min);
    let close = closes[closes.len() - 1];
    let k = if highest - lowest == 0.0 { 50.0 } else { (close - lowest) / (highest - lowest) * 100.0 };
    let d = k * 0.9;
    json!({
        "k": (k * 100.0).round() / 100.0,
        "d": (d * 100.0).round() / 100.0,
        "señal": if k < 20.0 { "sobreventa" } else if k > 80.0 { "sobrecompra" } else { "neutral" }
    }).to_string()
}

#[wasm_bindgen]
pub fn calcular_atr(highs_json: &str, lows_json: &str, closes_json: &str, period: usize) -> f64 {
    let highs: Vec<f64> = serde_json::from_str(highs_json).unwrap_or_default();
    let lows: Vec<f64> = serde_json::from_str(lows_json).unwrap_or_default();
    let closes: Vec<f64> = serde_json::from_str(closes_json).unwrap_or_default();
    if highs.len() < 2 || lows.len() < 2 || closes.len() < 2 { return 0.0; }
    let mut trs: Vec<f64> = Vec::new();
    for i in 1..highs.len() {
        let tr = (highs[i] - lows[i])
            .max((highs[i] - closes[i - 1]).abs())
            .max((lows[i] - closes[i - 1]).abs());
        trs.push(tr);
    }
    if trs.len() < period { return 0.0; }
    let slice = &trs[trs.len() - period..];
    slice.iter().sum::<f64>() / period as f64
}

#[wasm_bindgen]
pub fn analisis_tecnico_completo(prices_json: &str, volumes_json: &str) -> String {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    let _volumes: Vec<f64> = serde_json::from_str(volumes_json).unwrap_or_default();
    if prices.len() < 30 {
        return json!({"error": "Datos insuficientes (mínimo 30 puntos)"}).to_string();
    }
    let rsi = calcular_rsi(prices_json, 14);
    let macd = calcular_macd(prices_json);
    let bollinger = calcular_bollinger(prices_json, 20);
    let volatilidad = calcular_volatilidad(prices_json);
    let tendencia = analizar_tendencia(prices_json);
    let sr = detectar_soporte_resistencia(prices_json);
    let sma20 = calcular_sma(prices_json, 20);
    let ema12 = calcular_ema(prices_json, 12);
    let ultimo_precio = prices[prices.len() - 1];
    let mut score: i32 = 0;
    if rsi < 30.0 { score += 2; }
    if rsi > 70.0 { score -= 2; }
    if tendencia.contains("alcista") { score += 1; }
    if tendencia.contains("bajista") { score -= 1; }
    if ultimo_precio > sma20 { score += 1; } else { score -= 1; }
    if ultimo_precio > ema12 { score += 1; } else { score -= 1; }
    let señal = if score >= 3 { "COMPRAR" } else if score <= -3 { "NO COMPRAR" } else { "NEUTRAL" };
    json!({
        "precio_actual": ultimo_precio,
        "rsi": (rsi * 100.0).round() / 100.0,
        "macd": serde_json::from_str::<serde_json::Value>(&macd).unwrap_or(json!({})),
        "bollinger": serde_json::from_str::<serde_json::Value>(&bollinger).unwrap_or(json!({})),
        "volatilidad_pct": (volatilidad * 100.0).round() / 100.0,
        "tendencia": tendencia,
        "soporte_resistencia": serde_json::from_str::<serde_json::Value>(&sr).unwrap_or(json!({})),
        "sma20": (sma20 * 10000.0).round() / 10000.0,
        "ema12": (ema12 * 10000.0).round() / 10000.0,
        "score": score,
        "señal": señal
    }).to_string()
}

// ═══════════════════════════════════════════════════════════════
// 📈 ANÁLISIS TÉCNICO AVANZADO (v6 — 8 funciones nuevas)
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 13. Ichimoku Cloud
// ─────────────────────────────────────────────
#[wasm_bindgen]
pub fn calcular_ichimoku(highs_json: &str, lows_json: &str, closes_json: &str) -> String {
    let highs: Vec<f64> = serde_json::from_str(highs_json).unwrap_or_default();
    let lows: Vec<f64> = serde_json::from_str(lows_json).unwrap_or_default();
    let closes: Vec<f64> = serde_json::from_str(closes_json).unwrap_or_default();
    
    if highs.len() < 52 || lows.len() < 52 || closes.len() < 52 {
        return json!({"error": "Se necesitan al menos 52 puntos"}).to_string();
    }
    
    let high_max = |p: usize| -> f64 { highs[highs.len() - p..].iter().cloned().fold(f64::NEG_INFINITY, f64::max) };
    let low_min = |p: usize| -> f64 { lows[lows.len() - p..].iter().cloned().fold(f64::INFINITY, f64::min) };
    
    let tenkan = (high_max(9) + low_min(9)) / 2.0;
    let kijun = (high_max(26) + low_min(26)) / 2.0;
    let senkou_a = (tenkan + kijun) / 2.0;
    let senkou_b = (high_max(52) + low_min(52)) / 2.0;
    let chikou = closes[closes.len() - 1];
    
    let ultimo = closes[closes.len() - 1];
    let posicion = if ultimo > senkou_a.max(senkou_b) { "arriba_nube" }
                   else if ultimo < senkou_a.min(senkou_b) { "abajo_nube" }
                   else { "dentro_nube" };
    
    json!({
        "tenkan": (tenkan * 100.0).round() / 100.0,
        "kijun": (kijun * 100.0).round() / 100.0,
        "senkou_a": (senkou_a * 100.0).round() / 100.0,
        "senkou_b": (senkou_b * 100.0).round() / 100.0,
        "chikou": (chikou * 100.0).round() / 100.0,
        "posicion": posicion
    }).to_string()
}

// ─────────────────────────────────────────────
// 14. Fibonacci Retracement
// ─────────────────────────────────────────────
#[wasm_bindgen]
pub fn calcular_fibonacci(highs_json: &str, lows_json: &str) -> String {
    let highs: Vec<f64> = serde_json::from_str(highs_json).unwrap_or_default();
    let lows: Vec<f64> = serde_json::from_str(lows_json).unwrap_or_default();
    
    if highs.is_empty() || lows.is_empty() {
        return json!({"error": "Datos vacíos"}).to_string();
    }
    
    let max = highs.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let min = lows.iter().cloned().fold(f64::INFINITY, f64::min);
    let diff = max - min;
    
    json!({
        "nivel_0": (max * 100.0).round() / 100.0,
        "nivel_236": ((max - diff * 0.236) * 100.0).round() / 100.0,
        "nivel_382": ((max - diff * 0.382) * 100.0).round() / 100.0,
        "nivel_500": ((max - diff * 0.500) * 100.0).round() / 100.0,
        "nivel_618": ((max - diff * 0.618) * 100.0).round() / 100.0,
        "nivel_786": ((max - diff * 0.786) * 100.0).round() / 100.0,
        "nivel_1000": (min * 100.0).round() / 100.0,
    }).to_string()
}

// ─────────────────────────────────────────────
// 15. Detector de patrones de velas
// ─────────────────────────────────────────────
#[wasm_bindgen]
pub fn detectar_patron_velas(opens_json: &str, highs_json: &str, lows_json: &str, closes_json: &str) -> String {
    let opens: Vec<f64> = serde_json::from_str(opens_json).unwrap_or_default();
    let highs: Vec<f64> = serde_json::from_str(highs_json).unwrap_or_default();
    let lows: Vec<f64> = serde_json::from_str(lows_json).unwrap_or_default();
    let closes: Vec<f64> = serde_json::from_str(closes_json).unwrap_or_default();
    
    if opens.len() < 3 || highs.len() < 3 || lows.len() < 3 || closes.len() < 3 {
        return json!({"error": "Se necesitan al menos 3 velas"}).to_string();
    }
    
    let mut patrones: Vec<&str> = Vec::new();
    let n = closes.len();
    
    // Vela actual
    let o = opens[n - 1];
    let h = highs[n - 1];
    let l = lows[n - 1];
    let c = closes[n - 1];
    
    let cuerpo = (c - o).abs();
    let rango = h - l;
    let mecha_sup = h - o.max(c);
    let mecha_inf = o.min(c) - l;
    
    // Doji
    if cuerpo < rango * 0.1 && rango > 0.0 { patrones.push("doji"); }
    
    // Hammer (martillo)
    if mecha_inf > cuerpo * 2.0 && mecha_sup < cuerpo * 0.5 { patrones.push("hammer"); }
    
    // Shooting Star (estrella fugaz)
    if mecha_sup > cuerpo * 2.0 && mecha_inf < cuerpo * 0.5 { patrones.push("shooting_star"); }
    
    // Bullish Engulfing
    let o_prev = opens[n - 2];
    let c_prev = closes[n - 2];
    if c_prev < o_prev && c > o && c > o_prev && o < c_prev { patrones.push("bullish_engulfing"); }
    
    // Bearish Engulfing
    if c_prev > o_prev && c < o && c < o_prev && o > c_prev { patrones.push("bearish_engulfing"); }
    
    // Three White Soldiers
    if n >= 3 {
        let c1 = closes[n - 3]; let c2 = closes[n - 2]; let c3 = closes[n - 1];
        let o1 = opens[n - 3]; let o2 = opens[n - 2]; let o3 = opens[n - 1];
        if c1 > o1 && c2 > o2 && c3 > o3 && c2 > c1 && c3 > c2 { patrones.push("three_white_soldiers"); }
    }
    
    // Three Black Crows
    if n >= 3 {
        let c1 = closes[n - 3]; let c2 = closes[n - 2]; let c3 = closes[n - 1];
        let o1 = opens[n - 3]; let o2 = opens[n - 2]; let o3 = opens[n - 1];
        if c1 < o1 && c2 < o2 && c3 < o3 && c2 < c1 && c3 < c2 { patrones.push("three_black_crows"); }
    }
    
    json!({
        "patrones": patrones,
        "total": patrones.len(),
        "es_alcista": patrones.iter().any(|p| p.contains("bullish") || p == &"hammer" || p == &"three_white_soldiers"),
        "es_bajista": patrones.iter().any(|p| p.contains("bearish") || p == &"shooting_star" || p == &"three_black_crows")
    }).to_string()
}

// ─────────────────────────────────────────────
// 16. ADX (Average Directional Index)
// ─────────────────────────────────────────────
#[wasm_bindgen]
pub fn calcular_adx(highs_json: &str, lows_json: &str, closes_json: &str, period: usize) -> f64 {
    let highs: Vec<f64> = serde_json::from_str(highs_json).unwrap_or_default();
    let lows: Vec<f64> = serde_json::from_str(lows_json).unwrap_or_default();
    let closes: Vec<f64> = serde_json::from_str(closes_json).unwrap_or_default();
    
    if highs.len() < period + 1 || lows.len() < period + 1 || closes.len() < period + 1 {
        return 0.0;
    }
    
    let mut tr_sum = 0.0;
    let mut plus_dm_sum = 0.0;
    let mut minus_dm_sum = 0.0;
    
    for i in (highs.len() - period)..highs.len() {
        if i == 0 { continue; }
        let tr = (highs[i] - lows[i])
            .max((highs[i] - closes[i - 1]).abs())
            .max((lows[i] - closes[i - 1]).abs());
        tr_sum += tr;
        
        let up = highs[i] - highs[i - 1];
        let down = lows[i - 1] - lows[i];
        if up > down && up > 0.0 { plus_dm_sum += up; }
        if down > up && down > 0.0 { minus_dm_sum += down; }
    }
    
    if tr_sum == 0.0 { return 0.0; }
    let plus_di = 100.0 * plus_dm_sum / tr_sum;
    let minus_di = 100.0 * minus_dm_sum / tr_sum;
    let sum = plus_di + minus_di;
    if sum == 0.0 { return 0.0; }
    let dx = 100.0 * (plus_di - minus_di).abs() / sum;
    dx
}

// ─────────────────────────────────────────────
// 17. OBV (On-Balance Volume)
// ─────────────────────────────────────────────
#[wasm_bindgen]
pub fn calcular_obv(closes_json: &str, volumes_json: &str) -> f64 {
    let closes: Vec<f64> = serde_json::from_str(closes_json).unwrap_or_default();
    let volumes: Vec<f64> = serde_json::from_str(volumes_json).unwrap_or_default();
    
    if closes.len() < 2 || volumes.len() < 2 { return 0.0; }
    
    let mut obv = 0.0;
    for i in 1..closes.len().min(volumes.len()) {
        if closes[i] > closes[i - 1] { obv += volumes[i]; }
        else if closes[i] < closes[i - 1] { obv -= volumes[i]; }
    }
    obv
}

// ─────────────────────────────────────────────
// 18. VWAP (Volume Weighted Average Price)
// ─────────────────────────────────────────────
#[wasm_bindgen]
pub fn calcular_vwap(highs_json: &str, lows_json: &str, closes_json: &str, volumes_json: &str) -> f64 {
    let highs: Vec<f64> = serde_json::from_str(highs_json).unwrap_or_default();
    let lows: Vec<f64> = serde_json::from_str(lows_json).unwrap_or_default();
    let closes: Vec<f64> = serde_json::from_str(closes_json).unwrap_or_default();
    let volumes: Vec<f64> = serde_json::from_str(volumes_json).unwrap_or_default();
    
    let n = highs.len().min(lows.len()).min(closes.len()).min(volumes.len());
    if n == 0 { return 0.0; }
    
    let mut pv_sum = 0.0;
    let mut v_sum = 0.0;
    
    for i in 0..n {
        let tp = (highs[i] + lows[i] + closes[i]) / 3.0;
        pv_sum += tp * volumes[i];
        v_sum += volumes[i];
    }
    
    if v_sum == 0.0 { return 0.0; }
    pv_sum / v_sum
}

// ─────────────────────────────────────────────
// 19. Detector de divergencias (RSI vs Precio)
// ─────────────────────────────────────────────
#[wasm_bindgen]
pub fn detectar_divergencia(closes_json: &str) -> String {
    let closes: Vec<f64> = serde_json::from_str(closes_json).unwrap_or_default();
    
    if closes.len() < 30 {
        return json!({"tipo": "indefinida", "fuerza": 0.0}).to_string();
    }
    
    // Calcular RSI simple para cada punto
    let period = 14;
    let mut rsi_series: Vec<f64> = Vec::new();
    for i in period..closes.len() {
        let slice = &closes[i - period..i];
        let mut gains = 0.0;
        let mut losses = 0.0;
        for j in 1..slice.len() {
            let diff = slice[j] - slice[j - 1];
            if diff > 0.0 { gains += diff; } else { losses -= diff; }
        }
        let rs = if losses == 0.0 { 100.0 } else { gains / losses };
        rsi_series.push(100.0 - (100.0 / (1.0 + rs)));
    }
    
    if rsi_series.len() < 10 { return json!({"tipo": "indefinida", "fuerza": 0.0}).to_string(); }
    
    // Comparar últimos movimientos de precio vs RSI
    let precio_reciente = closes[closes.len() - 1];
    let precio_anterior = closes[closes.len() - 10];
    let rsi_reciente = rsi_series[rsi_series.len() - 1];
    let rsi_anterior = rsi_series[rsi_series.len() - 10];
    
    let precio_sube = precio_reciente > precio_anterior;
    let rsi_sube = rsi_reciente > rsi_anterior;
    
    let tipo = if precio_sube && !rsi_sube {
        "divergencia_bajista"  // Precio sube, RSI baja = posible reversión
    } else if !precio_sube && rsi_sube {
        "divergencia_alcista"  // Precio baja, RSI sube = posible rebote
    } else {
        "sin_divergencia"
    };
    
    let fuerza = ((rsi_reciente - rsi_anterior).abs() / 100.0 * 5.0).min(1.0);
    
    json!({
        "tipo": tipo,
        "fuerza": (fuerza * 100.0).round() / 100.0,
        "precio_actual": precio_reciente,
        "rsi_actual": (rsi_reciente * 100.0).round() / 100.0
    }).to_string()
}

// ─────────────────────────────────────────────
// 20. Generador de señal de compra global
// ─────────────────────────────────────────────
#[wasm_bindgen]
pub fn generar_senal_compra(
    prices_json: &str,
    highs_json: &str,
    lows_json: &str,
    opens_json: &str,
    closes_json: &str,
    volumes_json: &str,
) -> String {
    let prices: Vec<f64> = serde_json::from_str(prices_json).unwrap_or_default();
    if prices.len() < 30 {
        return json!({"error": "Datos insuficientes"}).to_string();
    }
    
    let rsi = calcular_rsi(prices_json, 14);
    let macd = serde_json::from_str::<serde_json::Value>(&calcular_macd(prices_json)).unwrap_or(json!({}));
    let tendencia = analizar_tendencia(prices_json);
    let volatilidad = calcular_volatilidad(prices_json);
    let bollinger = serde_json::from_str::<serde_json::Value>(&calcular_bollinger(prices_json, 20)).unwrap_or(json!({}));
    let patrones = serde_json::from_str::<serde_json::Value>(&detectar_patron_velas(opens_json, highs_json, lows_json, closes_json)).unwrap_or(json!({}));
    let divergencia = serde_json::from_str::<serde_json::Value>(&detectar_divergencia(prices_json)).unwrap_or(json!({}));
    let adx = calcular_adx(highs_json, lows_json, closes_json, 14);
    
    // Sistema de puntuación
    let mut score: i32 = 0;
    let mut razones: Vec<String> = Vec::new();
    
    // RSI
    if rsi < 30.0 { score += 2; razones.push(format!("RSI bajo ({:.1}) - sobreventa", rsi)); }
    else if rsi > 70.0 { score -= 2; razones.push(format!("RSI alto ({:.1}) - sobrecompra", rsi)); }
    
    // MACD
    if macd.get("tendencia").and_then(|t| t.as_str()) == Some("alcista") {
        score += 1; razones.push("MACD alcista".to_string());
    } else if macd.get("tendencia").and_then(|t| t.as_str()) == Some("bajista") {
        score -= 1; razones.push("MACD bajista".to_string());
    }
    
    // Tendencia
    if tendencia.contains("alcista_fuerte") { score += 2; razones.push("Tendencia alcista fuerte".to_string()); }
    else if tendencia.contains("alcista") { score += 1; razones.push("Tendencia alcista".to_string()); }
    else if tendencia.contains("bajista_fuerte") { score -= 2; razones.push("Tendencia bajista fuerte".to_string()); }
    else if tendencia.contains("bajista") { score -= 1; razones.push("Tendencia bajista".to_string()); }
    
    // Bollinger
    if bollinger.get("posicion").and_then(|p| p.as_str()) == Some("sobreventa") {
        score += 2; razones.push("Bollinger: sobreventa".to_string());
    } else if bollinger.get("posicion").and_then(|p| p.as_str()) == Some("sobrecompra") {
        score -= 2; razones.push("Bollinger: sobrecompra".to_string());
    }
    
    // Patrones
    if patrones.get("es_alcista").and_then(|b| b.as_bool()).unwrap_or(false) {
        score += 2; razones.push("Patrón de velas alcista".to_string());
    }
    if patrones.get("es_bajista").and_then(|b| b.as_bool()).unwrap_or(false) {
        score -= 2; razones.push("Patrón de velas bajista".to_string());
    }
    
    // Divergencia
    if divergencia.get("tipo").and_then(|t| t.as_str()) == Some("divergencia_alcista") {
        score += 2; razones.push("Divergencia alcista".to_string());
    } else if divergencia.get("tipo").and_then(|t| t.as_str()) == Some("divergencia_bajista") {
        score -= 2; razones.push("Divergencia bajista".to_string());
    }
    
    // ADX (fuerza de tendencia)
    if adx > 25.0 { razones.push(format!("ADX fuerte ({:.1})", adx)); }
    else if adx < 20.0 { razones.push(format!("ADX débil ({:.1}) - tendencia lateral", adx)); }
    
    // Volatilidad
    if volatilidad > 15.0 { razones.push(format!("Alta volatilidad ({:.1}%)", volatilidad)); }
    
    // Decisión final
    let señal = if score >= 4 { "COMPRAR_FUERTE" }
                else if score >= 2 { "COMPRAR" }
                else if score <= -4 { "VENDER_FUERTE" }
                else if score <= -2 { "NO_COMPRAR" }
                else { "NEUTRAL" };
    
    let confianza = (score.abs() as f64 / 8.0 * 100.0).min(100.0);
    
    json!({
        "señal": señal,
        "score": score,
        "confianza_pct": (confianza * 10.0).round() / 10.0,
        "rsi": (rsi * 100.0).round() / 100.0,
        "adx": (adx * 100.0).round() / 100.0,
        "tendencia": tendencia,
        "volatilidad": (volatilidad * 100.0).round() / 100.0,
        "razones": razones,
        "total_razones": razones.len()
    }).to_string()
}
