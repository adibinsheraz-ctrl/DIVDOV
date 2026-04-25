import os
import re
import json

docs_dir = r'c:\Users\HS Mobile&Computers\OneDrive\Desktop\New folder (4)\docs'
output_json = r'c:\Users\HS Mobile&Computers\OneDrive\Desktop\New folder (4)\src\data\data.json'

if not os.path.exists(os.path.dirname(output_json)):
    os.makedirs(os.path.dirname(output_json))

# Regex patterns
category_pattern = re.compile(r'^# ►? (.+)$')
subcategory_pattern = re.compile(r'^## ▷ (.+)$')
link_line_pattern = re.compile(r'^\* (.+)$')
markdown_link_pattern = re.compile(r'\[([^\]]+)\]\((https?://[^\)]+)\)')

data = []

for root, dirs, files in os.walk(docs_dir):
    for filename in files:
        if filename.endswith('.md') and filename != 'index.md':
            filepath = os.path.join(root, filename)
            rel_path = os.path.relpath(filepath, docs_dir)
            top_category = rel_path.replace('.md', '').replace('\\', ' / ')
            
            current_category = top_category
            current_subcategory = ""
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    
                for line in lines:
                    line = line.strip()
                    if not line: continue
                    
                    # Match Category
                    cat_match = category_pattern.match(line)
                    if cat_match:
                        current_category = cat_match.group(1).strip()
                        continue
                        
                    # Match Subcategory
                    sub_match = subcategory_pattern.match(line)
                    if sub_match:
                        current_subcategory = sub_match.group(1).strip()
                        continue
                    
                    # Match Link Line
                    if line.startswith('* '):
                        # Extract all links in the line
                        links = markdown_link_pattern.findall(line)
                        if links:
                            # The first link is usually the main one
                            main_name, main_url = links[0]
                            
                            # Clean name (remove bold, stars, etc)
                            main_name = main_name.replace('**', '').replace('*', '').strip()
                            
                            # Extract description (everything after the first link)
                            # Remove the markdown link from the line to get the rest
                            desc = line[2:] # remove '* '
                            desc = re.sub(r'\[([^\]]+)\]\((https?://[^\)]+)\)', '', desc, count=1).strip()
                            # Clean up description
                            desc = desc.lstrip('- ').strip()
                            
                            # Extract extra links
                            extra_links = []
                            for i in range(1, len(links)):
                                extra_links.append({'name': links[i][0], 'url': links[i][1]})
                            
                            # Extract tags (simple heuristic: look for words in parentheses or after /)
                            tags = []
                            if 'free' in line.lower(): tags.append('Free')
                            if 'open source' in line.lower() or 'foss' in line.lower(): tags.append('Open Source')
                            if 'mobile' in line.lower(): tags.append('Mobile')
                            
                            data.append({
                                'title': main_name,
                                'url': main_url,
                                'description': desc,
                                'category': current_category,
                                'subcategory': current_subcategory,
                                'extra_links': extra_links,
                                'tags': tags,
                                'source_file': rel_path
                            })
                            
            except Exception as e:
                print(f"Error parsing {filepath}: {e}")

with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print(f"Successfully converted {len(data)} resources to JSON.")
