"""Regenerate a legal PDF from its published HTML (privacy by default, or terms).

Requires reportlab. Run from any directory with Python 3.
The app build rejects a stale PDF after notice text changes.
"""
from pathlib import Path
import hashlib
import sys
import re
import xml.etree.ElementTree as ET
from html import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

root = Path(__file__).resolve().parents[1]
kind = sys.argv[1] if len(sys.argv) > 1 else 'privacy'
if kind not in ('privacy', 'terms'):
    raise SystemExit('Choose privacy or terms.')
label = 'Deal Logic privacy notice' if kind == 'privacy' else 'Deal Logic Terms of Use'
filename = 'Deal-Logic-Privacy-Notice.pdf' if kind == 'privacy' else 'Deal-Logic-Terms-of-Use.pdf'
source = (root / ('dist/' + kind + '.html')).read_text(encoding='utf-8')
main = re.search(r'<main\b[^>]*>([\s\S]*?)</main>', source).group(1)
digest = hashlib.sha256(main.encode()).hexdigest()
tree = ET.fromstring('<main>' + main + '</main>')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='NoticeBody', fontName='Helvetica', fontSize=10.5, leading=15, spaceAfter=9))
styles.add(ParagraphStyle(name='NoticeTitle', fontName='Helvetica-Bold', fontSize=25, leading=30, spaceAfter=14, keepWithNext=True))
styles.add(ParagraphStyle(name='NoticeHeading', fontName='Helvetica-Bold', fontSize=14, leading=18, spaceBefore=14, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name='NoticeCell', parent=styles['NoticeBody'], fontSize=9.5, leading=13, spaceAfter=0))
styles.add(ParagraphStyle(name='NoticeTableHead', parent=styles['NoticeCell'], fontName='Helvetica-Bold'))

if kind == 'terms':
    styles['NoticeBody'].leading = 14
    styles['NoticeBody'].spaceAfter = 8
    styles['NoticeBody'].allowWidows = 0
    styles['NoticeHeading'].spaceBefore = 12
    styles['NoticeHeading'].spaceAfter = 6

def inline(element):
    text = escape(element.text or '')
    for child in element:
        body = escape(''.join(child.itertext()))
        if child.tag == 'a':
            text += '<a href="' + escape(child.attrib['href'], quote=True) + '" color="#24566e"><u>' + body + '</u></a>'
        elif child.tag == 'strong':
            text += '<b>' + body + '</b>'
        else:
            text += body
        text += escape(child.tail or '')
    return text

story = []
for element in tree:
    if element.tag in ('h1', 'h2', 'h3', 'p'):
        style = styles[{'h1':'NoticeTitle', 'h2':'NoticeHeading', 'h3':'NoticeHeading', 'p':'NoticeBody'}[element.tag]]
        story.append(Paragraph(inline(element), style))
    elif element.tag == 'ul':
        for item in element:
            story.append(Paragraph(inline(item), styles['NoticeBody'], bulletText='•'))
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
    canvas.drawString(50, 27, label)
    canvas.drawRightString(A4[0]-50, 27, str(doc.page))
    canvas.restoreState()

pdf = SimpleDocTemplate(str(root / 'dist' / filename), pagesize=A4,
    leftMargin=50, rightMargin=50, topMargin=45, bottomMargin=48,
    title=label, author='Milo Brooks',
    subject=kind + '-source-sha256:' + digest)
pdf.build(story, onFirstPage=footer, onLaterPages=footer)
print('Generated ' + kind + ' PDF from the published page.')
