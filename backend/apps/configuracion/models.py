"""
Modelos para configuración del sistema.
Parámetros configurables sin modificar código.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


class Configuracion(models.Model):
    """
    Modelo para almacenar parámetros de configuración del sistema.
    Cada parámetro tiene una clave única y un valor.
    """
    
    class TipoDato(models.TextChoices):
        INTEGER = 'INTEGER', 'Entero'
        DECIMAL = 'DECIMAL', 'Decimal'
        BOOLEAN = 'BOOLEAN', 'Booleano'
        STRING = 'STRING', 'Texto'
    
    clave = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Clave',
        help_text='Identificador único del parámetro'
    )
    
    valor = models.CharField(
        max_length=255,
        verbose_name='Valor',
        help_text='Valor del parámetro (se convierte según tipo_dato)'
    )
    
    tipo_dato = models.CharField(
        max_length=10,
        choices=TipoDato.choices,
        default=TipoDato.STRING,
        verbose_name='Tipo de Dato'
    )
    
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción del parámetro y su uso'
    )
    
    categoria = models.CharField(
        max_length=50,
        verbose_name='Categoría',
        help_text='Categoría del parámetro (ej: INVENTARIO, VENTAS, etc.)'
    )
    
    es_editable = models.BooleanField(
        default=True,
        verbose_name='Es Editable',
        help_text='Indica si el parámetro puede ser modificado desde la interfaz'
    )
    
    fecha_modificacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Modificación'
    )
    
    class Meta:
        verbose_name = 'Configuración'
        verbose_name_plural = 'Configuraciones'
        ordering = ['categoria', 'clave']
        indexes = [
            models.Index(fields=['clave']),
            models.Index(fields=['categoria']),
        ]
    
    def __str__(self):
        return f"{self.clave} = {self.valor}"
    
    def get_valor_convertido(self):
        """
        Convierte el valor almacenado según el tipo de dato.
        """
        if self.tipo_dato == self.TipoDato.INTEGER:
            return int(self.valor)
        elif self.tipo_dato == self.TipoDato.DECIMAL:
            from decimal import Decimal
            return Decimal(self.valor)
        elif self.tipo_dato == self.TipoDato.BOOLEAN:
            return self.valor.lower() in ('true', '1', 'yes', 'si', 'verdadero')
        else:  # STRING
            return self.valor
    
    def set_valor_desde_tipo(self, valor):
        """
        Asigna el valor convirtiéndolo a string según el tipo.
        """
        if self.tipo_dato == self.TipoDato.BOOLEAN:
            self.valor = 'true' if valor else 'false'
        else:
            self.valor = str(valor)
    
    def clean(self):
        """
        Validaciones personalizadas.
        """
        # Validar que el valor sea convertible al tipo especificado
        try:
            if self.tipo_dato == self.TipoDato.INTEGER:
                int(self.valor)
            elif self.tipo_dato == self.TipoDato.DECIMAL:
                from decimal import Decimal
                Decimal(self.valor)
            elif self.tipo_dato == self.TipoDato.BOOLEAN:
                if self.valor.lower() not in ('true', 'false', '1', '0', 'yes', 'no', 'si'):
                    raise ValidationError(
                        {'valor': 'Para tipo BOOLEAN, usar: true/false, 1/0, yes/no, si/no'}
                    )
        except (ValueError, TypeError):
            raise ValidationError(
                {'valor': f'El valor no es válido para el tipo {self.get_tipo_dato_display()}'}
            )


class ConfiguracionManager:
    """
    Manager para facilitar el acceso a las configuraciones.
    """
    
    @staticmethod
    def obtener(clave, default=None):
        """
        Obtiene el valor de una configuración.
        Retorna el valor convertido o el default si no existe.
        """
        try:
            config = Configuracion.objects.get(clave=clave)
            return config.get_valor_convertido()
        except Configuracion.DoesNotExist:
            return default
    
    @staticmethod
    def establecer(clave, valor, crear_si_no_existe=False):
        """
        Establece el valor de una configuración.
        """
        try:
            config = Configuracion.objects.get(clave=clave)
            config.set_valor_desde_tipo(valor)
            config.save()
            return config
        except Configuracion.DoesNotExist:
            if crear_si_no_existe:
                # Intentar determinar el tipo automáticamente
                if isinstance(valor, bool):
                    tipo_dato = Configuracion.TipoDato.BOOLEAN
                elif isinstance(valor, int):
                    tipo_dato = Configuracion.TipoDato.INTEGER
                elif isinstance(valor, float):
                    tipo_dato = Configuracion.TipoDato.DECIMAL
                else:
                    tipo_dato = Configuracion.TipoDato.STRING
                
                config = Configuracion.objects.create(
                    clave=clave,
                    valor=str(valor),
                    tipo_dato=tipo_dato,
                    descripcion=f'Parámetro {clave}',
                    categoria='GENERAL'
                )
                return config
            else:
                raise
    
    @staticmethod
    def obtener_por_categoria(categoria):
        """
        Obtiene todas las configuraciones de una categoría.
        """
        configs = Configuracion.objects.filter(categoria=categoria)
        return {
            config.clave: config.get_valor_convertido()
            for config in configs
        }
