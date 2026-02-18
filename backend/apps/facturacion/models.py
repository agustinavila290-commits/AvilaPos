from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from decimal import Decimal
from apps.clientes.models import Cliente
from apps.ventas.models import Venta


class PuntoVenta(models.Model):
    """
    Punto de venta AFIP
    """
    numero = models.IntegerField(
        unique=True,
        validators=[MinValueValidator(1)],
        verbose_name='Número de Punto de Venta',
        help_text='Número de punto de venta registrado en AFIP (ej: 1, 2, 3)'
    )
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    # Últimos números de comprobante por tipo
    ultimo_numero_factura_a = models.IntegerField(default=0)
    ultimo_numero_factura_b = models.IntegerField(default=0)
    ultimo_numero_factura_c = models.IntegerField(default=0)
    ultimo_numero_nota_credito_a = models.IntegerField(default=0)
    ultimo_numero_nota_credito_b = models.IntegerField(default=0)
    ultimo_numero_nota_credito_c = models.IntegerField(default=0)
    ultimo_numero_presupuesto = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = 'Punto de Venta'
        verbose_name_plural = 'Puntos de Venta'
        ordering = ['numero']
    
    def __str__(self):
        return f"PV {self.numero:04d} - {self.nombre}"


class Factura(models.Model):
    """
    Factura Electrónica AFIP
    """
    
    class TipoComprobante(models.TextChoices):
        FACTURA_A = 'FA', 'Factura A'
        FACTURA_B = 'FB', 'Factura B'
        FACTURA_C = 'FC', 'Factura C'
        NOTA_CREDITO_A = 'NCA', 'Nota de Crédito A'
        NOTA_CREDITO_B = 'NCB', 'Nota de Crédito B'
        NOTA_CREDITO_C = 'NCC', 'Nota de Crédito C'
        PRESUPUESTO = 'PRE', 'Presupuesto'
    
    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        AUTORIZADA = 'AUTORIZADA', 'Autorizada'
        RECHAZADA = 'RECHAZADA', 'Rechazada'
        ANULADA = 'ANULADA', 'Anulada'
    
    class CondicionIVA(models.TextChoices):
        RESPONSABLE_INSCRIPTO = 'RI', 'Responsable Inscripto'
        MONOTRIBUTISTA = 'MT', 'Monotributista'
        EXENTO = 'EX', 'Exento'
        CONSUMIDOR_FINAL = 'CF', 'Consumidor Final'
    
    # Identificación del comprobante
    tipo_comprobante = models.CharField(
        max_length=3,
        choices=TipoComprobante.choices,
        verbose_name='Tipo de Comprobante'
    )
    punto_venta = models.ForeignKey(
        PuntoVenta,
        on_delete=models.PROTECT,
        related_name='facturas',
        verbose_name='Punto de Venta'
    )
    numero = models.IntegerField(
        verbose_name='Número',
        help_text='Número de comprobante'
    )
    
    # Datos de emisión
    fecha_emision = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de Emisión'
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vencimiento'
    )
    
    # Cliente
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT,
        related_name='facturas',
        verbose_name='Cliente'
    )
    cliente_razon_social = models.CharField(
        max_length=255,
        verbose_name='Razón Social'
    )
    cliente_cuit = models.CharField(
        max_length=13,
        verbose_name='CUIT/CUIL/DNI'
    )
    cliente_condicion_iva = models.CharField(
        max_length=2,
        choices=CondicionIVA.choices,
        verbose_name='Condición IVA'
    )
    cliente_domicilio = models.TextField(
        verbose_name='Domicilio',
        blank=True
    )
    
    # Venta asociada (opcional, puede ser una factura sin venta previa)
    venta = models.ForeignKey(
        Venta,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name='Venta Asociada'
    )
    
    # Usuario
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='facturas_emitidas',
        verbose_name='Usuario'
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.BORRADOR,
        verbose_name='Estado'
    )
    
    # Totales
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Subtotal (sin IVA)'
    )
    iva_105 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='IVA 10.5%'
    )
    iva_21 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='IVA 21%'
    )
    iva_27 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='IVA 27%'
    )
    otros_tributos = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Otros Tributos'
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Total'
    )
    
    # Datos AFIP
    cae = models.CharField(
        max_length=14,
        blank=True,
        verbose_name='CAE',
        help_text='Código de Autorización Electrónico'
    )
    cae_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Vencimiento CAE'
    )
    fecha_proceso_afip = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha Proceso AFIP'
    )
    resultado_afip = models.CharField(
        max_length=1,
        blank=True,
        help_text='A=Aprobado, R=Rechazado'
    )
    observaciones_afip = models.TextField(
        blank=True,
        verbose_name='Observaciones AFIP'
    )
    
    # QR Code (datos para generar)
    qr_data = models.TextField(
        blank=True,
        verbose_name='Datos QR',
        help_text='Datos para generar código QR'
    )
    
    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    
    # Timestamps
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    fecha_modificacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de Modificación'
    )
    
    class Meta:
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'
        ordering = ['-fecha_emision', '-numero']
        unique_together = [['punto_venta', 'tipo_comprobante', 'numero']]
        indexes = [
            models.Index(fields=['fecha_emision']),
            models.Index(fields=['cliente', 'fecha_emision']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        return f"{self.get_tipo_comprobante_display()} {self.punto_venta.numero:04d}-{self.numero:08d}"
    
    @property
    def numero_completo(self):
        """Retorna el número completo del comprobante"""
        return f"{self.punto_venta.numero:04d}-{self.numero:08d}"
    
    def calcular_totales(self):
        """Calcula los totales de la factura desde los ítems"""
        items = self.items.all()
        
        self.subtotal = sum(item.subtotal for item in items)
        self.iva_105 = sum(item.iva_105 for item in items)
        self.iva_21 = sum(item.iva_21 for item in items)
        self.iva_27 = sum(item.iva_27 for item in items)
        self.total = self.subtotal + self.iva_105 + self.iva_21 + self.iva_27 + self.otros_tributos


class ItemFactura(models.Model):
    """
    Ítem/Línea de una factura
    """
    
    class AlicuotaIVA(models.TextChoices):
        IVA_0 = '0', '0% (Exento)'
        IVA_105 = '10.5', '10.5%'
        IVA_21 = '21', '21%'
        IVA_27 = '27', '27%'
    
    factura = models.ForeignKey(
        Factura,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Factura'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden'
    )
    
    # Producto/Servicio
    codigo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Código'
    )
    descripcion = models.TextField(
        verbose_name='Descripción'
    )
    
    # Cantidades y precios
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Cantidad'
    )
    precio_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Precio Unitario'
    )
    alicuota_iva = models.CharField(
        max_length=5,
        choices=AlicuotaIVA.choices,
        default=AlicuotaIVA.IVA_21,
        verbose_name='Alícuota IVA'
    )
    
    # Cálculos
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Subtotal'
    )
    iva_105 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='IVA 10.5%'
    )
    iva_21 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='IVA 21%'
    )
    iva_27 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='IVA 27%'
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Total'
    )
    
    class Meta:
        verbose_name = 'Ítem de Factura'
        verbose_name_plural = 'Ítems de Factura'
        ordering = ['factura', 'orden']
    
    def __str__(self):
        return f"{self.descripcion} x {self.cantidad}"
    
    def calcular_importes(self):
        """Calcula subtotal, IVA y total del ítem"""
        self.subtotal = self.cantidad * self.precio_unitario
        
        # Resetear IVAs
        self.iva_105 = Decimal('0.00')
        self.iva_21 = Decimal('0.00')
        self.iva_27 = Decimal('0.00')
        
        # Calcular IVA según alícuota
        if self.alicuota_iva == '10.5':
            self.iva_105 = self.subtotal * Decimal('0.105')
        elif self.alicuota_iva == '21':
            self.iva_21 = self.subtotal * Decimal('0.21')
        elif self.alicuota_iva == '27':
            self.iva_27 = self.subtotal * Decimal('0.27')
        
        self.total = self.subtotal + self.iva_105 + self.iva_21 + self.iva_27
    
    def save(self, *args, **kwargs):
        """Override save para calcular automáticamente"""
        self.calcular_importes()
        super().save(*args, **kwargs)


