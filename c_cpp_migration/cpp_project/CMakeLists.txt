cmake_minimum_required(VERSION 3.20)
project(LostJumpCpp VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(lostjump_core
  engine/Application.cpp
  gameplay/GameState.cpp
  data/GalaxyData.cpp
  ui/Hud.cpp
  scenes/StarSystemScene.cpp
)

target_include_directories(lostjump_core
  PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

add_executable(lostjump
  src/main.cpp
)

target_link_libraries(lostjump PRIVATE lostjump_core)

enable_testing()
add_executable(lostjump_smoke_test tests/smoke_test.cpp)
target_link_libraries(lostjump_smoke_test PRIVATE lostjump_core)
add_test(NAME smoke_test COMMAND lostjump_smoke_test)
