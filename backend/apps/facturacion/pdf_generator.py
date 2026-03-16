"""
Generador de PDF para facturas
Usa ReportLab para generar PDFs con formato AFIP
Datos por defecto: Avila Moto Repuesto (si no hay ConfiguracionAFIP).
"""
from reportlab.lib.pagesizes import A4

# Datos del emisor por defecto (Avila Moto Repuesto)
EMISOR_DEFAULT = {
    'razon_social': 'Avila Moto Repuesto',
    'titular': 'Avila Marcelo Bernabe',
    'cuit': '20-23854391-7',
    'domicilio_comercial': '',
    'condicion_iva_display': 'Responsable Inscripto',
}
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime


def generar_pdf_factura(factura):
    """
    Genera PDF de factura con formato AFIP
    
    Args:
        factura: Objeto Factura
    
    Returns:
        BytesIO: Buffer con el PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=10*mm, bottomMargin=10*mm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    style_title = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    style_subtitle = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER
    )
    
    # === ENCABEZADO ===
    from .models import ConfiguracionAFIP
    config = ConfiguracionAFIP.objects.first()
    
    # Determinar tipo de comprobante para el título
    tipo_letra = factura.tipo_comprobante[:1] if len(factura.tipo_comprobante) >= 1 else 'B'
    tipo_nombre = factura.get_tipo_comprobante_display()
    
    # Título con letra grande
    elements.append(Paragraph(f'<b>FACTURA {tipo_letra}</b>', style_title))
    elements.append(Paragraph(f'{tipo_nombre}', style_subtitle))
    elements.append(Spacer(1, 10*mm))
    
    # === DATOS DEL EMISOR Y FACTURA ===
    if config:
        razon_social = config.razon_social
        cuit_emisor = config.cuit_emisor
        condicion_iva = config.get_condicion_iva_display()
        domicilio = config.domicilio_comercial or ''
    else:
        razon_social = EMISOR_DEFAULT['razon_social']
        cuit_emisor = EMISOR_DEFAULT['cuit']
        condicion_iva = EMISOR_DEFAULT['condicion_iva_display']
        domicilio = EMISOR_DEFAULT['domicilio_comercial']

    datos_emisor = [
        ['EMISOR', 'COMPROBANTE'],
        [
            f"<b>{razon_social}</b><br/>"
            f"{EMISOR_DEFAULT['titular']}<br/>"
            f"CUIT: {cuit_emisor}<br/>"
            f"Condición IVA: {condicion_iva}<br/>"
            f"{domicilio}",
            
            f"<b>N°: {factura.numero_completo}</b><br/>"
            f"Fecha: {factura.fecha_emision.strftime('%d/%m/%Y')}<br/>"
            f"{'CAE: ' + factura.cae if factura.cae else 'Sin CAE'}<br/>"
            f"{'Vto. CAE: ' + factura.cae_vencimiento.strftime('%d/%m/%Y') if factura.cae_vencimiento else ''}"
        ]
    ]
    
    tabla_emisor = Table(datos_emisor, colWidths=[95*mm, 95*mm])
    tabla_emisor.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 1), (-1, -1), 8),
        ('RIGHTPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    elements.append(tabla_emisor)
    elements.append(Spacer(1, 5*mm))
    
    # === DATOS DEL CLIENTE ===
    datos_cliente = [
        ['DATOS DEL CLIENTE'],
        [
            f"<b>{factura.cliente_razon_social}</b><br/>"
            f"CUIT/DNI: {factura.cliente_cuit}<br/>"
            f"Condición IVA: {factura.get_cliente_condicion_iva_display()}<br/>"
            f"{factura.cliente_domicilio if factura.cliente_domicilio else ''}"
        ]
    ]
    
    tabla_cliente = Table(datos_cliente, colWidths=[190*mm])
    tabla_cliente.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('LEFTPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    elements.append(tabla_cliente)
    elements.append(Spacer(1, 5*mm))
    
    # === DETALLE DE ÍTEMS ===
    items_data = [['Cant.', 'Descripción', 'P. Unit.', 'IVA', 'Subtotal']]
    
    for item in factura.items.all():
        items_data.append([
            f"{item.cantidad}",
            f"{item.descripcion}\n{item.codigo if item.codigo else ''}",
            f"${item.precio_unitario:,.2f}",
            f"{item.alicuota_iva}%",
            f"${item.subtotal:,.2f}"
        ])
    
    tabla_items = Table(items_data, colWidths=[20*mm, 95*mm, 25*mm, 20*mm, 30*mm])
    tabla_items.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # Cantidad centrada
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),  # Precios a la derecha
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(tabla_items)
    elements.append(Spacer(1, 5*mm))
    
    # === TOTALES ===
    totales_data = []
    
    # Mostrar IVA solo en Facturas A
    if factura.tipo_comprobante == 'FA':
        totales_data.extend([
            ['Subtotal:', f"${factura.subtotal:,.2f}"],
            ['IVA 10.5%:', f"${factura.iva_105:,.2f}"],
            ['IVA 21%:', f"${factura.iva_21:,.2f}"],
            ['IVA 27%:', f"${factura.iva_27:,.2f}"],
        ])
        if factura.otros_tributos > 0:
            totales_data.append(['Otros Tributos:', f"${factura.otros_tributos:,.2f}"])
    
    totales_data.append(['<b>TOTAL:</b>', f"<b>${factura.total:,.2f}</b>"])
    
    tabla_totales = Table(totales_data, colWidths=[140*mm, 50*mm])
    tabla_totales.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -2), 10),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(tabla_totales)
    elements.append(Spacer(1, 10*mm))
    
    # === OBSERVACIONES ===
    if factura.observaciones:
        elements.append(Paragraph('<b>Observaciones:</b>', styles['Normal']))
        elements.append(Paragraph(factura.observaciones, styles['Normal']))
        elements.append(Spacer(1, 5*mm))
    
    # === PIE DE PÁGINA ===
    if factura.tipo_comprobante != 'PRE':
        pie_texto = f"""
        <para alignment="center" fontSize="8">
        Este comprobante es válido como crédito fiscal según Resolución AFIP vigente.<br/>
        {f"CAE N°: {factura.cae} - Fecha Vto. CAE: {factura.cae_vencimiento.strftime('%d/%m/%Y')}" if factura.cae else "COMPROBANTE SIN AUTORIZAR"}<br/>
        Documento generado electrónicamente.
        </para>
        """
        elements.append(Spacer(1, 5*mm))
        elements.append(Paragraph(pie_texto, styles['Normal']))
    
    # Construir PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
