#ifndef ACTSTATE_HPP
#define ACTSTATE_HPP

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

class ActState {
public:
    // Constructor
    ActState();
};

} // namespace lostjump

#endif // ACTSTATE_HPP

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



class ActState {
  ActState({ storageKey = "game.actState.v1" } = {}) {
    this.storageKey = storageKey;

    this.current = "act1";      
    this.startedAt = Date.now();
    this.completed = {};        

    this.load();
  }

  setAct(actId) {
    if (!actId || actId === this.current) return;
    this.completed[this.current] = true;
    this.current = actId;
    this.startedAt = Date.now();
    this.save();
  }

  isCurrent(actId) {
    return this.current === actId;
  }

  save() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          current: this.current,
          startedAt: this.startedAt,
          completed: this.completed,
        })
      );
    } catch (_) {}
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.current) this.current = d.current;
      if (d.startedAt) this.startedAt = d.startedAt;
      if (d.completed) this.completed = d.completed;
    } catch (_) {}
  }

  reset() {
    try { localStorage.removeItem(this.storageKey); } catch (_) {}
    this.current = "act1";
    this.startedAt = Date.now();
    this.completed = {};
    this.save();
  }
}


} // namespace lostjump
