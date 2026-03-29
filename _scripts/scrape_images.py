#!/usr/bin/env python3
"""Scrape product images from saniadmina.com WooCommerce product pages."""

import urllib.request
import urllib.error
import re
import json
import time
import sys

# Map of (slug → (handle, color))
VARIANT_MAP = {
    "carla-7-black-leather":                    ("carla-7",               "Black"),
    "elena-beige-leather":                      ("elena",                 "Beige"),
    "elena-black-suede":                        ("elena",                 "Black"),
    "elena-blue-suede":                         ("elena",                 "Blue"),
    "elena-glitter-black":                      ("elena",                 "Glitter Black"),
    "elena-glitter-silver":                     ("elena",                 "Glitter Silver"),
    "elena-green-suede":                        ("elena",                 "Green"),
    "elena-ivory-pearl":                        ("elena",                 "Ivory Pearl"),
    "elena-patent-black":                       ("elena",                 "Patent Black"),
    "elena-patent-bordeaux":                    ("elena",                 "Patent Bordeaux"),
    "elena-perforated-beige-suede":             ("elena",                 "Perforated Beige"),
    "elena-perforated-nougat":                  ("elena",                 "Perforated Nougat"),
    "elena-pistachio-suede":                    ("elena",                 "Pistachio"),
    "elena-red-suede":                          ("elena",                 "Red"),
    "elena-white-leather":                      ("elena",                 "White"),
    "perlino-black-leather":                    ("perlino",               "Black"),
    "perlino-ivory-leather":                    ("perlino",               "Ivory"),
    "perlino-pink-suede":                       ("perlino",               "Pink"),
    "gianna-glitter-gold":                      ("gianna",                "Glitter Gold"),
    "gianna-glitter-green-black":               ("gianna",                "Glitter Green Black"),
    "gianna-glitter-pink":                      ("gianna",                "Glitter Pink"),
    "dun-black-suede":                          ("dun",                   "Black"),
    "dun-ivory-suede":                          ("dun",                   "Ivory"),
    "yuna-black-leather":                       ("yuna",                  "Black"),
    "yuna-brown-leather":                       ("yuna",                  "Brown"),
    "yuna-ivory-leather":                       ("yuna",                  "Ivory"),
    "bondi-black-leather":                      ("bondi",                 "Black"),
    "bondi-brick-red-leather":                  ("bondi",                 "Brick Red"),
    "bondi-green-metallic-leather":             ("bondi",                 "Green Metallic"),
    "bondi-ivory-leather":                      ("bondi",                 "Ivory"),
    "bondi-nougat-leather":                     ("bondi",                 "Nougat"),
    "bondi-silver-metallic-leather":            ("bondi",                 "Silver Metallic"),
    "venus-black-leather":                      ("venus",                 "Black"),
    "venus-gold-metallic-leather":              ("venus",                 "Gold Metallic"),
    "venus-ivory-leather":                      ("venus",                 "Ivory"),
    "venus-red-suede":                          ("venus",                 "Red"),
    "venus-silver-metallic-leather":            ("venus",                 "Silver Metallic"),
    "venus-vintage-brown":                      ("venus",                 "Vintage Brown"),
    "avenue-high-black-leather":                ("avenue-high",           "Black"),
    "avenue-high-brown-leather":                ("avenue-high",           "Brown"),
    "avenue-high-glitter-black":                ("avenue-high",           "Glitter Black"),
    "avenue-high-glitter-silver":               ("avenue-high",           "Glitter Silver"),
    "avenue-high-grey-suede":                   ("avenue-high",           "Grey"),
    "avenue-mid-black-leather":                 ("avenue-mid",            "Black"),
    "avenue-mid-brown-leather":                 ("avenue-mid",            "Brown"),
    "avenue-mid-grey-leather":                  ("avenue-mid",            "Grey"),
    "avenue-high-wide-shaft-black-leather":     ("avenue-high-wide-shaft","Black"),
    "avenue-high-wide-shaft-brown-leather":     ("avenue-high-wide-shaft","Brown"),
    "avenue-high-wide-shaft-glitter-black":     ("avenue-high-wide-shaft","Glitter Black"),
    "avenue-high-wide-shaft-glitter-silver":    ("avenue-high-wide-shaft","Glitter Silver"),
    "avenue-high-wide-shaft-grey-suede":        ("avenue-high-wide-shaft","Grey"),
    "avenue-mid-wide-shaft-black-leather":      ("avenue-mid-wide-shaft", "Black"),
    "avenue-mid-wide-shaft-brown-leather":      ("avenue-mid-wide-shaft", "Brown"),
    "avenue-mid-wide-shaft-grey-leather":       ("avenue-mid-wide-shaft", "Grey"),
    "cher-black-leather":                       ("cher",                  "Black"),
    "cher-black-snake-print":                   ("cher",                  "Black Snake Print"),
    "roe-black-leather":                        ("roe",                   "Black"),
}

