# solidity_audit_professional.py
from flask import Flask, request, redirect, url_for, render_template_string, send_file, flash
import os, json, datetime, re
from pathlib import Path
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

UPLOAD_FOLDER = 'uploads'
REPORTS_FOLDER = 'reports'
DATASET_FOLDER = 'my_dataset'
ALLOWED_EXTENSIONS = {'sol'}

for folder in [UPLOAD_FOLDER, REPORTS_FOLDER, DATASET_FOLDER]:
    Path(folder).mkdir(exist_ok=True)

app = Flask(__name__)
app.secret_key = "supersecretkey"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Hardcoded login
USERNAME = "admin"
PASSWORD = "Password123"

# ------------------------ Rule-Based Auditor ------------------------
TOP_VULNS = ['reentrancy', 'access_control', 'arithmetic', 'tx_origin', 'unchecked_send']

# Simple patterns for demo (expandable)
VULN_PATTERNS = {
    'reentrancy': r'(call|transfer|send)\s*\(',
    'access_control': r'function\s+.*\(.*\)\s+public',
    'arithmetic': r'(\+=|-=|\*|/)',
    'tx_origin': r'tx\.origin',
    'unchecked_send': r'\.send\s*\(',
}

SEVERITY = {
    'reentrancy':'High',
    'access_control':'High',
    'arithmetic':'Medium',
    'tx_origin':'High',
    'unchecked_send':'Medium'
}

FIX_SUGGESTIONS = {
    'reentrancy':'Use nonReentrant modifier or update state before external call.',
    'access_control':'Add onlyOwner modifier or proper access check.',
    'arithmetic':'Use SafeMath or Solidity >=0.8.0 checked operations.',
    'tx_origin':'Avoid tx.origin; use msg.sender for authorization.',
    'unchecked_send':'Check boolean return of send or use call with proper checks.'
}

# ------------------------ Functions ------------------------

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS


def analyze_contract(code):
    report = {'vulnerabilities':[], 'lines':[]}
    lines = code.split('\n')
    for i, line in enumerate(lines, start=1):
        for vuln, pattern in VULN_PATTERNS.items():
            if re.search(pattern,line):
                if vuln not in report['vulnerabilities']:
                    report['vulnerabilities'].append(vuln)
                report['lines'].append({'type':vuln,'line':i,'severity':SEVERITY[vuln],'fix':FIX_SUGGESTIONS[vuln]})
    return report


def save_pdf(report_id, report_data):
    filename = f"{REPORTS_FOLDER}/{report_id}.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    text = c.beginText(50,750)
    text.setFont("Times-Roman",12)
    text.textLine(f"Report ID: {report_id}")
    text.textLine(f"Generated: {datetime.datetime.now()}")
    text.textLine("")
    for v in report_data['vulnerabilities']:
        text.textLine(f"Vulnerability: {v}")
    text.textLine("")
    for l in report_data['lines']:
        text.textLine(f"Line {l['line']}: {l['type']} | Severity: {l['severity']} | Fix: {l['fix']}")
    c.drawText(text)
    c.save()
    return filename


def generate_dataset(folder_path, prefix='Proj'):
    Path(DATASET_FOLDER).mkdir(exist_ok=True)
    report_summary = []
    for f in os.listdir(folder_path):
        if f.endswith('.sol'):
            filepath = os.path.join(folder_path,f)
            with open(filepath,'r') as fi:
                code = fi.read()
            report = analyze_contract(code)
            base_name = os.path.splitext(f)[0]
            dest_path = os.path.join(DATASET_FOLDER,f)
            with open(dest_path,'w') as fo:
                fo.write(code)
            # Save report
            report_file = os.path.join(DATASET_FOLDER,f'{base_name}_report.json')
            with open(report_file,'w') as fr:
                json.dump(report,fr)
            report_summary.append({'file':f,'vulnerabilities':report['vulnerabilities']})
    return report_summary

# ------------------------ Routes ------------------------

@app.route('/', methods=['GET','POST'])
def login():
    if request.method=='POST':
        u = request.form.get('username')
        p = request.form.get('password')
        if u==USERNAME and p==PASSWORD:
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid credentials')
    return render_template_string(LOGIN_HTML)

