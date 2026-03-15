"""
Verificación de la integración WooCommerce contra el backend (producción o staging).

Uso:
  cd backend
  python scripts/verificar_woocommerce_produccion.py <URL_BASE> <API_KEY>

  Ejemplo:
  python scripts/verificar_woocommerce_produccion.py https://api.tudominio.com abc123-api-key

  Variables de entorno (opcionales):
  WOO_BASE_URL  = URL del backend (ej. https://api.tudominio.com)
  WOO_API_KEY   = Valor de WOOCOMMERCE_API_KEY

Si no pasás URL ni API_KEY por argumentos, se usan WOO_BASE_URL y WOO_API_KEY del entorno.
"""
import sys
import os
import json
import urllib.request
import urllib.error

def main():
    base_url = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get('WOO_BASE_URL', '')).rstrip('/')
    api_key = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('WOO_API_KEY', '')

    if not base_url or not api_key:
        print('Uso: python scripts/verificar_woocommerce_produccion.py <URL_BASE> <API_KEY>')
        print('  o bien: export WOO_BASE_URL=... WOO_API_KEY=... y ejecutar el script.')
        sys.exit(1)

    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    ok = True

    # 1) GET productos-stock
    try:
        req = urllib.request.Request(f'{base_url}/api/woocommerce/productos-stock/', headers=headers, method='GET')
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
            if not isinstance(data, list):
                print('[FAIL] GET productos-stock: respuesta no es lista')
                ok = False
            else:
                print(f'[OK] GET productos-stock: {len(data)} variantes con stock')
    except urllib.error.HTTPError as e:
        print(f'[FAIL] GET productos-stock: HTTP {e.code} - {e.reason}')
        if e.fp:
            try:
                body = e.fp.read().decode()
                print('  Body:', body[:300])
            except Exception:
                pass
        ok = False
    except Exception as e:
        print(f'[FAIL] GET productos-stock: {e}')
        ok = False

    # 2) POST pedido-recibido sin API key -> debe dar 401/403
    try:
        req = urllib.request.Request(
            f'{base_url}/api/woocommerce/pedido-recibido/',
            data=json.dumps({'line_items': []}).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            print('[FAIL] POST pedido-recibido sin API Key: esperado 401/403, obtuvo 2xx')
            ok = False
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            print('[OK] POST pedido-recibido sin API Key: 401/403 (auth requerida)')
        else:
            print(f'[FAIL] POST pedido-recibido sin API Key: esperado 401/403, obtuvo {e.code}')
            ok = False
    except Exception as e:
        print(f'[WARN] POST pedido-recibido sin API Key: {e}')

    # 3) POST pedido-recibido con API key, line_items vacío -> 400
    try:
        req = urllib.request.Request(
            f'{base_url}/api/woocommerce/pedido-recibido/',
            data=json.dumps({'line_items': []}).encode(),
            headers=headers,
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            print('[FAIL] POST pedido-recibido line_items vacío: esperado 400, obtuvo', r.status)
            ok = False
    except urllib.error.HTTPError as e:
        if e.code == 400:
            print('[OK] POST pedido-recibido line_items vacío: 400')
        else:
            print(f'[FAIL] POST pedido-recibido line_items vacío: esperado 400, obtuvo {e.code}')
            ok = False
    except Exception as e:
        print(f'[FAIL] POST pedido-recibido: {e}')
        ok = False

    # 4) POST webhook-pedido con API key, payload WooCommerce sin ítems válidos -> 400
    try:
        payload = {'id': 1, 'number': '1', 'line_items': []}
        req = urllib.request.Request(
            f'{base_url}/api/woocommerce/webhook-pedido/',
            data=json.dumps(payload).encode(),
            headers=headers,
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            print('[FAIL] POST webhook-pedido sin ítems: esperado 400, obtuvo', r.status)
            ok = False
    except urllib.error.HTTPError as e:
        if e.code == 400:
            print('[OK] POST webhook-pedido sin ítems: 400')
        else:
            print(f'[FAIL] POST webhook-pedido: esperado 400, obtuvo {e.code}')
            ok = False
    except Exception as e:
        print(f'[FAIL] POST webhook-pedido: {e}')
        ok = False

    if ok:
        print('\nVerificación WooCommerce: TODO OK')
        sys.exit(0)
    else:
        print('\nVerificación WooCommerce: ALGUNOS FALLOS')
        sys.exit(2)


if __name__ == '__main__':
    main()
