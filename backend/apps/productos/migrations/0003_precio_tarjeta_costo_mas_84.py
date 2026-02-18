# Precio tarjeta = costo + 84% (actualizar registros existentes)

from decimal import Decimal
from django.db import migrations


def actualizar_precio_tarjeta(apps, schema_editor):
    VarianteProducto = apps.get_model('productos', 'VarianteProducto')
    for v in VarianteProducto.objects.all():
        if v.costo is not None and v.costo >= 0:
            v.precio_tarjeta = (v.costo * Decimal('1.84')).quantize(Decimal('0.01'))
            v.save(update_fields=['precio_tarjeta'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0002_varianteproducto_precio_tarjeta'),
    ]

    operations = [
        migrations.RunPython(actualizar_precio_tarjeta, noop),
    ]
