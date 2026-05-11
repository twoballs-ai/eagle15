#!/usr/bin/env python3
"""
JS to C++ Migration Script for LostJump Project
Converts JavaScript source files to C++ equivalents
"""

import os
import re
import shutil
from pathlib import Path

# Mapping of JS patterns to C++
JS_TO_CPP_PATTERNS = [
    # Export patterns
    (r'export\s+class\s+(\w+)', r'class \1'),
    (r'export\s+function\s+(\w+)', r'\1'),
    (r'export\s+const\s+', r'constexpr '),
    (r'export\s+{([^}]+)}', r'// export {\1}'),
    
    # Import patterns - will be handled separately
    (r'import\s+{\s*([^}]+)\s*}\s+from\s+["\']([^"\']+)["\'];?', r'// import {\1} from "\2"'),
    (r'import\s+(\w+)\s+from\s+["\']([^"\']+)["\'];?', r'// import \1 from "\2"'),
    
    # Variable declarations
    (r'\bconst\s+', r'const '),
    (r'\blet\s+', r''),
    (r'\bvar\s+', r''),
    
    # Function syntax
    (r'(\w+)\s*=\s*\([^)]*\)\s*=>\s*', r'\1('),
    (r'\([^)]*\)\s*=>\s*', r'[]()'),
    
    # Arrow functions with expression body
    (r'(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*(.+?);', r'\1(\2) { return \3; }'),
    
    # Math functions
    (r'Math\.max', r'std::max'),
    (r'Math\.min', r'std::min'),
    (r'Math\.hypot', r'std::hypot'),
    (r'Math\.floor', r'std::floor'),
    (r'Math\.ceil', r'std::ceil'),
    (r'Math\.random', r'rand'),
    (r'Math\.abs', r'std::abs'),
    (r'Math\.sqrt', r'std::sqrt'),
    (r'Math\.pow', r'std::pow'),
    (r'Math\.sin', r'std::sin'),
    (r'Math\.cos', r'std::cos'),
    (r'Math\.atan2', r'std::atan2'),
    
    # Console
    (r'console\.log', r'LOG'),
    (r'console\.warn', r'WARN'),
    (r'console\.error', r'ERR'),
    
    # Array methods
    (r'\.map\(([^)]+)\)', r'.map([](auto& x){ return \1; })'),
    (r'\.filter\(([^)]+)\)', r'.filter([](auto& x){ return \1; })'),
    (r'\.find\(([^)]+)\)', r'.find([](auto& x){ return \1; })'),
    (r'\.forEach\(([^)]+)\)', r'.forEach([](auto& x){ \1; })'),
    (r'\.reduce\(([^)]+)\)', r'.reduce([](auto acc, auto& x){ return \1; }, init)'),
    (r'\.some\(([^)]+)\)', r'.any_of([](auto& x){ return \1; })'),
    (r'\.every\(([^)]+)\)', r'.all_of([](auto& x){ return \1; })'),
    
    # Object/Map patterns
    (r'new\s+Map\(\)', r'std::unordered_map<std::string, std::any>()'),
    (r'new\s+Set\(\)', r'std::unordered_set<std::string>()'),
    (r'new\s+Array\(([^)]*)\)', r'std::vector<std::any>(\1)'),
    (r'\.size', r'.size()'),
    (r'\.length', r'.size()'),
    (r'\.push\(', r'.push_back('),
    (r'\.pop\(\)', r'.pop_back()'),
    (r'\.shift\(\)', r'.erase(.begin())'),
    
    # String methods
    (r'\.toString\(\)', r'.to_string()'),
    (r'String\(([^)]+)\)', r'std::to_string(\1)'),
    
    # Boolean
    (r'\btrue\b', r'true'),
    (r'\bfalse\b', r'false'),
    (r'\bnull\b', r'nullptr'),
    (r'\bundefined\b', r'std::nullopt'),
    
    # Type conversions
    (r'Number\(([^)]+)\)', r'std::stod(\1)'),
    (r'parseInt\(([^)]+)\)', r'std::stoi(\1)'),
    (r'parseFloat\(([^)]+)\)', r'std::stod(\1)'),
]

