import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def check_ogg_metadata(file_path):
    print(f"\nFile: {os.path.basename(file_path)}")
    try:
        with open(file_path, 'rb') as f:
            data = f.read(2048) # Read first 2KB
            
            # Print printable ASCII characters in the first 2KB
            ascii_chars = []
            for b in data:
                if 32 <= b <= 126:
                    ascii_chars.append(chr(b))
                else:
                    ascii_chars.append('.')
            text = ''.join(ascii_chars)
            print("Printable characters:")
            print(text[:500])
            
            # Check if there is any standard tag like "OpusTags"
            if b'OpusTags' in data:
                print("Found OpusTags!")
                idx = data.find(b'OpusTags')
                print(data[idx:idx+150])
            if b'OggS' in data:
                print("Found OggS header")
    except Exception as e:
        print(f"Error checking file: {e}")

if __name__ == '__main__':
    base_dir = "d:/advait aai/1st"
    files = sorted([f for f in os.listdir(base_dir) if f.endswith('.ogg')])
    if files:
        for f in files[:3]:
            check_ogg_metadata(os.path.join(base_dir, f))
