import glob
import re

def reverse_glass_theme():
    files_updated = 0
    
    # We want to reverse what the previous script did:
    # slate-900 -> white/90
    # slate-800 -> white/80
    # slate-700 -> white/70
    # slate-600 -> white/50
    # slate-500 -> white/40
    # slate-400 -> white/30
    
    slate_to_white = {
        "text-slate-900": "text-white/90",
        "text-slate-800": "text-white/80",
        "text-slate-700": "text-white/70",
        "text-slate-600": "text-white/50",
        "text-slate-500": "text-white/40",
        "text-slate-400": "text-white/30",
    }

    def replace_slate(match):
        prefix = match.group(1)
        slate_class = match.group(2)
        suffix = match.group(3)
        
        replacement = slate_to_white.get(slate_class, "text-white/80")
        return f"{prefix}{replacement}{suffix}"

    for filepath in glob.iglob('src/**/*.tsx', recursive=True):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'isGlass' in line:
                # 1. Revert text-slate-*
                prev_line = ""
                while prev_line != line:
                    prev_line = line
                    # Look for text-slate-XYZ inside the true-branch of an isGlass ternary
                    line = re.sub(
                        r"(isGlass\s*\?\s*['`][^'`]*?)(text-slate-\d+)([^'`]*?['`]\s*:)", 
                        replace_slate, 
                        line
                    )
                
                # 2. Revert background opacities (we made them higher for light themes, we want them lower for dark)
                line = re.sub(r"bg-white/40", "bg-white/10", line)
                line = re.sub(r"bg-white/50", "bg-white/10", line)
                line = re.sub(r"bg-white/60", "bg-white/15", line)
                
                # 3. Revert border opacities
                line = re.sub(r"border-white/30", "border-white/10", line)
                line = re.sub(r"border-white/40", "border-white/10", line)
                line = re.sub(r"border-white/50", "border-white/20", line)

            lines[i] = line
                
        new_content = '\n'.join(lines)

        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
            files_updated += 1
            
    print(f"Total files reversed: {files_updated}")

if __name__ == "__main__":
    reverse_glass_theme()
