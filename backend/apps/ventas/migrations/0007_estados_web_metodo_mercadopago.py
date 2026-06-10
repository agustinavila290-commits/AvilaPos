from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0006_presupuesto_models'),
    ]

    operations = [
        migrations.AlterField(
            model_name='venta',
            name='metodo_pago',
            field=models.CharField(
                choices=[
                    ('EFECTIVO', 'Efectivo'),
                    ('TRANSFERENCIA', 'Transferencia'),
                    ('TARJETA', 'Tarjeta'),
                    ('MERCADOPAGO', 'Mercado Pago'),
                ],
                max_length=20,
                verbose_name='Método de Pago',
            ),
        ),
        migrations.AlterField(
            model_name='venta',
            name='estado',
            field=models.CharField(
                choices=[
                    ('COMPLETADA', 'Completada'),
                    ('ANULADA', 'Anulada'),
                    ('PENDIENTE_PAGO', 'Pendiente de pago'),
                    ('PAGO_CONFIRMADO', 'Pago confirmado'),
                    ('EN_PREPARACION', 'En preparación'),
                    ('ENVIADO', 'Enviado'),
                    ('ENTREGADO', 'Entregado'),
                ],
                default='COMPLETADA',
                max_length=20,
                verbose_name='Estado',
            ),
        ),
    ]