class ConfiguracionAFIP(models.Model):
    """
    Configuración para integración con AFIP
    Singleton: solo debe haber un registro
    """
    
    class Ambiente(models.TextChoices):
        HOMOLOGACION = 'H', 'Homologación (Testing)'
        PRODUCCION = 'P', 'Producción'
    
    # Datos del contribuyente
    cuit_emisor = models.CharField(
        max_length=11,
        verbose_name='CUIT del Emisor',
        help_text='CUIT sin guiones (11 dígitos)'
    )
    razon_social = models.CharField(
        max_length=255,
        verbose_name='Razón Social'
    )
    domicilio_comercial = models.TextField(
        verbose_name='Domicilio Comercial'
    )
    condicion_iva = models.CharField(
        max_length=2,
        choices=Factura.CondicionIVA.choices,
        default=Factura.CondicionIVA.RESPONSABLE_INSCRIPTO,
        verbose_name='Condición IVA'
    )
    inicio_actividades = models.DateField(
        verbose_name='Inicio de Actividades'
    )
    
    # Configuración AFIP
    ambiente = models.CharField(
        max_length=1,
        choices=Ambiente.choices,
        default=Ambiente.HOMOLOGACION,
        verbose_name='Ambiente AFIP'
    )
    
    # Certificado y clave privada (rutas o contenido)
    certificado = models.TextField(
        blank=True,
        verbose_name='Certificado (.crt)',
        help_text='Contenido del certificado o ruta al archivo'
    )
    clave_privada = models.TextField(
        blank=True,
        verbose_name='Clave Privada (.key)',
        help_text='Contenido de la clave privada o ruta al archivo'
    )
    
    # Token y Sign (se generan automáticamente)
    token = models.TextField(
        blank=True,
        verbose_name='Token AFIP'
    )
    sign = models.TextField(
        blank=True,
        verbose_name='Sign AFIP'
    )
    token_expiracion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Expiración del Token'
    )
    
    # Configuración adicional
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    
    class Meta:
        verbose_name = 'Configuración AFIP'
        verbose_name_plural = 'Configuración AFIP'
    
    def __str__(self):
        return f"Config AFIP - {self.cuit_emisor}"
    
    def save(self, *args, **kwargs):
        """Singleton: eliminar otros registros"""
        if not self.pk and ConfiguracionAFIP.objects.exists():
            # Si es nuevo y ya existe uno, eliminar los anteriores
            ConfiguracionAFIP.objects.all().delete()
        super().save(*args, **kwargs)
