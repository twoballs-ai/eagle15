// data/factionRelations.js
// Relation types: "ally" | "neutral" | "hostile"

export const REL = {
  ally: "ally",
  neutral: "neutral",
  hostile: "hostile",
};

// Матрица отношений: factionA -> factionB -> relation
// По умолчанию будем считать neutral, если нет записи.
export const FACTION_RELATIONS = {
  union: {
    union: REL.ally,
    traders: REL.neutral,
    pirates: REL.hostile,
    neutral: REL.neutral,
  },

  traders: {
    union: REL.neutral,
    traders: REL.ally,
    pirates: REL.hostile,
    neutral: REL.neutral,
  },

  pirates: {
    union: REL.hostile,
    traders: REL.hostile,
    pirates: REL.ally,
    neutral: REL.hostile, // пираты враждебны всем "слабым" по дефолту
  },

  neutral: {
    union: REL.neutral,
    traders: REL.neutral,
    pirates: REL.hostile,
    neutral: REL.ally,
  },
};
