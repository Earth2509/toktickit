"""Build a post-merge review copy; online/board gates remain explicit."""
from pathlib import Path
from html import escape
from io import BytesIO
import re
import textwrap
import subprocess
import json
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs/lab-04'
EVIDENCE = DOCS / 'evidence/main'
OUT = ROOT / 'output/pdf/TokTickIT_Lab4_PostMerge_Review.pdf'
MAIN_SHA = '73faa8b0cee5adce1718cd97c5e32fc4bba9ec84'
PUBLISHED_PATHS = set(subprocess.check_output(
    ['git', '-c', f'safe.directory={ROOT.as_posix()}', 'ls-tree', '-r', '--name-only', MAIN_SHA],
    cwd=ROOT, text=True).splitlines())
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Report', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ReportBold', 'C:/Windows/Fonts/arialbd.ttf'))
INK = colors.HexColor('#173c30')
MINT = colors.HexColor('#e6f3ed')
STYLE = getSampleStyleSheet()
STYLE.add(ParagraphStyle(name='Body4', fontName='Report', fontSize=10, leading=14, spaceAfter=7, wordWrap='CJK'))
STYLE.add(ParagraphStyle(name='Cell4', parent=STYLE['Body4'], fontSize=8.5, leading=11, spaceAfter=0, wordWrap='LTR'))
STYLE.add(ParagraphStyle(name='HeadCell4', parent=STYLE['Cell4'], fontName='ReportBold', textColor=INK))
STYLE.add(ParagraphStyle(name='Title4', fontName='ReportBold', fontSize=23, leading=28, spaceAfter=14, textColor=INK))
STYLE['Heading4'].__dict__.update(fontName='ReportBold', fontSize=14, leading=19, spaceBefore=10, spaceAfter=7, keepWithNext=True, textColor=INK)
segments = []
figure = 0

def clean(text):
    text = re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', text)
    for old, new in [('—', '-'), ('–', '-'), ('‑', '-'), ('→', ' -> '), ('✅', '[verified]'), ('⚠️', '[note]'), ('✓', '[passed]'), ('↓', '[skipped]'), ('โ“', '[passed]'), ('โ”', '|')]:
        text = text.replace(old, new)
    return text

def rich(text, base=DOCS):
    text = escape(clean(text.strip()))
    def link(match):
        label, target = match.groups()
        if target.startswith(('https://', 'http://')):
            return f'<a href="{target}" color="#007247">{label}</a>'
        local = (base / target).resolve()
        # Published source existence is checked against the actual merge tree;
        # URL accessibility is not inferred from this local Git inspection.
        if local.is_relative_to(ROOT) and local.relative_to(ROOT).as_posix() in PUBLISHED_PATHS:
            rel = local.relative_to(ROOT).as_posix()
            return f'<a href="https://github.com/Earth2509/toktickit/blob/main/{rel}" color="#007247">{label}</a>'
        return label + ' (local source: ' + target + ')'
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, text)
    text = re.sub(r'`([^`]+)`', r'<font name="Report">\1</font>', text)
    return re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)

def p(text, style='Body4', base=DOCS):
    return Paragraph(rich(text, base), STYLE[style])

def markdown(path):
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    story = [p('Rendered copy: ' + path.relative_to(ROOT).as_posix(), 'Heading4')]
    i, fenced = 0, False
    while i < len(lines):
        line = lines[i]
        if line.startswith('```'):
            fenced = not fenced
            i += 1
            continue
        if fenced:
            for wrapped in textwrap.wrap(clean(line), 90, replace_whitespace=False) or [' ']:
                story.append(p(wrapped, base=path.parent))
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                cells = re.split(r'(?<!\\)\|', lines[i].strip().strip('|'))
                if not all(re.fullmatch(r'\s*[:\- ]+\s*', cell) for cell in cells):
                    rows.append(cells)
                i += 1
            columns = max(map(len, rows))
            rendered = [[p(cell, 'HeadCell4' if r == 0 else 'Cell4', path.parent) for cell in row + ['']*(columns-len(row))] for r,row in enumerate(rows)]
            table = Table(rendered, colWidths=[499/columns]*columns, repeatRows=1, splitByRow=True)
            table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),MINT),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#a6c7b8')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
            story.extend([table, Spacer(1,10)])
            continue
        elif line.strip():
            if line.startswith('#'):
                story.append(p(line.lstrip('# '), 'Heading4', path.parent))
            else:
                story.append(p(line, base=path.parent))
        i += 1
    return story

def text_segment(story):
    stream = BytesIO()
    SimpleDocTemplate(stream, pagesize=A4, leftMargin=48,rightMargin=48,topMargin=48,bottomMargin=48).build(story)
    segments.append(stream.getvalue())

