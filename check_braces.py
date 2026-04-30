import sys

def check_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    line_num = 1
    col_num = 1
    
    for i, char in enumerate(content):
        if char == '\n':
            line_num += 1
            col_num = 1
            continue
        
        if char in '{[(':
            stack.append((char, line_num, col_num))
        elif char in '}])':
            if not stack:
                print(f"Extra closing '{char}' at line {line_num}, column {col_num}")
                continue
            
            opening, o_line, o_col = stack.pop()
            if (opening == '{' and char != '}') or \
               (opening == '[' and char != ']') or \
               (opening == '(' and char != ')'):
                print(f"Mismatched '{char}' at line {line_num}, column {col_num}. Expected match for '{opening}' from line {o_line}, column {o_col}")
        
        col_num += 1
    
    for opening, o_line, o_col in stack:
        print(f"Unclosed '{opening}' from line {o_line}, column {o_col}")

if __name__ == "__main__":
    check_braces(sys.argv[1])
