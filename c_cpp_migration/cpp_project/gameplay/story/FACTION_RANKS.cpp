#ifndef FACTION_RANKS_HPP
#define FACTION_RANKS_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

// Function declaration
auto FACTION_RANKS();

} // namespace lostjump

#endif // FACTION_RANKS_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>



export const FACTION_RANKS = {
  outsider: { id: "outsider", name: "Outsider", level: 0 },
  recruit:  { id: "recruit",  name: "Recruit",  level: 1 },
  member:   { id: "member",   name: "Member",   level: 2 },
  officer:  { id: "officer",  name: "Officer",  level: 3 },
  elite:    { id: "elite",    name: "Elite",    level: 4 },
  leader:   { id: "leader",   name: "Leader",   level: 5 },
};


} // namespace lostjump