def image_segment(rel, caption):
    global figure
    path = (DOCS / 'evidence/completion' / rel.split('/', 1)[1]) if rel.startswith('completion/') else EVIDENCE / rel
    if not path.exists():
        raise FileNotFoundError(path)
    figure += 1
    with PILImage.open(path) as image:
        w,h = image.size
    dw = 499
    dh = dw*h/w
    origin = 'evidence/' + rel if rel.startswith('completion/') else 'evidence/main/' + rel
    cap = p(f'Figure {figure}. {caption} Original: {origin}', 'Body4')
    _,ch = cap.wrap(dw, 200)
    height = max(A4[1],dh+ch+130)
    stream = BytesIO()
    cv = canvas.Canvas(stream,pagesize=(A4[0],height))
    cv.setFont('ReportBold',12)
    cv.setFillColor(INK)
    cv.drawString(48,height-34,'TokTickIT Lab 4 | Full original evidence')
    cv.drawImage(str(path),48,height-60-dh,width=dw,height=dh)
    cap.drawOn(cv,48,height-75-dh-ch)
    cv.showPage()
    cv.save()
    segments.append(stream.getvalue())

parts = [
 ('Git Use with Engineering Workflow',['reviewer.md','git-workflow-verification.md'], ['github-original-specification-commit-live.jpg','github-actions-foundation-commit-live.jpg','github-network-feature-staging-main-live.jpg']),
 ('Spec DD',['specification.md'], []),
 ('Test DD and Traceability',['submission-post-merge-verification.md','tests.md','main-full-output-verification.md','evidence-completion-verification.md'], []),
 ('AI Use with Reflection',['ai-use.md'], []),
 ('Working IT Staff Dashboard UI',['live-dashboard-recovery-20261004.md'], ['staff-dashboard-card-counts-live.jpg','staff-owned-two-drilldown-live.jpg','staff-waiting-zero-drilldown-live.jpg','admin-dashboard-own-actions-empty-live.jpg','dashboard-api-unavailable-live.jpg','dashboard-api-retry-recovered-live.jpg']),
 ('Working Actions Taken UI',['api-spec.md'], ['action-create-form-live.jpg','action-created-live.jpg','action-edited-live.jpg','action-completed-live.jpg','action-cancel-form-live.jpg','actions-completed-cancelled-live.jpg','action-keyboard-description-validation-live.jpg','action-keyboard-follow-up-validation-live.jpg','action-keyboard-result-validation-live.jpg','action-stale-version-conflict.jpg','action-conflict-reloaded.jpg','actions-safe-failure-live.jpg']),
 ('Working Ticket Workflow',['live-workflow-verification-20261004.md','workflow-history-verification.md'], ['resolution-summary-validation-live.jpg','resolution-open-action-blocked-live.jpg','workflow-action-completed-live.jpg','workflow-resolved-live.jpg','workflow-closed-live.jpg','workflow-reopen-reason-validation-live.jpg','workflow-reopened-live.jpg','workflow-post-reopen-resolution-denied-live.jpg']),
 ('Working Requester Dashboard and Final Regression UI',['live-requester-metric-verification-20261004.md','live-requester-populated-verification-20261004.md'], ['requester-dashboard-genuine-empty-live.jpg','requester-anan-populated-dashboard-live.jpg','requester-anan-updated-two-drilldown-live.jpg','requester-anan-owned-detail-readonly-actions-live.jpg','requester-create-ticket-keyboard-validation-live.jpg','admin-users-role-filter-live.jpg','admin-self-deactivation-disabled-live.jpg','admin-create-user-empty-validation-live.jpg']),
 ('Zen Green UI, Responsive, Accessibility and Final Polish',['ui-spec.md','manual-accessibility-verification.md'], [f'{viewport}/{screen}.png' for viewport in ['desktop','tablet','mobile'] for screen in ['staff-dashboard','staff-ticket-actions','requester-dashboard','requester-ticket-actions']] + ['staff-own-actions-desktop.jpg','staff-own-actions-tablet.jpg','staff-own-actions-mobile.jpg']),
]

parts[4][2].extend(['completion/staff-dashboard-loading-delayed-real-request.png', 'completion/staff-dashboard-empty-controlled-response.png', 'completion/staff-dashboard-forbidden-controlled-response.png'])
parts[5][2].extend(['completion/action-submitting-controlled-pending-save.png', 'completion/action-controlled-failure-preserves-draft.png', 'completion/staff-non-performer-non-assignee-readonly-existing-action.png'])
parts[7][2].extend(['completion/requester-seeded-attention-dashboard.png', 'completion/requester-seeded-attention-drilldown.png'])
parts[8][1].append('final-evidence-follow-up.md')
parts[8][1].append('final-checklist-verification.md')
parts[7][2].extend(['completion/staff-existing-private-note-visible.png', 'completion/requester-same-ticket-public-reply-private-note-hidden.png'])
parts[8][2].extend([f'completion/long-action-controlled-render-{viewport}.png' for viewport in ['desktop', 'tablet', 'mobile']])
parts[8][2].extend([f'completion/action-edit-submitting-controlled-{viewport}.png' for viewport in ['desktop', 'tablet', 'mobile']] + ['completion/action-keyboard-follow-up-validation-mobile.png', 'completion/action-edit-conflict-preserved-draft-mobile.png'])

