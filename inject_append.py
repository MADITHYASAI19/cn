import glob

html_files = glob.glob('cn_week*_notes.html')

injection = """
<!-- Doubts Tracking System -->
<link rel="stylesheet" href="doubts.css">
<script src="doubts.js"></script>
"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'doubts.js' not in content:
        with open(file, 'a', encoding='utf-8') as f:
            f.write(injection)
        print(f'Appended to {file}')
    else:
        print(f'Already in {file}')
