"""Regenerate the downloadable notice from dist/privacy.html.

Requires reportlab. Run from any directory with Python 3.
The app build rejects a stale PDF after notice text changes.
"""
from pathlib import Path
import hashlib
import re
import xml.etree.ElementTree as ET
from html import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

root = Path(__file__).resolve().parents[1]
source = (root / 'dist/privacy.html').read_text(encoding='utf-8')
main = re.search(r'<main\b[^>]*>([\s\S]*?)</main>', source).group(1)
digest = hashlib.sha256(main.encode()).hexdigest()
tree = ET.fromstring('<main>' + main + '</main>')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='NoticeBody', fontName='Helvetica', fontSize=10.5, leading=15, spaceAfter=9))
styles.add(ParagraphStyle(name='NoticeTitle', fontName='Helvetica-Bold', fontSize=25, leading=30, spaceAfter=14, keepWithNext=True))
styles.add(ParagraphStyle(name='NoticeHeading', fontName='Helvetica-Bold', fontSize=14, leading=18, spaceBefore=14, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name='NoticeCell', parent=styles['NoticeBody'], fontSize=9.5, leading=13, spaceAfter=0))
styles.add(ParagraphStyle(name='NoticeTableHead', parent=styles['NoticeCell'], fontName='Helvetica-Bold'))

def inline(element):
    text = escape(element.text or '')
    for child in element:
        body = escape(''.join(child.itertext()))
        if child.tag == 'a':
            text += '<a href="' + escape(child.attrib['href'], quote=True) + '" color="#24566e"><u>' + body + '</u></a>'
        else:
            text += body
        text += escape(child.tail or '')
    return text

story = []
for element in tree:
    if element.tag in ('h1', 'h2', 'p'):
        style = styles[{'h1':'NoticeTitle', 'h2':'NoticeHeading', 'p':'NoticeBody'}[element.tag]]
        story.append(Paragraph(inline(element), style))
    elif element.tag == 'div':
        rows = []
        for row in element.findall('.//tr'):
            rows.append([Paragraph(inline(cell), styles['NoticeTableHead' if cell.tag=='th' else 'NoticeCell']) for cell in row])
        table = Table(rows, colWidths=[133, 362], repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), .5, colors.HexColor('#d9dfdf')),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e6edf1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f6f8f8')]),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 10), ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 9), ('BOTTOMPADDING', (0,0), (-1,-1), 9),
        ]))
        story += [Spacer(1,5), table, Spacer(1,12)]

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#66716e'))
    canvas.drawString(50, 27, 'Deal Logic privacy notice')
    canvas.drawRightString(A4[0]-50, 27, str(doc.page))
    canvas.restoreState()

pdf = SimpleDocTemplate(str(root / 'dist/Deal-Logic-Privacy-Notice.pdf'), pagesize=A4,
    leftMargin=50, rightMargin=50, topMargin=45, bottomMargin=48,
    title='Deal Logic privacy notice', author='Milo Brooks',
    subject='privacy-source-sha256:' + digest)
pdf.build(story, onFirstPage=footer, onLaterPages=footer)
print('Generated privacy PDF from the published notice.')
