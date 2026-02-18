# Generated manually - agrega columna precio_tarjeta

from decimal import Decimal
from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='varianteproducto',
            name='precio_tarjeta',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0.00'),
                help_text='Precio de venta con tarjeta de crédito/débito',
                max_digits=10,
                validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
                verbose_name='Precio Tarjeta'
            ),
            preserve_default=True,
        ),
    ]
