import math
from collections import Counter


def build_text(row):
    return " ".join(
        str(row.get(field, "") or "")
        for field in ["title", "category", "attributes", "style", "scene", "material", "price_segment"]
    )


def char_ngrams(text, min_n=2, max_n=4):
    text = str(text).lower().replace(" ", "")
    tokens = []
    for n in range(min_n, max_n + 1):
        tokens.extend(text[i : i + n] for i in range(max(0, len(text) - n + 1)))
    return tokens


def vectorize(text):
    return Counter(char_ngrams(text))


def cosine(left, right):
    if not left or not right:
        return 0.0
    common = set(left) & set(right)
    dot = sum(left[token] * right[token] for token in common)
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))
    if not left_norm or not right_norm:
        return 0.0
    return dot / (left_norm * right_norm)


def fit_embeddings(market_rows, sku_rows):
    market_texts = [build_text(row) for row in market_rows]
    sku_texts = [build_text(row) for row in sku_rows]
    return [vectorize(text) for text in market_texts], [vectorize(text) for text in sku_texts]


def similarity_matrix(sku_vectors, market_vectors):
    return [[cosine(sku_vector, market_vector) for market_vector in market_vectors] for sku_vector in sku_vectors]
