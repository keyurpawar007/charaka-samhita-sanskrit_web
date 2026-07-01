import zipfile
import xml.etree.ElementTree as ET
import os
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def read_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = []
            for para in root.findall('.//w:p', ns):
                text_elems = para.findall('.//w:t', ns)
                if text_elems:
                    text = ''.join([t.text for t in text_elems if t.text])
                    paragraphs.append(text)
            return paragraphs
    except Exception as e:
        return [f"Error reading docx: {str(e)}"]

deva_digit_map = {'०':'0', '१':'1', '२':'2', '३':'3', '४':'4', '५':'5', '६':'6', '७':'7', '८':'8', '९':'9'}
def to_eng_num(deva_str):
    return ''.join([deva_digit_map.get(c, c) for c in deva_str])

def parse_shlokas(paragraphs):
    shlokas = []
    current_text = []
    shloka_num_pat = re.compile(r'(?:\|\||\|)\s*([\d\u0966-\u096f]+)\s*(?:\|\||\|)?\s*$')
    
    for idx, p in enumerate(paragraphs):
        p_clean = p.strip()
        if not p_clean:
            continue
        m = shloka_num_pat.search(p_clean)
        if m:
            num_str = m.group(1)
            eng_num = int(to_eng_num(num_str))
            p_text = p_clean[:m.start()].strip()
            if p_text:
                current_text.append(p_text)
            shloka_content = '\n'.join(current_text)
            if "इत्यग्निवेशकृते" in shloka_content or "अध्यायः" in shloka_content:
                current_text = []
                continue
            shlokas.append({
                'number': eng_num,
                'sanskrit': shloka_content,
                'para_idx': idx
            })
            current_text = []
        else:
            current_text.append(p_clean)
            
    return shlokas

if __name__ == '__main__':
    base_dir = "d:/advait aai"
    docx_path = os.path.join(base_dir, "1   .docx")
    paras = read_docx(docx_path)
    shlokas = parse_shlokas(paras)
    
    print(f"Parsed {len(shlokas)} shlokas from 1   .docx")
    
    # Check if any numbers are skipped or repeated
    numbers = [s['number'] for s in shlokas]
    print("Parsed shloka numbers:", numbers)
    
    # Find gaps or duplicates
    expected = 1
    for idx, num in enumerate(numbers):
        if num != expected:
            print(f"Mismatch at index {idx}: Expected {expected}, got {num} (Sanskrit: '{shlokas[idx]['sanskrit'][:30]}...')")
            expected = num + 1
        else:
            expected += 1