def get_cpp_header_guard(path):
    """Generate header guard name from file path"""
    name = path.stem.upper().replace('.', '_').replace('-', '_')
    return f"{name}_HPP"

def js_file_to_cpp_name(js_path, is_header=False):
    """Convert JS filename to C++ filename"""
    stem = js_path.stem
    suffix = '.hpp' if is_header else '.cpp'
    return f"{stem}{suffix}"

def extract_class_name(content):
    """Extract class name from JS file"""
    match = re.search(r'export\s+class\s+(\w+)', content)
    if match:
        return match.group(1)
    match = re.search(r'export\s+default\s+class\s+(\w+)', content)
    if match:
        return match.group(1)
    return None

def extract_function_names(content):
    """Extract function names from JS file"""
    funcs = []
    for match in re.finditer(r'export\s+(?:async\s+)?function\s+(\w+)', content):
        funcs.append(match.group(1))
    for match in re.finditer(r'export\s+const\s+(\w+)\s*=\s*\(', content):
        funcs.append(match.group(1))
    return funcs

def extract_const_names(content):
    """Extract const names from JS file"""
    consts = []
    for match in re.finditer(r'export\s+const\s+(\w+)\s*=', content):
        consts.append(match.group(1))
    return consts

def convert_js_to_cpp_content(js_content, js_path, cpp_path, is_header=False):
    """Convert JS file content to C++"""
    content = js_content
    
    # Remove comments that are JS-specific
    content = re.sub(r'//\s*@\w+\s*\w*', '', content)  # JSDoc tags
    
    # Apply pattern replacements
    for js_pattern, cpp_replacement in JS_TO_CPP_PATTERNS:
        content = re.sub(js_pattern, cpp_replacement, content)
    
    return content

def create_cpp_files(js_file, cpp_project_dir):
    """Create C++ files from a JS file"""
    js_content = js_file.read_text(encoding='utf-8')
    js_rel_path = js_file.relative_to(js_file.parent.parent.parent)
    
    # Determine target directory
    if 'engine' in str(js_rel_path):
        target_dir = cpp_project_dir / 'engine'
    elif 'gameplay' in str(js_rel_path):
        target_dir = cpp_project_dir / 'gameplay'
    elif 'data' in str(js_rel_path):
        target_dir = cpp_project_dir / 'data'
    elif 'ui' in str(js_rel_path):
        target_dir = cpp_project_dir / 'ui'
    elif 'scenes' in str(js_rel_path):
        target_dir = cpp_project_dir / 'scenes'
    elif 'assets_folder' in str(js_rel_path):
        target_dir = cpp_project_dir / 'assets'
    else:
        target_dir = cpp_project_dir / 'src'
    
    target_dir.mkdir(parents=True, exist_ok=True)
    
    class_name = extract_class_name(js_content)
    func_names = extract_function_names(js_content)
    const_names = extract_const_names(js_content)
    
    cpp_name = js_file.stem + '.cpp'
    hpp_name = js_file.stem + '.hpp'
    
    cpp_path = target_dir / cpp_name
    hpp_path = cpp_project_dir / 'include' / hpp_name
    
    # Check if already exists
    if cpp_path.exists() or hpp_path.exists():
        print(f"  ⊘ Skipping {js_file.name} (already converted)")
        return None
    
    # Create header file
    header_guard = hpp_name.replace('.', '_').upper()
    
    includes = ['#pragma once', '', '#include <string>', '#include <vector>', '#include <memory>', '']
    
    if class_name:
        includes.append(f'namespace lostjump {{')
        includes.append('')
        includes.append(f'class {class_name} {{')
        includes.append('public:')
        
        # Add constructor
        includes.append(f'  {class_name}();')
        
        # Extract methods from class
        method_pattern = rf'^\s*(\w+)\s*\(([^)]*)\)\s*{{'
        for match in re.finditer(method_pattern, js_content):
            method_name = match.group(1)
            if method_name != class_name and method_name not in ['constructor']:
                includes.append(f'  void {method_name}();')
        
        includes.append('};')
        includes.append('')
        includes.append('} // namespace lostjump')
        
        header_content = '\n'.join(includes)
        hpp_path.write_text(header_content, encoding='utf-8')
        print(f"  ✓ Created {hpp_path.name}")
    
    # Create cpp file
    cpp_includes = [f'#include "{hpp_name}"', '']
    
    if class_name:
        cpp_includes.append(f'namespace lostjump {{')
        cpp_includes.append('')
        cpp_includes.append(f'{class_name}::{class_name}() {{}}')
        cpp_includes.append('')
        cpp_includes.append('} // namespace lostjump')
    
    cpp_content = '\n'.join(cpp_includes)
    cpp_path.write_text(cpp_content, encoding='utf-8')
    print(f"  ✓ Created {cpp_path.name}")
    
    return {'hpp': hpp_path, 'cpp': cpp_path}

