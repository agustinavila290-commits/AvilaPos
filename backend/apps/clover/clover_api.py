"""
Cliente para la API REST de Clover (REST Pay Display / Cloud Pay Display).
Documentación: https://docs.clover.com/dev/docs/rest-pay-overview
"""
import time
import requests
from decimal import Decimal


class CloverAPIError(Exception):
    """Error en la comunicación con la API de Clover."""
    pass


class CloverAPIClient:
    """
    Cliente para la API de Clover.
    Montos se envían en centavos (entero).
    """

    def __init__(self, merchant_id, access_token, base_url, timeout=15):
        self.merchant_id = merchant_id
        self.access_token = access_token
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self._session = requests.Session()
        self._session.headers.update({
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        })

    def _request(self, method, path, json_data=None):
        url = f"{self.base_url}{path}"
        try:
            if method == 'GET':
                r = self._session.get(url, timeout=self.timeout)
            else:
                r = self._session.post(url, json=json_data or {}, timeout=self.timeout)
            r.raise_for_status()
            return r.json() if r.content else {}
        except requests.exceptions.Timeout:
            raise CloverAPIError('Timeout al conectar con Clover. Verifique red y dispositivo.')
        except requests.exceptions.ConnectionError as e:
            raise CloverAPIError(f'No se pudo conectar con Clover: {e}')
        except requests.exceptions.HTTPError as e:
            msg = 'Error Clover'
            if e.response is not None and hasattr(e.response, 'text'):
                msg = e.response.text[:200] if e.response.text else str(e)
            raise CloverAPIError(msg)
        except ValueError:
            raise CloverAPIError('Respuesta inválida de Clover')

    def create_order(self, total_cents, title='Venta'):
        """
        Crea una orden en Clover.
        total_cents: monto en centavos (ej: 150000 = $1500.00)
        """
        path = f'/v3/merchants/{self.merchant_id}/orders'
        data = {
            'total': int(total_cents),
            'title': str(title)[:100],
        }
        resp = self._request('POST', path, data)
        return resp.get('id')

    def create_payment(self, order_id, amount_cents, external_id=None):
        """
        Crea un pago asociado a la orden. El dispositivo Clover muestra el monto.
        amount_cents: monto en centavos.
        """
        path = f'/v3/merchants/{self.merchant_id}/orders/{order_id}/payments'
        data = {
            'amount': int(amount_cents),
        }
        if external_id:
            data['externalPaymentId'] = str(external_id)[:100]
        resp = self._request('POST', path, data)
        return resp.get('id')

    def get_payment(self, payment_id):
        """Obtiene el estado actual de un pago."""
        path = f'/v3/merchants/{self.merchant_id}/payments/{payment_id}'
        return self._request('GET', path)

    def wait_for_payment_result(self, payment_id, timeout_seconds=120, poll_interval=1.5):
        """
        Espera hasta que el pago tenga resultado (APPROVED, DECLINED, CANCELLED) o timeout.
        Devuelve el dict completo del pago.
        """
        start = time.time()
        while (time.time() - start) < timeout_seconds:
            payment = self.get_payment(payment_id)
            result = payment.get('result')
            if result in ('APPROVED', 'DECLINED', 'CANCELLED'):
                return payment
            time.sleep(poll_interval)
        raise CloverAPIError('Tiempo de espera agotado. El cliente no completó el pago en el dispositivo.')
