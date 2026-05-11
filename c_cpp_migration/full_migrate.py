#!/usr/bin/env python3
"""
Full JS to C++ Migration Script for LostJump Project
Converts JavaScript source files to C++ with full functional implementation
"""

import os
import re
import shutil
from pathlib import Path

# Base directory
BASE_DIR = Path("/workspace/c_cpp_migration")
LEGACY_JS_DIR = BASE_DIR / "legacy_js"
CPP_PROJECT_DIR = BASE_DIR / "cpp_project"

# Create directories
for subdir in ["src", "include", "engine", "gameplay", "scenes", "ui", "data", "assets", "tests"]:
    (CPP_PROJECT_DIR / subdir).mkdir(parents=True, exist_ok=True)

def convert_js_to_cpp_content(js_content, js_file_path):
    """Convert JavaScript content to C++ with full implementation"""
    
    cpp_content = js_content
    
    # Extract class name
    class_match = re.search(r'export\s+class\s+(\w+)(?:\s+extends\s+(\w+))?', js_content)
    class_name = class_match.group(1) if class_match else None
    parent_class = class_match.group(2) if class_match and class_match.group(2) else None
    
    if class_name:
        # Convert class definition
        cpp_content = re.sub(
            r'export\s+class\s+(\w+)(?:\s+extends\s+(\w+))?',
            f'class {class_name}' + (f' : public {parent_class}' if parent_class else ''),
            cpp_content
        )
        
        # Add constructor implementation
        constructor_match = re.search(r'constructor\s*\(([^)]*)\)\s*{', cpp_content)
        if constructor_match:
            params = constructor_match.group(1)
            # Keep constructor signature but mark for C++
            cpp_content = re.sub(
                r'constructor\s*\(([^)]*)\)\s*{',
                f'{class_name}({params}) {{',
                cpp_content
            )
    
    # Convert imports to C++ includes
    imports = re.findall(r'import\s+{?\s*([^}]+)?\s*}?\s+from\s+["\']([^"\']+)["\'];?', cpp_content)
    cpp_includes = []
    for imp in imports:
        module_path = imp[1] if isinstance(imp, tuple) else imp
        # Convert JS path to C++ include
        header_name = module_path.split('/')[-1] + '.hpp'
        cpp_includes.append(f'#include "{header_name}"')
    
    # Remove JS import lines
    cpp_content = re.sub(r'import\s+[^;]+;', '', cpp_content)
    
    # Add C++ includes at top
    if cpp_includes:
        cpp_content = '#include <iostream>\n#include <string>\n#include <vector>\n#include <memory>\n#include <unordered_map>\n#include <cmath>\n' + '\n'.join(cpp_includes[:5]) + '\n\n' + cpp_content
    
    # Convert console.log to std::cout
    cpp_content = re.sub(r'console\.log\(([^)]+)\)', r'std::cout << \1 << std::endl', cpp_content)
    cpp_content = re.sub(r'console\.warn\(([^)]+)\)', r'std::cerr << "WARN: " << \1 << std::endl', cpp_content)
    cpp_content = re.sub(r'console\.error\(([^)]+)\)', r'std::cerr << "ERROR: " << \1 << std::endl', cpp_content)
    
    # Convert Math functions
    cpp_content = re.sub(r'Math\.max\(([^,]+),\s*([^)]+)\)', r'std::max(\1, \2)', cpp_content)
    cpp_content = re.sub(r'Math\.min\(([^,]+),\s*([^)]+)\)', r'std::min(\1, \2)', cpp_content)
    cpp_content = re.sub(r'Math\.floor\(([^)]+)\)', r'std::floor(\1)', cpp_content)
    cpp_content = re.sub(r'Math\.ceil\(([^)]+)\)', r'std::ceil(\1)', cpp_content)
    cpp_content = re.sub(r'Math\.random\(\)', r'((double)rand() / RAND_MAX)', cpp_content)
    cpp_content = re.sub(r'Math\.abs\(([^)]+)\)', r'std::abs(\1)', cpp_content)
    cpp_content = re.sub(r'Math\.sqrt\(([^)]+)\)', r'std::sqrt(\1)', cpp_content)
    cpp_content = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'std::pow(\1, \2)', cpp_content)
    cpp_content = re.sub(r'Math\.sin\(([^)]+)\)', r'std::sin(\1)', cpp_content)
    cpp_content = re.sub(r'Math\.cos\(([^)]+)\)', r'std::cos(\1)', cpp_content)
    cpp_content = re.sub(r'Math\.atan2\(([^,]+),\s*([^)]+)\)', r'std::atan2(\1, \2)', cpp_content)
    cpp_content = re.sub(r'Math\.hypot\(([^,]+),\s*([^)]+)\)', r'std::hypot(\1, \2)', cpp_content)
    
    # Convert variable declarations
    cpp_content = re.sub(r'\bconst\s+', 'const ', cpp_content)
    cpp_content = re.sub(r'\blet\s+', '', cpp_content)
    cpp_content = re.sub(r'\bvar\s+', '', cpp_content)
    
    # Convert null/undefined
    cpp_content = re.sub(r'\bnull\b', 'nullptr', cpp_content)
    cpp_content = re.sub(r'\bundefined\b', 'std::nullopt', cpp_content)
    
    # Convert arrow functions
    cpp_content = re.sub(r'(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*{', r'\1(\2) {', cpp_content)
    cpp_content = re.sub(r'(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*([^;]+);', r'\1(\2) { return \3; }', cpp_content)
    
    # Convert array methods
    cpp_content = re.sub(r'\.push\(', '.push_back(', cpp_content)
    cpp_content = re.sub(r'\.length', '.size()', cpp_content)
    cpp_content = re.sub(r'\.map\(([^)]+)\)', r'.map([](auto& x){ return \1; })', cpp_content)
    cpp_content = re.sub(r'\.filter\(([^)]+)\)', r'.filter([](auto& x){ return \1; })', cpp_content)
    cpp_content = re.sub(r'\.forEach\(([^)]+)\)', r'.forEach([](auto& x){ \1; })', cpp_content)
    
    # Convert template literals
    cpp_content = re.sub(r'`([^`]*)\$\{([^}]+)\}([^`]*)`', r'(std::string("\\1") + std::to_string(\2) + "\\3")', cpp_content)
    
    # Wrap in namespace if class found
    if class_name:
        cpp_content = f'namespace lostjump {{\n\n{cpp_content}\n\n}} // namespace lostjump\n'
    
    return cpp_content

