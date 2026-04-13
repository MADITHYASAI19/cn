import glob

html_files = glob.glob('cn_week*_notes.html')
html_files.append('index.html')

injection = """
<!-- Doubts Tracking System -->
<link rel="stylesheet" href="doubts.css">
<script src="doubts.js"></script>
"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'doubts.js' not in content:
        content = content.replace('</body>', injection + '\n</body>')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Injected in {file}')
    else:
        print(f'Already injected in {file}')
