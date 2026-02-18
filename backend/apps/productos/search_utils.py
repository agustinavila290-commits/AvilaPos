"""
Utilidades de búsqueda para productos/variantes.
Permite encontrar por nombre con o sin tildes (ej: "CAMARA" encuentra "Cámara").
Búsqueda por palabras: "piston honda" encuentra "Pistón Honda CG 150".
"""

_VOWEL_ACCENT = {'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú'}


def search_term_variants(term):
    """
    Devuelve variantes del término para buscar con y sin tildes.
    Ej: "CAMARA" -> ["CAMARA", "camara", "Camara", "Cámara"]
    Para palabras cortas incluye variantes con una vocal acentuada.
    """
    if not term:
        return [term]
    term = term.strip()
    if not term:
        return [term]
    seen = set()
    out = []
    for s in (term, term.lower(), term.capitalize()):
        if s and s not in seen:
            seen.add(s)
            out.append(s)
    # Variantes con tilde en cada vocal (una por vez)
    cap = term.capitalize()
    for i, c in enumerate(cap):
        if c.lower() in _VOWEL_ACCENT:
            accented = cap[:i] + _VOWEL_ACCENT[c.lower()] + cap[i + 1:]
            if accented not in seen:
                seen.add(accented)
                out.append(accented)
    return out if out else [term]


def search_words(search_phrase, min_word_len=2):
    """
    Parte la frase en palabras (ignorando vacías y muy cortas si se desea).
    Útil para exigir que todas las palabras coincidan (AND).
    """
    if not search_phrase or not search_phrase.strip():
        return []
    words = [w.strip() for w in search_phrase.strip().split() if w.strip()]
    if min_word_len:
        words = [w for w in words if len(w) >= min_word_len]
    return words