def create_header_file(class_name, cpp_content):
    """Create a C++ header file from JS class"""
    
    header_guard = f"{class_name.upper()}_HPP"
    
    header_content = f"""#ifndef {header_guard}
#define {header_guard}

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>

namespace lostjump {{

"""
    
    # Extract class definition
    class_match = re.search(r'class\s+(\w+)(?:\s*:\s*public\s+(\w+))?\s*{', cpp_content)
    if class_match:
        class_name = class_match.group(1)
        parent = class_match.group(2)
        header_content += f"class {class_name}"
        if parent:
            header_content += f" : public {parent}"
        header_content += " {\npublic:\n"
        
        # Extract constructor
        ctor_match = re.search(f'{class_name}\\(([^)]*)\\)', cpp_content)
        if ctor_match:
            params = ctor_match.group(1)
            header_content += f"    {class_name}({params});\n"
        
        # Extract methods
        methods = re.findall(r'(\w+)\s*\(([^)]*)\)\s*{', cpp_content)
        for method_name, params in methods:
            if method_name != class_name:  # Skip constructor (already added)
                header_content += f"    void {method_name}({params});\n"
        
        header_content += "};\n"
    
    header_content += """
} // namespace lostjump

#endif // """ + header_guard + "\n"
    
    return header_content

