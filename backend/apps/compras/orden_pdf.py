"""
Generador de PDF para Órdenes de Compra.
Usa ReportLab — formato A4, estilo consistente con presupuesto_pdf.py.
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
import datetime

BRAND_BLUE  = colors.HexColor('#1E3A8A')
BRAND_LIGHT = colors.HexColor('#EFF6FF')
GRAY        = colors.HexColor('#6B7280')

EMPRESA_DEFAULT = {
    'nombre':   'Avila Moto Repuesto',
    'titular':  'Avila Marcelo Bernabe',
    'cuit':     '20-23854391-7',
    'telefono': '3834625390',
}


def _get_empresa():
    try:
        from apps.facturacion.models import ConfiguracionAFIP
        cfg = ConfiguracionAFIP.objects.first()
        if cfg:
            return cfg.razon_social, cfg.cuit_emisor
    except Exception:
        pass
    return EMPRESA_DEFAULT['nombre'], EMPRESA_DEFAULT['cuit']


def generar_pdf_orden_compra(orden_data: dict) -> BytesIO:
    """
    Genera PDF de una orden de compra (guardada o borrador).

    orden_data keys esperados:
        numero          — int o 'BORRADOR'
        proveedor_nombre
        deposito_nombre
        fecha_emision   — string 'dd/mm/yyyy'
        fecha_esperada  — string 'dd/mm/yyyy' o '—'
        numero_referencia
        observaciones
        notas_proveedor
        items           — list de dicts:
                            {codigo, nombre, cantidad_pedida, costo_estimado}
        total_estimado
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=12*mm, bottomMargin=12*mm,
        leftMargin=15*mm, rightMargin=15*mm,
    )
    styles = getSampleStyleSheet()
    st_bold  = ParagraphStyle('b', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10)
    st_title = ParagraphStyle('t', parent=styles['Heading1'], fontSize=18, alignment=TA_CENTER,
                              textColor=BRAND_BLUE, spaceAfter=2)
    st_sub   = ParagraphStyle('n', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER,
                              textColor=BRAND_BLUE, spaceAfter=2)

    emisor_nombre, emisor_cuit = _get_empresa()
    emisor_tel = EMPRESA_DEFAULT['telefono']
    emisor_titular = EMPRESA_DEFAULT['titular']

    elems = []

    # ── Título ───────────────────────────────────────────────────────
    numero = orden_data.get('numero', 'BORRADOR')
    if numero == 'BORRADOR':
        elems.append(Paragraph('ORDEN DE COMPRA — BORRADOR', st_title))
    else:
        elems.append(Paragraph('ORDEN DE COMPRA', st_title))
        elems.append(Paragraph(f'N° <b>{int(numero):05d}</b>', st_sub))
    elems.append(Spacer(1, 4*mm))

    # ── Cabecera: emisor + datos de la orden ─────────────────────────
    fecha_str = orden_data.get('fecha_emision', datetime.date.today().strftime('%d/%m/%Y'))
    fecha_esp = orden_data.get('fecha_esperada') or '—'
    nro_ref   = orden_data.get('numero_referencia') or '—'
    deposito  = orden_data.get('deposito_nombre') or '—'

    cab_data = [
        ['EMISOR', 'DATOS DE LA ORDEN'],
        [
            Paragraph(
                f"<b>{emisor_nombre}</b><br/>{emisor_titular}<br/>"
                f"CUIT: {emisor_cuit}<br/>Tel: {emisor_tel}",
                ParagraphStyle('em', parent=styles['Normal'], fontSize=9)
            ),
            Paragraph(
                f"Fecha emisión: {fecha_str}<br/>"
                f"Entrega esperada: <b>{fecha_esp}</b><br/>"
                f"N° referencia proveedor: {nro_ref}<br/>"
                f"Depósito destino: {deposito}",
                ParagraphStyle('da', parent=styles['Normal'], fontSize=9)
            ),
        ],
    ]
    tab_cab = Table(cab_data, colWidths=[90*mm, 90*mm])
    tab_cab.setStyle(TableStyle([
        ('BACKGROUND',   (0, 0), (-1, 0), BRAND_BLUE),
        ('TEXTCOLOR',    (0, 0), (-1, 0), colors.white),
        ('FONTNAME',     (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0, 0), (-1, 0), 10),
        ('ALIGN',        (0, 0), (-1, 0), 'CENTER'),
        ('TOPPADDING',   (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING',(0, 0), (-1, 0), 6),
        ('BACKGROUND',   (0, 1), (-1,-1), colors.white),
        ('GRID',         (0, 0), (-1,-1), 0.5, colors.grey),
        ('VALIGN',       (0, 0), (-1,-1), 'TOP'),
        ('TOPPADDING',   (0, 1), (-1,-1), 6),
        ('BOTTOMPADDING',(0, 1), (-1,-1), 6),
        ('LEFTPADDING',  (0, 1), (-1,-1), 8),
    ]))
    elems.append(tab_cab)
    elems.append(Spacer(1, 4*mm))

    # ── Proveedor ────────────────────────────────────────────────────
    prov_nombre = orden_data.get('proveedor_nombre') or '—'
    prov_data = [
        ['PROVEEDOR'],
        [Paragraph(f"<b>{prov_nombre}</b>", ParagraphStyle('cl', parent=styles['Normal'], fontSize=9))],
    ]
    tab_prov = Table(prov_data, colWidths=[180*mm])
    tab_prov.setStyle(TableStyle([
        ('BACKGROUND',   (0, 0), (-1, 0), BRAND_BLUE),
        ('TEXTCOLOR',    (0, 0), (-1, 0), colors.white),
        ('FONTNAME',     (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0, 0), (-1, 0), 10),
        ('ALIGN',        (0, 0), (-1, 0), 'CENTER'),
        ('TOPPADDING',   (0, 0), (-1, 0), 5),
        ('BOTTOMPADDING',(0, 0), (-1, 0), 5),
        ('BACKGROUND',   (0, 1), (-1,-1), colors.white),
        ('GRID',         (0, 0), (-1,-1), 0.5, colors.grey),
        ('TOPPADDING',   (0, 1), (-1,-1), 6),
        ('BOTTOMPADDING',(0, 1), (-1,-1), 6),
        ('LEFTPADDING',  (0, 1), (-1,-1), 8),
    ]))
    elems.append(tab_prov)
    elems.append(Spacer(1, 4*mm))

    # ── Ítems ────────────────────────────────────────────────────────
    items_data = [['Cód.', 'Descripción', 'Cant.', 'Costo Est.', 'Subtotal']]
    for item in orden_data.get('items', []):
        cant   = int(item.get('cantidad_pedida') or 1)
        costo  = item.get('costo_estimado')
        try:
            costo_f = float(costo) if costo not in (None, '') else None
        except (TypeError, ValueError):
            costo_f = None
        subtotal = cant * costo_f if costo_f is not None else None
        items_data.append([
            item.get('codigo') or '—',
            item.get('nombre') or '—',
            str(cant),
            f"${costo_f:,.2f}" if costo_f is not None else '—',
            f"${subtotal:,.2f}" if subtotal is not None else '—',
        ])

    col_w = [22*mm, 90*mm, 14*mm, 27*mm, 27*mm]
    tab_items = Table(items_data, colWidths=col_w)
    tab_items.setStyle(TableStyle([
        ('BACKGROUND',   (0, 0), (-1, 0), BRAND_BLUE),
        ('TEXTCOLOR',    (0, 0), (-1, 0), colors.white),
        ('FONTNAME',     (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0, 0), (-1, 0), 9),
        ('ALIGN',        (0, 0), (-1, 0), 'CENTER'),
        ('TOPPADDING',   (0, 0), (-1, 0), 5),
        ('BOTTOMPADDING',(0, 0), (-1, 0), 5),
        ('BACKGROUND',   (0, 1), (-1,-1), colors.white),
        ('ROWBACKGROUNDS',(0, 1),(-1,-1), [colors.white, BRAND_LIGHT]),
        ('GRID',         (0, 0), (-1,-1), 0.4, colors.lightgrey),
        ('FONTSIZE',     (0, 1), (-1,-1), 9),
        ('ALIGN',        (2, 1), (-1,-1), 'RIGHT'),
        ('VALIGN',       (0, 0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',   (0, 1), (-1,-1), 4),
        ('BOTTOMPADDING',(0, 1), (-1,-1), 4),
        ('LEFTPADDING',  (0, 1), (1, -1), 6),
    ]))
    elems.append(tab_items)
    elems.append(Spacer(1, 4*mm))

    # ── Total estimado ───────────────────────────────────────────────
    total = orden_data.get('total_estimado', 0)
    try:
        total_f = float(total)
    except (TypeError, ValueError):
        total_f = 0.0
    tot_rows = [[
        Paragraph('<b>TOTAL ESTIMADO:</b>', st_bold),
        Paragraph(f"<b>${total_f:,.2f}</b>", st_bold),
    ]]
    tab_tot = Table(tot_rows, colWidths=[150*mm, 30*mm])
    tab_tot.setStyle(TableStyle([
        ('ALIGN',        (0, 0), (-1,-1), 'RIGHT'),
        ('LINEABOVE',    (0, 0), (-1, 0), 1, colors.black),
        ('TOPPADDING',   (0, 0), (-1, 0), 5),
        ('BOTTOMPADDING',(0, 0), (-1, 0), 5),
    ]))
    elems.append(tab_tot)

    # ── Notas para el proveedor ──────────────────────────────────────
    notas = orden_data.get('notas_proveedor')
    if notas:
        elems.append(Spacer(1, 5*mm))
        elems.append(Paragraph('<b>Notas para el proveedor:</b>', st_bold))
        elems.append(Paragraph(notas, ParagraphStyle('notas', parent=styles['Normal'], fontSize=9)))

    # ── Observaciones internas ───────────────────────────────────────
    obs = orden_data.get('observaciones')
    if obs:
        elems.append(Spacer(1, 5*mm))
        elems.append(Paragraph('<b>Observaciones internas:</b>', st_bold))
        elems.append(Paragraph(obs, ParagraphStyle('obs', parent=styles['Normal'], fontSize=9,
                                                    textColor=GRAY)))

    # ── Pie ──────────────────────────────────────────────────────────
    elems.append(Spacer(1, 8*mm))
    pie = f"Orden de Compra · {emisor_nombre} · Tel: {emisor_tel}"
    elems.append(Paragraph(pie, ParagraphStyle('pie', parent=styles['Normal'],
        fontSize=8, textColor=GRAY, alignment=TA_CENTER)))

    doc.build(elems)
    buf.seek(0)
    return buf
