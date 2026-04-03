from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0002_cliente_opcional'),
    ]

    operations = [
        migrations.AddField(
            model_name='venta',
            name='tarjeta_codigo_autorizacion',
            field=models.CharField(blank=True, default='', help_text='Código de autorización informado por el posnet para pagos con tarjeta', max_length=50, verbose_name='Código de autorización tarjeta'),
        ),
        migrations.AddField(
            model_name='venta',
            name='tarjeta_cupon_numero',
            field=models.CharField(blank=True, default='', help_text='Número de cupón/comprobante del posnet para pagos con tarjeta', max_length=50, verbose_name='Número de cupón tarjeta'),
        ),
    ]
