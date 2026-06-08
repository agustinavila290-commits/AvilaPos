"""
Generador de PDF para presupuestos.
Usa ReportLab — formato A4, sin datos fiscales AFIP.
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

BRAND_BLUE  = colors.HexColor('#1E3A8A')
BRAND_LIGHT = colors.HexColor('#EFF6FF')
GRAY        = colors.HexColor('#6B7280')

EMPRESA_DEFAULT = {
    'nombre':   'Avila Moto Repuesto',
    'titular':  'Avila Marcelo Bernabe',
    'cuit':     '20-23854391-7',
    'telefono': '3834625390',
}


def generar_pdf_presupuesto(presupuesto) -> BytesIO:
    """Retorna un BytesIO con el PDF del presupuesto."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=12*mm, bottomMargin=12*mm,
        leftMargin=15*mm, rightMargin=15*mm,
    )
    styles = getSampleStyleSheet()
    st_center = ParagraphStyle('c', parent=styles['Normal'], alignment=TA_CENTER, fontSize=9)
    st_right  = ParagraphStyle('r', parent=styles['Normal'], alignment=TA_RIGHT,  fontSize=9)
    st_bold   = ParagraphStyle('b', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10)
    st_small  = ParagraphStyle('s', parent=styles['Normal'], fontSize=8, textColor=GRAY)
    st_title  = ParagraphStyle('t', parent=styles['Heading1'], fontSize=20, alignment=TA_CENTER,
                               textColor=BRAND_BLUE, spaceAfter=4)

    elems = []

    # ── Título ──────────────────────────────────────────────────────
    elems.append(Paragraph('PRESUPUESTO', st_title))
    elems.append(Paragraph(f'N° <b>{presupuesto.numero:05d}</b>', ParagraphStyle(
        'n', parent=styles['Normal'], fontSize=13, alignment=TA_CENTER,
        textColor=BRAND_BLUE, spaceAfter=2,
    )))
    elems.append(Spacer(1, 4*mm))

    # ── Cabecera: emisor + datos del presupuesto ────────────────────
    from .models import Presupuesto as PModel
    from apps.facturacion.models import ConfiguracionAFIP
    cfg = ConfiguracionAFIP.objects.first()

    emisor_nombre  = cfg.razon_social if cfg else EMPRESA_DEFAULT['nombre']
    emisor_titular = EMPRESA_DEFAULT['titular']
    emisor_cuit    = cfg.cuit_emisor if cfg else EMPRESA_DEFAULT['cuit']
    emisor_tel     = EMPRESA_DEFAULT['telefono']

    fecha_str = presupuesto.fecha_creacion.strftime('%d/%m/%Y')
    vto_str   = presupuesto.fecha_vencimiento.strftime('%d/%m/%Y') if presupuesto.fecha_vencimiento else 'Sin vencimiento'

    cab_data = [
        ['EMISOR', 'DATOS'],
        [
            Paragraph(
                f"<b>{emisor_nombre}</b><br/>{emisor_titular}<br/>CUIT: {emisor_cuit}<br/>Tel: {emisor_tel}",
                ParagraphStyle('em', parent=styles['Normal'], fontSize=9)
            ),
            Paragraph(
                f"<b>Presupuesto N° {presupuesto.numero:05d}</b><br/>"
                f"Fecha: {fecha_str}<br/>"
                f"Válido hasta: <b>{vto_str}</b><br/>"
                f"Estado: {presupuesto.get_estado_display()}",
                ParagraphStyle('da', parent=styles['Normal'], fontSize=9)
            ),
        ],
    ]
    tab_cab = Table(cab_data, colWidths=[90*mm, 90*mm])
    tab_cab.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), BRAND_BLUE),
        ('TEXTCOLOR',   (0,0), (-1,0), colors.white),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,0), 10),
        ('ALIGN',       (0,0), (-1,0), 'CENTER'),
        ('TOPPADDING',  (0,0), (-1,0), 6),
        ('BOTTOMPADDING',(0,0),(-1,0), 6),
        ('BACKGROUND',  (0,1), (-1,-1), colors.white),
        ('GRID',        (0,0), (-1,-1), 0.5, colors.grey),
        ('VALIGN',      (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',  (0,1), (-1,-1), 6),
        ('BOTTOMPADDING',(0,1),(-1,-1), 6),
        ('LEFTPADDING', (0,1), (-1,-1), 8),
    ]))
    elems.append(tab_cab)
    elems.append(Spacer(1, 4*mm))

    # ── Cliente ─────────────────────────────────────────────────────
    cliente_str = presupuesto.nombre_cliente
    cli_data = [
        ['CLIENTE'],
        [Paragraph(f"<b>{cliente_str}</b>", ParagraphStyle('cl', parent=styles['Normal'], fontSize=9))],
    ]
    tab_cli = Table(cli_data, colWidths=[180*mm])
    tab_cli.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), BRAND_BLUE),
        ('TEXTCOLOR',   (0,0), (-1,0), colors.white),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,0), 10),
        ('ALIGN',       (0,0), (-1,0), 'CENTER'),
        ('TOPPADDING',  (0,0), (-1,0), 5),
        ('BOTTOMPADDING',(0,0),(-1,0), 5),
        ('BACKGROUND',  (0,1), (-1,-1), colors.white),
        ('GRID',        (0,0), (-1,-1), 0.5, colors.grey),
        ('TOPPADDING',  (0,1), (-1,-1), 6),
        ('BOTTOMPADDING',(0,1),(-1,-1), 6),
        ('LEFTPADDING', (0,1), (-1,-1), 8),
    ]))
    elems.append(tab_cli)
    elems.append(Spacer(1, 4*mm))

    # ── Ítems ────────────────────────────────────────────────────────
    items_data = [['Cód.', 'Descripción', 'Cant.', 'P. Unit.', 'Subtotal']]
    for item in presupuesto.items.select_related('variante').all():
        items_data.append([
            item.variante.codigo or '—',
            item.variante.nombre_completo or '—',
            str(item.cantidad),
            f"${item.precio_unitario:,.2f}",
            f"${item.subtotal:,.2f}",
        ])

    col_w = [22*mm, 90*mm, 14*mm, 27*mm, 27*mm]
    tab_items = Table(items_data, colWidths=col_w)
    tab_items.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), BRAND_BLUE),
        ('TEXTCOLOR',   (0,0), (-1,0), colors.white),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,0), 9),
        ('ALIGN',       (0,0), (-1,0), 'CENTER'),
        ('TOPPADDING',  (0,0), (-1,0), 5),
        ('BOTTOMPADDING',(0,0),(-1,0), 5),
        ('BACKGROUND',  (0,1), (-1,-1), colors.white),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, BRAND_LIGHT]),
        ('GRID',        (0,0), (-1,-1), 0.4, colors.lightgrey),
        ('FONTSIZE',    (0,1), (-1,-1), 9),
        ('ALIGN',       (2,1), (-1,-1), 'RIGHT'),
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',  (0,1), (-1,-1), 4),
        ('BOTTOMPADDING',(0,1),(-1,-1), 4),
        ('LEFTPADDING', (0,1), (1,-1),  6),
    ]))
    elems.append(tab_items)
    elems.append(Spacer(1, 4*mm))

    # ── Totales ──────────────────────────────────────────────────────
    tot_rows = []
    if presupuesto.descuento_monto > 0:
        tot_rows.append(['Subtotal:', f"${presupuesto.subtotal:,.2f}"])
        tot_rows.append([f'Descuento ({presupuesto.descuento_porcentaje}%):', f"-${presupuesto.descuento_monto:,.2f}"])
    tot_rows.append([Paragraph('<b>TOTAL:</b>', st_bold), Paragraph(f"<b>${presupuesto.total:,.2f}</b>", st_bold)])

    tab_tot = Table(tot_rows, colWidths=[150*mm, 30*mm])
    tab_tot.setStyle(TableStyle([
        ('ALIGN',       (0,0), (-1,-1), 'RIGHT'),
        ('FONTSIZE',    (0,0), (-1,-2), 9),
        ('LINEABOVE',   (0,-1), (-1,-1), 1, colors.black),
        ('TOPPADDING',  (0,0), (-1,-1), 3),
        ('BOTTOMPADDING',(0,0),(-1,-1), 3),
    ]))
    elems.append(tab_tot)

    # ── Observaciones ────────────────────────────────────────────────
    if presupuesto.observaciones:
        elems.append(Spacer(1, 5*mm))
        elems.append(Paragraph('<b>Observaciones:</b>', st_bold))
        elems.append(Paragraph(presupuesto.observaciones, ParagraphStyle(
            'obs', parent=styles['Normal'], fontSize=9)))

    # ── Pie ──────────────────────────────────────────────────────────
    elems.append(Spacer(1, 8*mm))
    pie = (
        f"Presupuesto sin compromiso · Válido hasta {vto_str} · "
        f"{emisor_nombre} · Tel: {emisor_tel}"
    )
    elems.append(Paragraph(pie, ParagraphStyle('pie', parent=styles['Normal'],
        fontSize=8, textColor=GRAY, alignment=TA_CENTER)))

    doc.build(elems)
    buf.seek(0)
    return buf
