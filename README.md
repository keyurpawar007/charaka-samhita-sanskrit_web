# Charaka Samhita Sutra Sthana — Digital Sanskrit Library

An interactive, premium web sanctuary dedicated to studying the **Charaka Samhita (Sutra Sthana)**—the foundational scripture of Ayurveda. Explore authentic Devanagari shlokas, granular grammatical Sandhi splits, English transliteration, semantic translations, and audio chants.

Live Site: [charaka-samhita.vercel.app](https://charaka-samhita.vercel.app)

---

## 🌟 Features

* **Authentic Sanskrit Shlokas**: Includes the first 15 chapters (Adhyāyas) of the *Sutra Sthana* in Devanagari script.
* **Granular Sandhi Analysis**: View word-by-word sandhi breakdowns for each verse, illustrating intermediate steps and the applied Paninian grammatical rules (e.g., *इकोयणचि*, *ससजुषो रुः*, *वृद्धिरेचि*).
* **Audio Recitations**: High-quality vocal recitations of the verses.
* **Temple Soundscape**: A meditative, ambient background audio drone that can be toggled on/off to aid focus and memorization.
* **Sacred Library Search**: Fast, client-side search engine to search verses by word, translation, or verse number.
* **Saved Verses (Bookmarks)**: Save individual shlokas to your personal library for review.
* **Aesthetics**: Sleek, glassmorphism dark-mode UI with smooth micro-animations and interactive golden floating particle canvas.

---

## 📁 Repository Structure

* `index.html` - The single-page application structure.
* `app.js` - Client-side core logic, view routing, bookmarks, search, and Web Audio API synthesizer.
* `database.js` - The complete database containing scripture details, shlokas, English translations, and sandhi mappings.
* `sandhi_db.json` - Independent JSON database file storing raw sandhi mappings.
* `styles.css` - Custom premium CSS styling, animations, and HSL color system.
* `server.js` - Clean local HTTP static server with auto-save API endpoints.
* `merge_sandhis.py` - Python script to parse `sans Research (1).pdf` and merge sandhis into the database.
* `merge_custom_mappings.py` - Python script to merge raw audio file mapping outputs.

---

## 🚀 Running Locally

To run the static server locally:

1. **Start the Node.js server**:
   ```bash
   node server.js
   ```
2. **Access the library**:
   Open [http://localhost:8080](http://localhost:8080) in your web browser.

---

## 🛠️ Data Administration

### Merging Sandhi Splits from PDF
To parse new Sanskrit Sandhis from a PDF (e.g., `sans Research (1).pdf`) and merge them into both `database.js` and `sandhi_db.json`:

1. Ensure the PDF is placed in the parent directory of this project folder.
2. Run the merge script:
   ```bash
   python merge_sandhis.py
   ```
3. The script will automatically parse, clean characters, fix visarga colons, validate shloka mappings, and save changes to disk.

---

## 🌐 Deployment

This project is optimized for deployment on Vercel. 

To deploy changes to the live site:
```bash
npx vercel --prod

```