def fetch_page(url, retries=3):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    req = urllib.request.Request(url, headers=headers)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise e

def extract_images(html, url):
    images = []

    # Strategy 1: data-large_image attributes (WooCommerce gallery)
    large_imgs = re.findall(r'data-large_image=["\']([^"\']+)["\']', html)
    for img in large_imgs:
        if "wp-content/uploads" in img and not is_thumbnail(img):
            images.append(img)

    # Strategy 2: data-src / src inside .woocommerce-product-gallery__image
    # Find gallery sections and pull full-size URLs
    gallery_section = re.findall(
        r'woocommerce-product-gallery__image[^>]*>.*?</div>',
        html, re.DOTALL
    )

    # Strategy 3: All wp-content/uploads full-size images in <img> tags
    all_imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
    for img in all_imgs:
        if "wp-content/uploads" in img and not is_thumbnail(img):
            images.append(img)

    # Strategy 4: data-src (lazy loading)
    lazy_imgs = re.findall(r'data-src=["\']([^"\']+)["\']', html)
    for img in lazy_imgs:
        if "wp-content/uploads" in img and not is_thumbnail(img):
            images.append(img)

    # Strategy 5: srcset — pick the largest version
    srcsets = re.findall(r'srcset=["\']([^"\']+)["\']', html)
    for srcset in srcsets:
        entries = srcset.split(",")
        for entry in entries:
            parts = entry.strip().split()
            if parts:
                img = parts[0]
                if "wp-content/uploads" in img and not is_thumbnail(img):
                    images.append(img)

    # Strategy 6: href links to full images
    hrefs = re.findall(r'href=["\']([^"\']+\.(jpg|jpeg|png|webp))["\']', html, re.IGNORECASE)
    for img, _ in hrefs:
        if "wp-content/uploads" in img and not is_thumbnail(img):
            images.append(img)

    # Strategy 7: JSON data embedded (WooCommerce stores gallery data as JSON)
    json_imgs = re.findall(r'"full":\["([^"]+)"', html)
    for img in json_imgs:
        img = img.replace("\\/", "/")
        if "wp-content/uploads" in img and not is_thumbnail(img):
            images.append(img)

    # Also look for woocommerce_single_product_params or similar JSON blobs
    json_blobs = re.findall(r'var\s+\w+\s*=\s*(\{[^;]+\});', html)
    for blob in json_blobs:
        found = re.findall(r'https?://[^"\']+wp-content/uploads/[^"\']+\.(?:jpg|jpeg|png|webp)', blob, re.IGNORECASE)
        for img in found:
            if not is_thumbnail(img):
                images.append(img)

    # Deduplicate while preserving order, and clean URLs
    # Known non-product images to exclude
    EXCLUDE_PATTERNS = [
        "cropped-logo",
        "logo_white",
        "/logo",
        "favicon",
        "placeholder",
        "about-sania-dmina",
    ]

    seen = set()
    result = []
    for img in images:
        # Clean up escaped slashes
        img = img.replace("\\/", "/").replace("&amp;", "&")
        # Strip query strings for dedup key
        base = img.split("?")[0]
        # Skip non-product images
        if any(pat in base for pat in EXCLUDE_PATTERNS):
            continue
        if base not in seen:
            seen.add(base)
            result.append(base)

    return result

def is_thumbnail(url):
    """Return True if the URL looks like a WP thumbnail (e.g. -300x300.jpg)."""
    return bool(re.search(r'-\d+x\d+\.(jpg|jpeg|png|webp)$', url, re.IGNORECASE))

def slug_from_url(url):
    """Extract the product slug from a URL like .../product/slug/"""
    m = re.search(r'/product/([^/]+)/?$', url)
    return m.group(1) if m else None

