#include <iostream>
#include <memory>

namespace lostjump {

class Game {
public:
    void run() {
        std::cout << "LostJump C++ Edition" << std::endl;
        std::cout << "All systems operational!" << std::endl;
    }
};

} // namespace lostjump

int main(int argc, char* argv[]) {
    std::cout << "Starting LostJump..." << std::endl;
    
    lostjump::Game game;
    game.run();
    
    return 0;
}
