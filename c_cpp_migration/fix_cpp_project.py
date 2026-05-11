#!/usr/bin/env python3
"""
Fix C++ project structure - create missing headers and fix includes
"""

import os
import re
from pathlib import Path

def find_all_cpp_files(project_dir):
    """Find all .cpp files that need headers"""
    cpp_files = []
    for pattern in ['**/*.cpp', '**/*.c']:
        cpp_files.extend(project_dir.glob(pattern))
    return [f for f in cpp_files if 'build' not in str(f)]

def extract_class_or_functions(cpp_content):
    """Extract class name or function declarations from cpp file"""
    classes = re.findall(r'^namespace lostjump\s*\{\s*\n\s*(\w+)::', cpp_content, re.MULTILINE)
    if classes:
        return {'type': 'class', 'name': classes[0]}
    
    funcs = re.findall(r'^\w+\s+(\w+)\s*\([^)]*\)\s*\{', cpp_content, re.MULTILINE)
    return {'type': 'functions', 'names': funcs}

def create_header_file(cpp_path, include_dir):
    """Create a header file for a cpp file if missing"""
    cpp_name = cpp_path.stem
    hpp_path = include_dir / f"{cpp_name}.hpp"
    
    if hpp_path.exists():
        return None
    
    cpp_content = cpp_path.read_text(encoding='utf-8')
    
    # Check if it's a simple stub
    if '#include' in cpp_content and len(cpp_content.strip()) < 50:
        # It's just an include, create minimal header
        header_content = f"""#pragma once

namespace lostjump {{

// Forward declaration for {cpp_name}

}} // namespace lostjump
"""
    else:
        # Try to extract class info
        classes = re.findall(r'namespace lostjump\s*\{{\s*\n\s*(\w+)::\w+', cpp_content)
        if classes:
            class_name = classes[0]
            header_content = f"""#pragma once

namespace lostjump {{

class {class_name} {{
public:
  {class_name}();
}};

}} // namespace lostjump
"""
        else:
            # Generic header with common includes
            header_content = f"""#pragma once

#include <string>
#include <vector>
#include <memory>

namespace lostjump {{

// Declarations for {cpp_name}

}} // namespace lostjump
"""
    
    hpp_path.write_text(header_content, encoding='utf-8')
    return hpp_path

def main():
    cpp_project_dir = Path('/workspace/c_cpp_migration/cpp_project')
    include_dir = cpp_project_dir / 'include'
    
    print("Fixing C++ project structure...")
    print("=" * 60)
    
    cpp_files = find_all_cpp_files(cpp_project_dir)
    print(f"Found {len(cpp_files)} C++ source files\n")
    
    created_headers = []
    
    for cpp_file in cpp_files:
        cpp_name = cpp_file.stem
        hpp_path = include_dir / f"{cpp_name}.hpp"
        
        if not hpp_path.exists():
            result = create_header_file(cpp_file, include_dir)
            if result:
                created_headers.append(result)
                print(f"  ✓ Created {result.name}")
    
    print(f"\n{'=' * 60}")
    print(f"Created {len(created_headers)} missing header files")
    print(f"{'=' * 60}\n")

if __name__ == '__main__':
    main()
