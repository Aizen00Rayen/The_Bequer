import os
import glob

search_path = os.path.join("c:\\", "Users", "HP", "Desktop", "bequer-brand", "frontend", "src", "**", "*.tsx")
search_path_ts = os.path.join("c:\\", "Users", "HP", "Desktop", "bequer-brand", "frontend", "src", "**", "*.ts")

files = glob.glob(search_path, recursive=True) + glob.glob(search_path_ts, recursive=True)

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'http://127.0.0.1:8000' in content:
        # replace with empty string so it maps to the same domain (which will be proxied by nginx)
        new_content = content.replace('http://127.0.0.1:8000', '')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += 1
        print(f"Updated: {f}")

print(f"\nModified {count} files.")
