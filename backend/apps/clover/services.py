"""
Servicios para procesar pagos con Clover.
Usa CloverAPIClient y persiste el resultado en CloverPago.
"""
from decimal import Decimal
from .models import CloverConfig, CloverPago
from .clover_api import CloverAPIClient, CloverAPIError


class CloverPayService:
    """
    Servicio para procesar un pago con tarjeta vía Clover.
    Obtiene la config activa, crea orden + pago, espera respuesta y guarda CloverPago.
    """

    @staticmethod
    def get_config_activa():
        """Devuelve la primera configuración Clover activa o None."""
        return CloverConfig.objects.filter(activo=True).first()

    @staticmethod
    def procesar_pago(monto, descripcion='Venta', orden_id_externo=None):
        """
        Procesa un pago con Clover.

        Args:
            monto: Decimal o float, monto total a cobrar (ej: 1500.50)
            descripcion: texto para la orden
            orden_id_externo: opcional, para vincular con venta después

        Returns:
            dict: {
                'exito': bool,
                'payment_id': str | None,
                'estado': str,  # APPROVED, DECLINED, CANCELLED, ERROR
                'datos': dict,
                'error': str | None,
                'clover_pago_id': int | None  # id del registro CloverPago
            }
        """
        monto = Decimal(str(monto))
        if monto <= 0:
            return {
                'exito': False,
                'payment_id': None,
                'estado': CloverPago.EstadoPago.ERROR,
                'datos': {},
                'error': 'El monto debe ser mayor a cero.',
                'clover_pago_id': None,
            }

        config = CloverPayService.get_config_activa()
        if not config:
            return {
                'exito': False,
                'payment_id': None,
                'estado': CloverPago.EstadoPago.ERROR,
                'datos': {},
                'error': 'Clover no está configurado. Configure en Admin o Configuración.',
                'clover_pago_id': None,
            }

        # Monto en centavos para Clover
        amount_cents = int((monto * 100).quantize(Decimal('1')))

        client = CloverAPIClient(
            merchant_id=config.merchant_id,
            access_token=config.access_token,
            base_url=config.endpoint_url,
        )

        clover_pago = None
        try:
            order_id = client.create_order(amount_cents, title=descripcion)
            if not order_id:
                raise CloverAPIError('Clover no devolvió ID de orden.')

            payment_id = client.create_payment(
                order_id,
                amount_cents,
                external_id=orden_id_externo,
            )
            if not payment_id:
                raise CloverAPIError('Clover no devolvió ID de pago.')

            payment = client.wait_for_payment_result(payment_id)
            result = payment.get('result', 'ERROR')

            # Extraer datos para guardar
            card_info = payment.get('cardTransaction', {}) or {}
            metodo_tarjeta = card_info.get('cardType') or payment.get('tender', {}).get('label', '')
            ultimos_4 = ''
            if card_info.get('last4'):
                ultimos_4 = str(card_info.get('last4'))[-4:]
            elif payment.get('last4'):
                ultimos_4 = str(payment.get('last4'))[-4:]

            clover_pago = CloverPago.objects.create(
                clover_payment_id=payment_id,
                monto=monto,
                estado=result if result in dict(CloverPago.EstadoPago.choices) else CloverPago.EstadoPago.ERROR,
                metodo_tarjeta=metodo_tarjeta[:50],
                ultimos_4_digitos=ultimos_4[:4],
                datos_respuesta=payment,
                error_mensaje='' if result == 'APPROVED' else payment.get('message', '') or '',
            )

            return {
                'exito': result == 'APPROVED',
                'payment_id': payment_id,
                'estado': result,
                'datos': payment,
                'error': None if result == 'APPROVED' else (payment.get('message') or 'Pago rechazado o cancelado'),
                'clover_pago_id': clover_pago.id,
            }

        except CloverAPIError as e:
            clover_pago = CloverPago.objects.create(
                clover_payment_id=None,
                monto=monto,
                estado=CloverPago.EstadoPago.ERROR,
                metodo_tarjeta='',
                ultimos_4_digitos='',
                datos_respuesta={},
                error_mensaje=str(e),
            )
            return {
                'exito': False,
                'payment_id': None,
                'estado': CloverPago.EstadoPago.ERROR,
                'datos': {},
                'error': str(e),
                'clover_pago_id': clover_pago.id,
            }
