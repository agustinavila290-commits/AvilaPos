from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0003_venta_tarjeta_manual_datos'),
    ]

    operations = [
        migrations.AlterField(
            model_name='venta',
            name='tarjeta_codigo_autorizacion',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Código(s) de autorización informados por el posnet para pagos con tarjeta',
                verbose_name='Código de autorización tarjeta',
            ),
        ),
        migrations.AlterField(
            model_name='venta',
            name='tarjeta_cupon_numero',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Número(s) de cupón/comprobante del posnet para pagos con tarjeta',
                verbose_name='Número de cupón tarjeta',
            ),
        ),
    ]
