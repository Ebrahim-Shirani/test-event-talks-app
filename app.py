from flask import Flask, render_template, jsonify
import requests
import xml.etree.ElementTree as ET

app = Flask(__name__)

FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'

def fetch_notes():
    resp = requests.get(FEED_URL, timeout=10)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    notes = []
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns).text if entry.find('atom:title', ns) is not None else ''
        link = entry.find('atom:link', ns).attrib.get('href') if entry.find('atom:link', ns) is not None else ''
        updated = entry.find('atom:updated', ns).text if entry.find('atom:updated', ns) is not None else ''
        summary = entry.find('atom:summary', ns).text if entry.find('atom:summary', ns) is not None else ''
        notes.append({
            'title': title,
            'link': link,
            'updated': updated,
            'summary': summary,
        })
    return notes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def api_notes():
    return jsonify(fetch_notes())

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
