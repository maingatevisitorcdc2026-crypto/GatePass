with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_backtick = False
start_line = -1

for i, line in enumerate(lines):
    pos = 0
    while pos < len(line):
        if line[pos] == '`' and (pos == 0 or line[pos-1] != '\\'):
            in_backtick = not in_backtick
            if in_backtick:
                start_line = i + 1
        pos += 1

if in_backtick:
    print('Unclosed backtick starting around line:', start_line)
else:
    print('All backticks balanced!')
