import fitz
import re
import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Devanagari digit translation helper
deva_digit_map = {'०':'0', '१':'1', '२':'2', '३':'3', '४':'4', '५':'5', '६':'6', '७':'7', '८':'8', '९':'9'}
def to_eng_num(deva_str):
    return int(''.join([deva_digit_map.get(c, c) for c in deva_str]))

def clean_sanskrit_visarga(text):
    text = re.sub(r'\s*:\s*(?=\+|$|\s)', 'ः ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_breakdown_line(line):
    m = re.search(r'\(([^)]+)\)\s*$', line)
    if m:
        rule_part = m.group(1).strip()
        sanskrit_part = line[:m.start()].strip()
    else:
        rule_part = ""
        sanskrit_part = line.strip()
    
    sanskrit_part = clean_sanskrit_visarga(sanskrit_part)
    return sanskrit_part, rule_part

def main():
    web_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.abspath(os.path.join(web_dir, "..", "sans Research (1).pdf"))
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        sys.exit(1)
        
    print(f"Loading PDF from: {pdf_path}")
    doc = fitz.open(pdf_path)
    
    parsed_raw = []
    current_chapter = 2
    current_shloka = None
    current_term = None
    current_breakdowns = []
    
    for page_idx in range(len(doc)):
        text = doc[page_idx].get_text()
        lines = text.split('\n')
        
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
                
            # Check if chapter header
            is_chapter_header = False
            if any(h in line_clean for h in ["अध्याय", "मध्याय", "ऽध्याय", "मध्यायं", "अध्यायं", "अध्यायः", "मध्यायः", "ऽध्यायः"]):
                is_chapter_header = True
            elif re.search(r'[०-९\d\s\)\.]+(?:अध्याय|मध्याय|ऽध्याय|मध्यायं|अध्यायं|अध्यायः|मध्यायः|ऽध्यायः)', line_clean):
                is_chapter_header = True
                
            if is_chapter_header:
                if current_term:
                    parsed_raw.append({
                        "chapter": current_chapter,
                        "shloka": current_shloka,
                        "term": current_term,
                        "breakdowns": current_breakdowns
                    })
                    current_term = None
                    current_breakdowns = []
                    
                ch_num_match = re.search(r'([०-९\d]+)', line_clean)
                if ch_num_match:
                    new_chapter = to_eng_num(ch_num_match.group(1))
                    if 1 <= new_chapter <= 15:
                        current_chapter = new_chapter
                        current_shloka = None
                        print(f"Page {page_idx+1}: Transitioned to Chapter {current_chapter} via header '{line_clean}'")
                continue
                
            if '+' in line_clean:
                current_breakdowns.append(line_clean)
            else:
                if current_term:
                    parsed_raw.append({
                        "chapter": current_chapter,
                        "shloka": current_shloka,
                        "term": current_term,
                        "breakdowns": current_breakdowns
                    })
                
                m = re.match(r'^\s*([०-९\d]+)\s*[\)•\.\-\s]\s*(.*)$', line_clean)
                if m:
                    current_shloka = to_eng_num(m.group(1))
                    current_term = m.group(2).strip()
                else:
                    current_term = line_clean
                current_breakdowns = []
                
    if current_term:
        parsed_raw.append({
            "chapter": current_chapter,
            "shloka": current_shloka,
            "term": current_term,
            "breakdowns": current_breakdowns
        })
        
    print(f"Parsed {len(parsed_raw)} total terms from PDF.")
    
    # Format parsed sandhi entries
    new_sandhis = {}
    for entry in parsed_raw:
        ch = entry['chapter']
        sh = entry['shloka']
        term = entry['term']
        breakdowns = entry['breakdowns']
        
        if sh is None:
            continue
            
        key = f"{ch}_{sh}"
        
        if not breakdowns:
            breakdown_val = term
            meaning_val = "Direct sandhi split."
        elif len(breakdowns) == 1:
            sansk, rule = parse_breakdown_line(breakdowns[0])
            if rule:
                breakdown_val = f"{sansk} | ( {rule} )"
            else:
                breakdown_val = sansk
            meaning_val = "Direct sandhi split."
        else:
            parsed_bds = [parse_breakdown_line(bd) for bd in breakdowns]
            breakdown_val = parsed_bds[-1][0]
            steps = []
            for sansk, rule in parsed_bds:
                if rule:
                    steps.append(f"{sansk} | ( {rule} )")
                else:
                    steps.append(sansk)
            meaning_val = f"Grammatical rules applied: {' -> '.join(steps)}"
            
        sandhi_item = {
            "term": term,
            "breakdown": breakdown_val,
            "meaning": meaning_val
        }
        
        if key not in new_sandhis:
            new_sandhis[key] = []
        new_sandhis[key].append(sandhi_item)
        
    # --- 1. MERGE INTO sandhi_db.json ---
    sandhi_json_path = os.path.join(web_dir, "sandhi_db.json")
    if os.path.exists(sandhi_json_path):
        with open(sandhi_json_path, 'r', encoding='utf-8') as f:
            existing_sandhi_json = json.load(f)
    else:
        existing_sandhi_json = {}
        
    # Merge (overwrite/add only the new keys from our parsed chapters)
    merged_sandhi_json = existing_sandhi_json.copy()
    added_keys = 0
    for key, items in new_sandhis.items():
        merged_sandhi_json[key] = items
        added_keys += 1
        
    with open(sandhi_json_path, 'w', encoding='utf-8') as f:
        json.dump(merged_sandhi_json, f, ensure_ascii=False, indent=2)
    print(f"Successfully merged {added_keys} keys permanently into sandhi_db.json!")
    
    # --- 2. MERGE INTO database.js ---
    db_path = os.path.join(web_dir, "database.js")
    with open(db_path, 'r', encoding='utf-8') as f:
        db_content = f.read()
        
    json_match = re.search(r'const SCRIPTURE_DB = (\{.*\});', db_content, re.DOTALL)
    if not json_match:
        print("Error: Could not extract SCRIPTURE_DB from database.js")
        sys.exit(1)
        
    db_json = json.loads(json_match.group(1))
    adhyayas = db_json['scriptures'][0]['adhyayas']
    
    shlokas_updated = 0
    terms_added = 0
    
    for adhyaya in adhyayas:
        ch = adhyaya['number']
        for shloka in adhyaya['shlokas']:
            sh = shloka['number']
            key = f"{ch}_{sh}"
            if key in new_sandhis:
                shloka['sandhi'] = new_sandhis[key]
                shlokas_updated += 1
                terms_added += len(new_sandhis[key])
                
    # Write back SCRIPTURE_DB to database.js
    new_db_js = f"// Charaka Samhita Complete Database\n// Auto-generated by parser (Merged custom mappings)\n\nconst SCRIPTURE_DB = {json.dumps(db_json, ensure_ascii=False, indent=2)};\n\nif (typeof module !== 'undefined' && module.exports) {{\n  module.exports = SCRIPTURE_DB;\n}}\n"
    
    with open(db_path, 'w', encoding='utf-8') as f:
        f.write(new_db_js)
        
    print(f"Successfully merged {terms_added} sandhi terms across {shlokas_updated} shlokas in database.js!")

if __name__ == '__main__':
    main()