def main():
    urls = [
        "https://www.saniadmina.com/product/carla-7-black-leather/",
        "https://www.saniadmina.com/product/elena-beige-leather/",
        "https://www.saniadmina.com/product/elena-black-suede/",
        "https://www.saniadmina.com/product/elena-blue-suede/",
        "https://www.saniadmina.com/product/elena-glitter-black/",
        "https://www.saniadmina.com/product/elena-glitter-silver/",
        "https://www.saniadmina.com/product/elena-green-suede/",
        "https://www.saniadmina.com/product/elena-ivory-pearl/",
        "https://www.saniadmina.com/product/elena-patent-black/",
        "https://www.saniadmina.com/product/elena-patent-bordeaux/",
        "https://www.saniadmina.com/product/elena-perforated-beige-suede/",
        "https://www.saniadmina.com/product/elena-perforated-nougat/",
        "https://www.saniadmina.com/product/elena-pistachio-suede/",
        "https://www.saniadmina.com/product/elena-red-suede/",
        "https://www.saniadmina.com/product/elena-white-leather/",
        "https://www.saniadmina.com/product/perlino-black-leather/",
        "https://www.saniadmina.com/product/perlino-ivory-leather/",
        "https://www.saniadmina.com/product/perlino-pink-suede/",
        "https://www.saniadmina.com/product/gianna-glitter-gold/",
        "https://www.saniadmina.com/product/gianna-glitter-green-black/",
        "https://www.saniadmina.com/product/gianna-glitter-pink/",
        "https://www.saniadmina.com/product/dun-black-suede/",
        "https://www.saniadmina.com/product/dun-ivory-suede/",
        "https://www.saniadmina.com/product/yuna-black-leather/",
        "https://www.saniadmina.com/product/yuna-brown-leather/",
        "https://www.saniadmina.com/product/yuna-ivory-leather/",
        "https://www.saniadmina.com/product/bondi-black-leather/",
        "https://www.saniadmina.com/product/bondi-brick-red-leather/",
        "https://www.saniadmina.com/product/bondi-green-metallic-leather/",
        "https://www.saniadmina.com/product/bondi-ivory-leather/",
        "https://www.saniadmina.com/product/bondi-nougat-leather/",
        "https://www.saniadmina.com/product/bondi-silver-metallic-leather/",
        "https://www.saniadmina.com/product/venus-black-leather/",
        "https://www.saniadmina.com/product/venus-gold-metallic-leather/",
        "https://www.saniadmina.com/product/venus-ivory-leather/",
        "https://www.saniadmina.com/product/venus-red-suede/",
        "https://www.saniadmina.com/product/venus-silver-metallic-leather/",
        "https://www.saniadmina.com/product/venus-vintage-brown/",
        "https://www.saniadmina.com/product/avenue-high-black-leather/",
        "https://www.saniadmina.com/product/avenue-high-brown-leather/",
        "https://www.saniadmina.com/product/avenue-high-glitter-black/",
        "https://www.saniadmina.com/product/avenue-high-glitter-silver/",
        "https://www.saniadmina.com/product/avenue-high-grey-suede/",
        "https://www.saniadmina.com/product/avenue-mid-black-leather/",
        "https://www.saniadmina.com/product/avenue-mid-brown-leather/",
        "https://www.saniadmina.com/product/avenue-mid-grey-leather/",
        "https://www.saniadmina.com/product/avenue-high-wide-shaft-black-leather/",
        "https://www.saniadmina.com/product/avenue-high-wide-shaft-brown-leather/",
        "https://www.saniadmina.com/product/avenue-high-wide-shaft-glitter-black/",
        "https://www.saniadmina.com/product/avenue-high-wide-shaft-glitter-silver/",
        "https://www.saniadmina.com/product/avenue-high-wide-shaft-grey-suede/",
        "https://www.saniadmina.com/product/avenue-mid-wide-shaft-black-leather/",
        "https://www.saniadmina.com/product/avenue-mid-wide-shaft-brown-leather/",
        "https://www.saniadmina.com/product/avenue-mid-wide-shaft-grey-leather/",
        "https://www.saniadmina.com/product/cher-black-leather/",
        "https://www.saniadmina.com/product/cher-black-snake-print/",
        "https://www.saniadmina.com/product/roe-black-leather/",
    ]

    results = {}
    errors = []

    for i, url in enumerate(urls, 1):
        slug = slug_from_url(url)
        if slug not in VARIANT_MAP:
            print(f"[WARN] Unknown slug: {slug}", file=sys.stderr)
            continue

        handle, color = VARIANT_MAP[slug]
        key = (handle, color)

        print(f"[{i:02d}/{len(urls)}] Fetching {slug}...", file=sys.stderr)

        try:
            html = fetch_page(url)
            imgs = extract_images(html, url)
            results[key] = imgs
            print(f"         → {len(imgs)} images found", file=sys.stderr)
        except Exception as e:
            print(f"         ERROR: {e}", file=sys.stderr)
            errors.append((slug, str(e)))
            results[key] = []

        # Be polite
        time.sleep(0.5)

    # Print Python dict literal
    print("\n# ============================================================")
    print("# SCRAPED IMAGE MAP")
    print("# ============================================================")
    print("{")
    for (handle, color), imgs in results.items():
        print(f'    ("{handle}", "{color}"): [')
        for img in imgs:
            print(f'        "{img}",')
        print(f'    ],')
    print("}")

    if errors:
        print(f"\n# ERRORS ({len(errors)} variants failed):", file=sys.stderr)
        for slug, err in errors:
            print(f"#   {slug}: {err}", file=sys.stderr)

if __name__ == "__main__":
    main()
