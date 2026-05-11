cmake_minimum_required(VERSION 3.15)
project(LostJumpCpp VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find all source files recursively
file(GLOB_RECURSE SOURCES
    "${CMAKE_SOURCE_DIR}/src/*.cpp"
    "${CMAKE_SOURCE_DIR}/engine/**/*.cpp"
    "${CMAKE_SOURCE_DIR}/gameplay/**/*.cpp"
    "${CMAKE_SOURCE_DIR}/scenes/**/*.cpp"
    "${CMAKE_SOURCE_DIR}/ui/**/*.cpp"
    "${CMAKE_SOURCE_DIR}/data/**/*.cpp"
    "${CMAKE_SOURCE_DIR}/tests/**/*.cpp"
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

# Main executable
add_executable(lostjump
    src/main.cpp
    ${SOURCES}
)

message(STATUS "Total source files: ${SOURCES}")
