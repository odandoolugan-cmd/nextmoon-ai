/* tslint:disable */
/* eslint-disable */
export function contar_caracteres_sin_espacios(texto: string): number;
export function sanitizar_texto(texto: string): string;
export function process_agent_context(query: string, results: string): string;
export function generar_senal_compra(prices_json: string, highs_json: string, lows_json: string, opens_json: string, closes_json: string, volumes_json: string): string;
export function calcular_sharpe_ratio(returns_json: string): number;
export function detectar_idioma(texto: string): string;
export function extract_ngramas(texto: string, top: number): string;
export function detectar_pii(texto: string): string;
export function calcular_ichimoku(highs_json: string, lows_json: string, closes_json: string): string;
export function calcular_vwap(highs_json: string, lows_json: string, closes_json: string, volumes_json: string): number;
export function longitud_media_oraciones(texto: string): number;
export function extraer_numeros(texto: string): string;
export function detectar_discurso_odio(texto: string): string;
export function calcular_fibonacci(highs_json: string, lows_json: string): string;
export function detectar_patron_velas(opens_json: string, highs_json: string, lows_json: string, closes_json: string): string;
export function calcular_bollinger(prices_json: string, period: number): string;
export function calcular_obv(closes_json: string, volumes_json: string): number;
export function extraer_urls(texto: string): string;
export function get_cache_size(): number;
export function calcular_cci(highs_json: string, lows_json: string, closes_json: string, periodo: number): number;
export function detectar_hombro_cabeza_hombro(closes_json: string): string;
export function indice_flesch_espanol(texto: string): number;
export function extract_keywords(texto: string, cantidad: number): string;
export function analizar_tendencia(prices_json: string): string;
export function cache_response(key: string, value: string): void;
export function indice_gunning_fog(texto: string): number;
export function detectar_muletillas_ia(texto: string): string;
export function extraer_fechas(texto: string): string;
export function wasm_version(): number;
export function calcular_mfi(highs_json: string, lows_json: string, closes_json: string, volumes_json: string, periodo: number): number;
export function detectar_clickbait(texto: string): string;
export function calcular_williams_r(highs_json: string, lows_json: string, closes_json: string, periodo: number): number;
export function calcular_volatilidad(prices_json: string): number;
export function contar_palabras(texto: string): number;
export function contar_silabas_espanol(texto: string): number;
export function extraer_emails(texto: string): string;
export function detectar_topicos(texto: string): string;
export function extract_authors_fast(texto: string): string;
export function calcular_sma(prices_json: string, period: number): number;
export function similitud_coseno(texto1: string, texto2: string): number;
export function calcular_hash_simhash(texto: string): string;
export function calcular_hash_sha256(texto: string): string;
export function normalizar_texto(texto: string): string;
export function resumir_texto(texto: string, num_oraciones: number): string;
export function sentimiento_espanol(texto: string): string;
export function detectar_idioma_avanzado(texto: string): string;
export function now_us(): number;
export function extraer_entidades_nombradas(texto: string): string;
export function calcular_rsi(prices_json: string, period: number): number;
export function calcular_stochastic(highs_json: string, lows_json: string, closes_json: string, period: number): string;
export function analisis_tecnico_completo(prices_json: string, volumes_json: string): string;
export function detectar_divergencia(closes_json: string): string;
export function calcular_adx(highs_json: string, lows_json: string, closes_json: string, period: number): number;
export function detectar_soporte_resistencia(prices_json: string): string;
export function calcular_atr(highs_json: string, lows_json: string, closes_json: string, period: number): number;
export function extraer_hashtags_menciones(texto: string): string;
export function densidad_lexica(texto: string): number;
export function resumir_tfidf(texto: string, num_frases: number): string;
export function calcular_vwap_bands(highs_json: string, lows_json: string, closes_json: string, volumes_json: string): string;
export function calcular_macd(prices_json: string): string;
export function get_cached_response(key: string): string;
export function clear_cache(): void;
export function calcular_ema(prices_json: string, period: number): number;
export function contar_oraciones(texto: string): number;
export function process_text_full(texto: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly analisis_tecnico_completo: (a: number, b: number, c: number, d: number) => [number, number];
  readonly analizar_tendencia: (a: number, b: number) => [number, number];
  readonly cache_response: (a: number, b: number, c: number, d: number) => void;
  readonly calcular_adx: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly calcular_atr: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly calcular_bollinger: (a: number, b: number, c: number) => [number, number];
  readonly calcular_cci: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly calcular_ema: (a: number, b: number, c: number) => number;
  readonly calcular_fibonacci: (a: number, b: number, c: number, d: number) => [number, number];
  readonly calcular_hash_sha256: (a: number, b: number) => [number, number];
  readonly calcular_hash_simhash: (a: number, b: number) => [number, number];
  readonly calcular_ichimoku: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly calcular_macd: (a: number, b: number) => [number, number];
  readonly calcular_mfi: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly calcular_obv: (a: number, b: number, c: number, d: number) => number;
  readonly calcular_rsi: (a: number, b: number, c: number) => number;
  readonly calcular_sharpe_ratio: (a: number, b: number) => number;
  readonly calcular_sma: (a: number, b: number, c: number) => number;
  readonly calcular_stochastic: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
  readonly calcular_volatilidad: (a: number, b: number) => number;
  readonly calcular_vwap: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly calcular_vwap_bands: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
  readonly calcular_williams_r: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly clear_cache: () => void;
  readonly contar_caracteres_sin_espacios: (a: number, b: number) => number;
  readonly contar_oraciones: (a: number, b: number) => number;
  readonly contar_palabras: (a: number, b: number) => number;
  readonly contar_silabas_espanol: (a: number, b: number) => number;
  readonly densidad_lexica: (a: number, b: number) => number;
  readonly detectar_clickbait: (a: number, b: number) => [number, number];
  readonly detectar_discurso_odio: (a: number, b: number) => [number, number];
  readonly detectar_divergencia: (a: number, b: number) => [number, number];
  readonly detectar_hombro_cabeza_hombro: (a: number, b: number) => [number, number];
  readonly detectar_idioma: (a: number, b: number) => [number, number];
  readonly detectar_idioma_avanzado: (a: number, b: number) => [number, number];
  readonly detectar_muletillas_ia: (a: number, b: number) => [number, number];
  readonly detectar_patron_velas: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
  readonly detectar_pii: (a: number, b: number) => [number, number];
  readonly detectar_soporte_resistencia: (a: number, b: number) => [number, number];
  readonly detectar_topicos: (a: number, b: number) => [number, number];
  readonly extract_authors_fast: (a: number, b: number) => [number, number];
  readonly extract_keywords: (a: number, b: number, c: number) => [number, number];
  readonly extract_ngramas: (a: number, b: number, c: number) => [number, number];
  readonly extraer_emails: (a: number, b: number) => [number, number];
  readonly extraer_entidades_nombradas: (a: number, b: number) => [number, number];
  readonly extraer_fechas: (a: number, b: number) => [number, number];
  readonly extraer_hashtags_menciones: (a: number, b: number) => [number, number];
  readonly extraer_numeros: (a: number, b: number) => [number, number];
  readonly extraer_urls: (a: number, b: number) => [number, number];
  readonly generar_senal_compra: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => [number, number];
  readonly get_cache_size: () => number;
  readonly get_cached_response: (a: number, b: number) => [number, number];
  readonly indice_flesch_espanol: (a: number, b: number) => number;
  readonly indice_gunning_fog: (a: number, b: number) => number;
  readonly longitud_media_oraciones: (a: number, b: number) => number;
  readonly normalizar_texto: (a: number, b: number) => [number, number];
  readonly process_agent_context: (a: number, b: number, c: number, d: number) => [number, number];
  readonly process_text_full: (a: number, b: number) => [number, number];
  readonly resumir_texto: (a: number, b: number, c: number) => [number, number];
  readonly sanitizar_texto: (a: number, b: number) => [number, number];
  readonly sentimiento_espanol: (a: number, b: number) => [number, number];
  readonly similitud_coseno: (a: number, b: number, c: number, d: number) => number;
  readonly wasm_version: () => number;
  readonly resumir_tfidf: (a: number, b: number, c: number) => [number, number];
  readonly now_us: () => number;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