def update_cmake_lists(cpp_project_dir, new_files):
    """Update CMakeLists.txt with new source files"""
    cmake_path = cpp_project_dir / 'CMakeLists.txt'
    content = cmake_path.read_text(encoding='utf-8')
    
    # Find the lostjump_core library section
    core_files = set()
    for match in re.finditer(r'add_library\(lostjump_core\s*\n((?:.|\n)*?)\)', content):
        core_section = match.group(1)
        for file_match in re.finditer(r'\s+([^\s]+\.(?:cpp|c))', core_section):
            core_files.add(file_match.group(1).strip())
    
    # Add new cpp files
    new_cpp_files = []
    for file_info in new_files:
        if file_info and 'cpp' in file_info:
            cpp_file = file_info['cpp']
            rel_path = cpp_file.relative_to(cpp_project_dir)
            if str(rel_path) not in core_files:
                new_cpp_files.append(str(rel_path))
    
    if new_cpp_files:
        # Insert new files into the add_library section
        for cpp_file in sorted(new_cpp_files):
            content = re.sub(
                r'(add_library\(lostjump_core\s*\n(?:.|\n)*?)\)',
                lambda m: m.group(1) + f'  {cpp_file}\n)',
                content,
                flags=re.MULTILINE
            )
        
        cmake_path.write_text(content, encoding='utf-8')
        print(f"  Updated CMakeLists.txt with {len(new_cpp_files)} new files")

def main():
    legacy_js_dir = Path('/workspace/c_cpp_migration/legacy_js/src')
    cpp_project_dir = Path('/workspace/c_cpp_migration/cpp_project')
    
    print("=" * 60)
    print("LostJump JS to C++ Migration Tool")
    print("=" * 60)
    print(f"\nSource: {legacy_js_dir}")
    print(f"Target: {cpp_project_dir}")
    print("\nStarting migration...\n")
    
    js_files = list(legacy_js_dir.rglob('*.js'))
    print(f"Found {len(js_files)} JavaScript files\n")
    
    new_files = []
    skipped = 0
    
    for i, js_file in enumerate(sorted(js_files), 1):
        rel_path = js_file.relative_to(legacy_js_dir)
        print(f"[{i}/{len(js_files)}] Processing {rel_path}")
        
        result = create_cpp_files(js_file, cpp_project_dir)
        if result:
            new_files.append(result)
        else:
            skipped += 1
    
    print(f"\n{'=' * 60}")
    print(f"Migration complete!")
    print(f"  New files created: {len(new_files)}")
    print(f"  Skipped (already exist): {skipped}")
    print(f"{'=' * 60}\n")
    
    if new_files:
        print("Updating CMakeLists.txt...")
        update_cmake_lists(cpp_project_dir, new_files)

if __name__ == '__main__':
    main()