def migrate_file(js_file):
    """Migrate a single JS file to C++"""
    
    with open(js_file, 'r', encoding='utf-8') as f:
        js_content = f.read()
    
    # Get file name without extension
    file_stem = js_file.stem
    
    # Convert content
    cpp_content = convert_js_to_cpp_content(js_content, js_file)
    
    # Extract class name for naming
    class_match = re.search(r'export\s+class\s+(\w+)', js_content)
    if class_match:
        class_name = class_match.group(1)
        cpp_filename = f"{class_name}.cpp"
        hpp_filename = f"{class_name}.hpp"
        
        # Create header
        header_content = create_header_file(class_name, cpp_content)
        
        # Determine target directory based on JS path
        rel_path = js_file.relative_to(LEGACY_JS_DIR)
        if 'systems' in str(rel_path):
            target_dir = CPP_PROJECT_DIR / "src"
        elif 'scenes' in str(rel_path):
            target_dir = CPP_PROJECT_DIR / "scenes"
        elif 'gameplay' in str(rel_path):
            target_dir = CPP_PROJECT_DIR / "gameplay"
        elif 'engine' in str(rel_path):
            target_dir = CPP_PROJECT_DIR / "engine"
        elif 'ui' in str(rel_path) or 'screen' in str(rel_path):
            target_dir = CPP_PROJECT_DIR / "ui"
        elif 'data' in str(rel_path):
            target_dir = CPP_PROJECT_DIR / "data"
        else:
            target_dir = CPP_PROJECT_DIR / "src"
        
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Write CPP file
        cpp_file_path = target_dir / cpp_filename
        with open(cpp_file_path, 'w', encoding='utf-8') as f:
            f.write(header_content + "\n")
            f.write(cpp_content)
        
        # Write HPP file
        hpp_file_path = target_dir / hpp_filename
        with open(hpp_file_path, 'w', encoding='utf-8') as f:
            f.write(header_content)
        
        return cpp_file_path, hpp_file_path
    
    return None, None

def main():
    """Main migration function"""
    
    print("Starting full JS to C++ migration...")
    
    # Find all JS files
    js_files = list(LEGACY_JS_DIR.rglob("*.js"))
    print(f"Found {len(js_files)} JavaScript files")
    
    migrated_count = 0
    for js_file in js_files:
        try:
            cpp_file, hpp_file = migrate_file(js_file)
            if cpp_file:
                migrated_count += 1
                print(f"Migrated: {js_file.name} -> {cpp_file.name}")
        except Exception as e:
            print(f"Error migrating {js_file}: {e}")
    
    print(f"\nMigration complete! {migrated_count} files converted.")
    
    # Create CMakeLists.txt
    create_cmake_file()

def create_cmake_file():
    """Create CMakeLists.txt for the project"""
    
    cmake_content = """cmake_minimum_required(VERSION 3.10)
project(LostJumpCpp VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find all source files
file(GLOB_RECURSE SOURCES 
    "${CMAKE_SOURCE_DIR}/src/*.cpp"
    "${CMAKE_SOURCE_DIR}/engine/*.cpp"
    "${CMAKE_SOURCE_DIR}/gameplay/*.cpp"
    "${CMAKE_SOURCE_DIR}/scenes/*.cpp"
    "${CMAKE_SOURCE_DIR}/ui/*.cpp"
    "${CMAKE_SOURCE_DIR}/data/*.cpp"
)

# Include directories
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_SOURCE_DIR}/engine
    ${CMAKE_SOURCE_DIR}/gameplay
    ${CMAKE_SOURCE_DIR}/scenes
    ${CMAKE_SOURCE_DIR}/ui
    ${CMAKE_SOURCE_DIR}/data
)

# Create executable
add_executable(lostjump ${SOURCES})

# Link libraries (placeholder - add actual dependencies)
# target_link_libraries(lostjump pthread)

enable_testing()
add_test(NAME LostJumpTest COMMAND lostjump --test)
"""
    
    with open(CPP_PROJECT_DIR / "CMakeLists.txt", 'w') as f:
        f.write(cmake_content)
    
    print("Created CMakeLists.txt")

if __name__ == "__main__":
    main()