@app.route('/dashboard', methods=['GET','POST'])
def dashboard():
    reports_list = sorted(os.listdir(REPORTS_FOLDER))
    last_result = None
    last_report_id = None
    dataset_msg = ''

    if request.method=='POST':
        # Analyze pasted code
        if 'analyze_code' in request.form:
            code = request.form.get('sol_code')
            if code.strip():
                report_id = f"report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
                result = analyze_contract(code)
                with open(f'{REPORTS_FOLDER}/{report_id}.json','w') as f:
                    json.dump(result,f)
                save_pdf(report_id,result)
                last_result = result
                last_report_id = report_id
                flash(f'Analysis complete: {report_id}')
            else:
                flash('Paste Solidity code first!')

        # Analyze uploaded file
        if 'upload_file' in request.form:
            file = request.files.get('sol_file')
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(UPLOAD_FOLDER,filename)
                file.save(filepath)
                with open(filepath,'r') as f:
                    code = f.read()
                report_id = f"report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
                result = analyze_contract(code)
                with open(f'{REPORTS_FOLDER}/{report_id}.json','w') as f:
                    json.dump(result,f)
                save_pdf(report_id,result)
                last_result = result
                last_report_id = report_id
                flash(f'File analysis complete: {filename}')
            else:
                flash('Select valid .sol file')

        # Generate dataset
        if 'generate_dataset' in request.form:
            folder = request.form.get('dataset_folder')
            if folder and os.path.exists(folder):
                summary = generate_dataset(folder)
                dataset_msg = f"Dataset generated for {len(summary)} files in '{DATASET_FOLDER}'"
            else:
                flash('Provide valid folder path for dataset generation')

    return render_template_string(DASH_HTML, reports_list=reports_list,last_result=last_result,last_report_id=last_report_id,dataset_msg=dataset_msg)

@app.route('/download/<report_id>')
def download_report(report_id):
    path = f'{REPORTS_FOLDER}/{report_id}'.replace('.json','.pdf')
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    else:
        flash('Report not found')
        return redirect(url_for('dashboard'))

# ------------------------ HTML Templates ------------------------

LOGIN_HTML = '''
<!doctype html>
<html><head><title>Login</title>
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head><body class="bg-gray-100 flex items-center justify-center h-screen">
<div class="bg-white p-8 rounded shadow-md w-96">
<h2 class="text-2xl font-bold mb-4">Login</h2>
{% with messages = get_flashed_messages() %}{% if messages %}<ul class="text-red-500">{% for msg in messages %}<li>{{ msg }}</li>{% endfor %}</ul>{% endif %}{% endwith %}
<form method="POST">
<input type="text" name="username" placeholder="Username" class="border p-2 w-full mb-2" required>
<input type="password" name="password" placeholder="Password" class="border p-2 w-full mb-4" required>
<button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded w-full">Login</button>
</form></div></body></html>'''

DASH_HTML = '''
<!doctype html>
<html><head><title>Solidity Audit Dashboard</title>
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head><body class="bg-gray-100">
<div class="p-4">
<h1 class="text-3xl font-bold mb-4">Solidity Audit Dashboard</h1>
{% with messages = get_flashed_messages() %}{% if messages %}<ul class="text-red-500">{% for msg in messages %}<li>{{ msg }}</li>{% endfor %}</ul>{% endif %}{% endwith %}
<div class="grid grid-cols-2 gap-4">
<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-2">Paste Solidity Code</h2>
<form method="POST"><textarea name="sol_code" class="border p-2 w-full h-48 mb-2" placeholder="Paste your contract here"></textarea>
<button name="analyze_code" class="bg-blue-500 text-white px-4 py-2 rounded">Analyze</button></form>
<h2 class="font-bold mt-4 mb-2">Upload .sol File</h2>
<form method="POST" enctype="multipart/form-data">
<input type="file" name="sol_file" class="mb-2"/><br>
<button name="upload_file" class="bg-green-500 text-white px-4 py-2 rounded">Upload & Analyze</button>
</form></div>
<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-2">Dataset Generator</h2>
<form method="POST">
<input type="text" name="dataset_folder" placeholder="Path to folder with .sol files" class="border p-2 w-full mb-2"/>
<button name="generate_dataset" class="bg-purple-500 text-white px-4 py-2 rounded">Generate Dataset</button>
</form>
<p class="mt-2 text-gray-600">{{ dataset_msg }}</p>
<h2 class="font-bold mt-4 mb-2">Reports</h2>
<ul>{% for r in reports_list %}
<li>{{ r }} - <a href="{{ url_for('download_report', report_id=r) }}" class="text-blue-500">Download PDF</a></li>
{% endfor %}</ul>
</div></div>
{% if last_result %}<div class="bg-white p-4 mt-4 rounded shadow"><h2 class="font-bold mb-2">Last Analysis ({{ last_report_id }})</h2><pre>{{ last_result|tojson(indent=2) }}</pre></div>{% endif %}
</div></body></html>'''

# ------------------------ Run App ------------------------

if __name__=='__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
