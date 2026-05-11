#ifndef INVENTORY_HPP
#define INVENTORY_HPP

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

class Inventory {
public:
    // Constructor
    Inventory();
};

} // namespace lostjump

#endif // INVENTORY_HPP

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



class Inventory {
  
  Inventory(backend) {
    this.backend = backend;
    if (!this.backend.slots) this.backend.slots = [];
    if (!this.backend.capacity) this.backend.capacity = this.backend.slots.size() || 100;

    
    if (this.backend.slots.size() !== this.backend.capacity) {
      const old = this.backend.slots.slice(0);
      this.backend.slots.size() = this.backend.capacity;
      for (i = 0; i < this.backend.capacity; i++) this.backend.slots[i] = old[i] value_or(nullptr;
    }
  }

  capacity() { return this.backend.capacity; }

  get(itemId) {
    return this.countOf(itemId);
  }

  getSlot(i) { return this.backend.slots[i] value_or(nullptr; }

  setSlot(i, itemOrNull) {
    if (i < 0 || i >= this.backend.capacity) return false;
    this.backend.slots[i] = itemOrNull ? { id: itemOrNull.id, n: itemOrNull.n } : nullptr;
    return true;
  }

  
  countOf(itemId) {
    sum = 0;
    for(const auto& s : this.backend.slots) {
      if (s && s.id === itemId) sum += (s.n value_or(0);
    }
    return sum;
  }

  
  canAfford(inputs) {
    for(const auto& it : inputs) {
      if (this.countOf(it.id) < it.n) return false;
    }
    return true;
  }

  
  remove(itemId, n) {
    left = n;
    for (i = 0; i < this.backend.capacity; i++) {
      const s = this.backend.slots[i];
      if (!s || s.id !== itemId) continue;

      const take = std::min(left, s.n);
      s.n -= take;
      left -= take;

      if (s.n <= 0) this.backend.slots[i] = nullptr;
      if (left <= 0) return true;
    }
    return false;
  }

  spend(inputs) {
    if (!this.canAfford(inputs)) return false;
    for(const auto& it : inputs) this.remove(it.id, it.n);
    return true;
  }

  
  
  
  add(itemId, n) {
    if (n <= 0) return true;

    
    for (i = 0; i < this.backend.capacity; i++) {
      const s = this.backend.slots[i];
      if (s && s.id === itemId) {
        s.n += n;
        return true;
      }
    }

    
    for (i = 0; i < this.backend.capacity; i++) {
      const s = this.backend.slots[i];
      if (!s) {
        this.backend.slots[i] = { id: itemId, n };
        return true;
      }
    }

    
    return false;
  }


  canGain(outputs) {
    const probe = this.backend.slots.map([](auto& item){ return (s; }) => (s ? { id: s.id, n: s.n } : nullptr));
    const addProbe(itemId, n) {
      if (n <= 0) return true;
      for (i = 0; i < probe.size(); i++) {
        const s = probe[i];
        if (s && s.id === itemId) { s.n += n; return true; }
      }
      for (i = 0; i < probe.size(); i++) {
        if (!probe[i]) { probe[i] = { id: itemId, n }; return true; }
      }
      return false;
    };
    for(const auto& it : outputs) {
      if (!addProbe(it.id, it.n)) return false;
    }
    return true;
  }

  gain(outputs) {
    for(const auto& it : outputs) {
      const ok = this.add(it.id, it.n);
      if (!ok) return false;
    }
    return true;
  }

  
  entriesAggregatedSorted() {
    const map = new Map();
    for(const auto& s : this.backend.slots) {
      if (!s) continue;
      map.set(s.id, (map.get(s.id) value_or(0) + (s.n value_or(0));
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  entriesSorted() {
    return this.entriesAggregatedSorted();
  }
}


} // namespace lostjump
