import re
import os
import urllib.request
import ssl

# Bypass SSL verification
ssl._create_default_https_context = ssl._create_unverified_context

html_file = 'page_content.html'
output_dir = 'wp-content/themes/microvise/assets/img/entegrator'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to capture all image extensions including caps and webp
urls = re.findall(r'src="(https://ikasa\.com\.tr/wp-content/uploads/[^"]+\.(?:png|jpg|jpeg|webp|PNG|JPG|JPEG))"', content)

unique_urls = list(set(urls))
print(f"Found {len(unique_urls)} unique images.")

for url in unique_urls:
    filename = os.path.basename(url)
    filepath = os.path.join(output_dir, filename)
    
    # Avoid re-downloading if exists (optional, but good for speed)
    if os.path.exists(filepath):
        print(f"Skipping {filename} (already exists)")
        continue

    print(f"Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, filepath)
    except Exception as e:
        print(f"Error downloading {url}: {e}")

print("Done.")
