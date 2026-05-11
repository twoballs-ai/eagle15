# c_cpp_migration

Папка переведена в C++-ориентированную структуру.

## Что сделано
- Основной активный проект теперь находится в `cpp_project/`.
- Добавлен CMake-проект с исполняемым файлом `lostjump` и smoke-тестом.
- Предыдущая JS/Vite версия сохранена в `legacy_js/` как референс для поэтапного переноса механик.

## Сборка
```bash
cmake -S cpp_project -B cpp_project/build
cmake --build cpp_project/build
ctest --test-dir cpp_project/build --output-on-failure
```
