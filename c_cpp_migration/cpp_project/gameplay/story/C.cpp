#ifndef C_HPP
#define C_HPP

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
auto C();

} // namespace lostjump

#endif // C_HPP

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



export const C = {
  always: () => () => true,

  inSystem: (systemId) => ({ systemId: sid }) => sid === systemId,

  poiId: (poiId) => ({ poi }) => (poi.id === poiId),

  questActive: (questId) => ({ quest }) => quest.isQuestActive(questId),

  questCompleted: (questId) => ({ quest }) => quest.isQuestCompleted(questId),

  hasFlag: (flag) => ({ quest }) => quest.hasFlag(flag),

  not: (cond) => (ctx) => !cond(ctx),

  and: (...conds) => (ctx) => conds.all_of([](auto& item){ return (c; }) => c(ctx)),

  or: (...conds) => (ctx) => conds.any_of([](auto& item){ return (c; }) => c(ctx)),
};


} // namespace lostjump
