# bq‑releases‑notes

A lightweight Flask web application that displays Google BigQuery release notes in a modern, interactive UI.

---

## ✨ Features

- **Server side** – fetches the official BigQuery release‑notes Atom feed, parses XML, and exposes a JSON API.
- **Client side** – dynamic list of notes, modal view with details, and a *Tweet this* button.
- **Polished UI** – glass‑morphism modal, smooth transitions and a loading spinner.
- **Refreshable** – users can manually refresh the notes list.

---

## 📦 Project Structure

```
│
├─ app.py                     # Flask app & API implementation
├─ requirements.txt           # Python dependencies (Flask, requests)
├─ templates/
│   └─ index.html            # Single‑page HTML template
└─ static/
    ├─ css/style.css         # Styling (glass‑morphism, layout)
    └─ js/app.js            # UI logic – fetch notes, render list, modal handling
```

---

## 🛠️ Setup & Running Locally

```bash
# 1. Clone (already inside workspace)
cd /media/sam/workspace/projects/agy-cli-projects/bq-releases-notes

# 2. (Optional) create a virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the development server
python app.py
```

The app will be available at `http://localhost:5000`. Open that URL in a browser to see the UI.

---

## 🌐 API

- **GET /** – renders the HTML page.
- **GET /api/notes** – returns a JSON array of notes, each with:
  ```json
  {
    "title": "<note title>",
    "link": "<URL to full release note>",
    "updated": "<ISO timestamp>",
    "summary": "<short description>"
  }
  ```

---

## 🧩 How It Works

1. **Server** – `fetch_notes()` requests the Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`), parses it with `xml.etree.ElementTree`, and builds a list of plain dictionaries.
2. **Client** – `app.js` calls `/api/notes` via `fetch`, displays each note title and timestamp, and opens a modal with full details when a note is clicked.
3. **Modal** – includes a *Tweet this* button that opens Twitter's intent URL pre‑filled with the note title and link.

---

## 🧪 Development & Testing

- The server runs in debug mode (`app.run(debug=True)`), so changes to Python code auto‑reload.
- Front‑end changes are hot‑reloaded by refreshing the browser page.
- Use `curl http://localhost:5000/api/notes` to verify the JSON payload.

---

## 📜 License

This project is provided under the MIT License – feel free to use, modify, and distribute.
