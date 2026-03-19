import glob
import re

def update_glass_theme():
    # Current working directory is 'C:\Users\PEDI\OneDrive\Documents\Hieu\spending_plus\frontend'
    # So the path should just be 'src/**/*.tsx'
    files_updated = 0
    
    # White opacity to slate opacity mapping
    opacity_map = {
        "": "900",       # text-white -> text-slate-900
        "90": "900",     # text-white/90 -> text-slate-900
        "80": "800",
        "70": "700",
        "60": "700",
        "50": "600",
        "40": "500",
        "30": "400"
    }

    def replace_text_white(match):
        prefix = match.group(1)
        opacity = match.group(2) or ""
        suffix = match.group(3)
        
        slate_weight = opacity_map.get(opacity, "800")
        return f"{prefix}text-slate-{slate_weight}{suffix}"

    for filepath in glob.iglob('src/**/*.tsx', recursive=True):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content
        
        # We process line by line to keep it simple and safe
        lines = new_content.split('\n')
        for i, line in enumerate(lines):
            if 'isGlass' in line:
                # 1. Replace text-white/... strictly inside the true-branch of an isGlass ternary
                # This regex captures:
                # Group 1: The 'isGlass ?' part, opening quote, and any leading classes (e.g. `isGlass ? 'font-bold `)
                # Group 2: The opacity number (if any)
                # Group 3: The rest of the classes in the true branch and the closing quote and colon
                # We use a loop in case there are multiple text-white classes in one string
                prev_line = ""
                while prev_line != line:
                    prev_line = line
                    line = re.sub(
                        r"(isGlass\s*\?\s*['`][^'`]*?)text-white(?:/([0-9]+))?([^'`]*?['`]\s*:)", 
                        replace_text_white, 
                        line
                    )
                
                # 2. For light background, we need frosted glass to be darker/whiter to be visible
                # bg-white/5 -> bg-white/40
                line = re.sub(r"bg-white/5(?![0-9])", "bg-white/40", line)
                line = re.sub(r"bg-white/10(?![0-9])", "bg-white/50", line)
                line = re.sub(r"bg-white/20(?![0-9])", "bg-white/60", line)
                
                # border-white/x -> higher opacity
                line = re.sub(r"border-white/5(?![0-9])", "border-white/30", line)
                line = re.sub(r"border-white/10(?![0-9])", "border-white/40", line)
                line = re.sub(r"border-white/20(?![0-9])", "border-white/50", line)
                
            lines[i] = line
                
        new_content = '\n'.join(lines)

        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
            files_updated += 1
            
    print(f"Total files updated: {files_updated}")

if __name__ == "__main__":
    update_glass_theme()
