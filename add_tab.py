import glob, re

for file in glob.glob('cn_week*_notes.html'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    if "show('doubtsView')" not in content:
        content = re.sub(
            r'(<div class="tabs">.*?</button>)\s*</div>',
            r'\1\n  <button class="tab" onclick="show(\'doubtsView\')">💭 Doubts Hub</button>\n</div>',
            content,
            flags=re.DOTALL
        )

    if 'id="doubtsView"' not in content:
        content = content.replace('<script>', '\n<!-- Doubts View -->\n<div id="doubtsView" class="sec" style="margin-top:2rem;"></div>\n<script>')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated', file)