text_segment([
    p('TokTickIT Lab 4','Title4'),
    p('Post-Merge Evidence Review','Title4'),
    p('Pattharapon Kijjanukij','Heading4'),
    p('Student ID: 67070501069 | Section: 1'),
    p('Developer-supplied post-merge passing summaries are complete, and the six engineering-document links work. Complete current-source server/browser/optional output, reviewed publication of the local update and all-Done Project Board evidence remain unresolved. This is not yet the unconditional final submission. Answer Parts 1-9 include all six rendered engineering documents and full proportional images.'),
    p('Repository: [Earth2509/toktickit](https://github.com/Earth2509/toktickit)'),
    p(f'Latest main source: [{MAIN_SHA[:7]}](https://github.com/Earth2509/toktickit/commit/{MAIN_SHA}), merge of peer-approved [PR #72](https://github.com/Earth2509/toktickit/pull/72). Developer-supplied post-merge outcomes: server 134 passed / 9 skipped, all 9 opt-in cases passed separately, client 45 passed, browser E2E 29 passed and both builds passed. Supplied excerpts and historical complete logs are kept distinct.'),
    p('Visual/accessibility evidence: the successful-save focus correction was reviewed through PR #71 and promoted through PR #72. Historical live/controlled images and reviewer/developer runs retain their original attribution; they are not relabelled as new images taken on the final main merge.'),
    p('Reading note: long screenshots use proportionally tall pages at full content width, without cropping or stretching. All six engineering-document URLs returned HTTP 200 on 6 October after the temporary DNS outage resolved. Later locally updated contents and complete-output records are not yet claimed published or byte-identical to public main. Unpublished supplementary records remain labelled local references. Current-source complete server/browser/opt-in output and the final Board remain acceptance gates.'),
])
for number,(title,files,images) in enumerate(parts,1):
    story = [p(f'Answer Part {number}: {title}','Title4')]
    if number == 1:
        story += [p('PR #72 is approved and merged into main. The live Project has five completed Lab 4 issues (#55-#59). The final-evidence Issue #60 was moved from Backlog to In progress on 6 October. It is not yet closed or Done. The Project also contains nine completed older Lab 3 items; those are not counted as Lab 4 issues. Final all-Done Board evidence must follow completion, not precede it.')]
        story += markdown(ROOT/'README.md') + markdown(ROOT/'.gitignore')
        dirs = [x for x in ['client/src','client/tests','server/src','server/prisma','server/tests','server/scripts','e2e/lab-04','docs/lab-04'] if (ROOT/x).is_dir()]
        story += [p('Directory evidence: actual workspace directory inventory (not an IDE screenshot).','Heading4')]+[p(d) for d in dirs]
    for file in files:
        if file in ['specification.md', 'tests.md', 'api-spec.md', 'ui-spec.md', 'reviewer.md', 'ai-use.md']:
            note = 'The source path exists in the recorded main merge and its public GitHub URL returned HTTP 200 on 6 October.'
            if file in ['specification.md', 'tests.md', 'ui-spec.md', 'api-spec.md', 'reviewer.md']:
                note += ' This rendered local copy includes a later 6 October post-merge status update not yet published; the online file is not claimed byte-identical.'
            story += [p(f'GitHub source: [{file}](https://github.com/Earth2509/toktickit/blob/main/docs/lab-04/{file})'), p(note)]
        story += markdown(DOCS/file)
    if number == 3:
        collected = DOCS/'evidence/post-merge-73faa8b'
        manifest_path = collected/'manifest.json'
        if manifest_path.exists():
            manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
            assert manifest['source'] == MAIN_SHA, 'Do not mix collected runtime sources.'
            for name, result in manifest['checks'].items():
                if not result['passed'] or result['exitCode'] != 0:
                    continue
                log = collected/result['file']
                assert log.parent == collected and log.is_file()
                body = log.read_text(encoding='utf-8')
                assert f'Reviewed runtime/test source: {MAIN_SHA}' in body
                assert 'Exit code: 0' in body
                story += [p(f'New complete current-source output: {name}', 'Heading4'), p('Runtime/test tracked files match reviewed main; documentation-only branch and actual checkout are recorded in the output header. This is a collector run, not a terminal screenshot. The assistant client/build collection used the process-only VITE_PRESERVE_SYMLINKS=true workaround; attribution is in the dated post-merge record.')]
                for line in body.splitlines():
                    for wrapped in textwrap.wrap(clean(line),90,replace_whitespace=False) or [' ']:
                        story.append(p(wrapped))
        story += [p('Rendered output below removes terminal ANSI colour/control sequences, displays check/skip glyphs as readable [passed]/[skipped] labels, and wraps long lines. Original source bytes remain unchanged. The supplied submission client results, correction build and history result are explicitly labelled excerpts without an embedded source header, even where an older filename says full. Main logs retain their full recorded output; test outcomes and recorded values are not rewritten.')]
        for log in sorted((EVIDENCE/'test-output').glob('*.txt')) + sorted((DOCS/'evidence/build-output').glob('*.txt')):
            excerpt = 'excerpt' in log.name or log.name == 'submission-client-test-full.txt'
            label = 'Developer-supplied output excerpt: ' if excerpt else 'Complete recorded output: '
            story += [p(label+log.name,'Heading4')]
            for line in log.read_text(encoding='utf-8-sig').splitlines():
                for wrapped in textwrap.wrap(clean(line),90,replace_whitespace=False) or [' ']:
                    story.append(p(wrapped))
    text_segment(story)
    for rel in images:
        label = rel.rsplit('/',1)[-1].rsplit('.',1)[0].replace('-',' ')
        provenance = 'Recorded provenance: dated evidence/main/README.md and the corresponding verification record. Historical responsive captures are not relabelled as 4 October live images.'
        if rel.startswith('completion/'):
            viewport = '820 x 1180'
            if 'private-note' in rel:
                viewport = '1280 x 720'
            elif 'long-action' in rel or 'action-edit-' in rel or 'action-keyboard-follow-up-validation-' in rel:
                viewport = {'desktop': '1440 x 900', 'tablet': '820 x 1180', 'mobile': '390 x 844'}[rel.rsplit('-', 1)[1].split('.')[0]]
            provenance = f'Additional developer-run browser evidence on the submission workspace, {viewport}, not a main-run or public-schema image. See focused verification in Part 3 and the 5 October record in Part 9.'
            if 'controlled' in rel:
                provenance += ' Controlled browser response fixture; not proof of a live backend response.'
            elif 'action-edit-conflict' in rel:
                provenance += ' Controlled PATCH 409 preserves an unsaved edit draft; not a real concurrent database-write claim.'
            elif 'delayed' in rel:
                provenance += ' Real request held pending to expose loading.'
            else:
                provenance += ' Seeded disposable lab3_e2e data with real API assertions.'
            if 'action-edit-' in rel or 'action-keyboard-follow-up-validation-' in rel:
                provenance += ' Historical form/Cancel checklist capture: three cases passed in 17.0 seconds. These images are not relabelled as successful-save focus proof; the later corrected run passed in 24.0 seconds, recorded separately. The valid fixture Action was stored; the attempted edit was not persisted.'
        if rel == 'requester-anan-owned-detail-readonly-actions-live.jpg':
            provenance += ' Requester Detail displays Public Comments and no Internal Notes section. This live image alone does not prove that the same Ticket contains an existing private note.'
        if rel == 'completion/staff-existing-private-note-visible.png':
            provenance += ' Staff sees the stored private note on TT-2026-000003. Compare the next Requester image of this same Ticket.'
        if rel == 'completion/requester-same-ticket-public-reply-private-note-hidden.png':
            provenance += ' Same Ticket: Requester sees Public Comments and an attachment, but no Internal Notes section or private note. Actual private-notes API denial: 403; cross-requester Ticket/attachment denial: 404.'
        image_segment(rel,label+'. '+provenance)

writer = PdfWriter()
for segment in segments:
    reader = PdfReader(BytesIO(segment))
    for page in reader.pages:
        writer.add_page(page)
total = len(writer.pages)
for index,page in enumerate(writer.pages,1):
    stream = BytesIO()
    width,height = float(page.mediabox.width),float(page.mediabox.height)
    cv = canvas.Canvas(stream,pagesize=(width,height))
    cv.setFont('Report',8)
    cv.setFillColor(INK)
    cv.drawString(48,22,'POST-MERGE REVIEW - final output/publication/board pending')
    cv.drawRightString(width-48,22,f'Page {index} of {total}')
    cv.save()
    page.merge_page(PdfReader(BytesIO(stream.getvalue())).pages[0])
writer.add_metadata({'/Title':'TokTickIT Lab 4 Post-Merge Evidence Review','/Subject':'Main summaries verified; complete-output/publication/board gates remain'})
with OUT.open('wb') as file:
    writer.write(file)
print(f'Created {OUT}; pages={total}; figures={figure}')
