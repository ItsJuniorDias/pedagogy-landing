// -----------------------------------------------------------------------------
// stories.index.js — the bridge between the story GRID (catalog cards) and the
// story REGISTRY (actual chapter content).
//
// Why this file exists: the grid cards use short, irregular ids
// ("thevowelvillage", "thefieldguide") that do NOT match the registry keys
// ("THE_VOWEL_VILLAGE", "THE_FIELD_GUIDE_TO_IMPOSSIBLE_CREATURES"). The mapping
// can't be derived programmatically, so it lives here as an explicit, verified
// table. data.stories.js stays pristine (a faithful copy of the source mocks);
// all the wiring lives here.
//
// Resolution rules for a grid id:
//   1. If it's in GRID_TO_REGISTRY  → playable (full chapters).
//   2. Else if the id IS a registry key → legacy entry (chapters are []).
//   3. Else → missing (no content yet).
// Anything without chapters renders a friendly "coming soon" state, never a crash.
// -----------------------------------------------------------------------------

import { STORIES_GRID, STORY_REGISTRY } from './data.stories.js'

export { STORIES_GRID, STORY_REGISTRY }

// Verified card-id → registry-key map (34 fully-written stories).
export const GRID_TO_REGISTRY = {
  thevowelvillage: 'THE_VOWEL_VILLAGE',
  theclockworkdetective: 'THE_CLOCKWORK_DETECTIVE',
  theunderwaterexplorers: 'THE_UNDERWATER_EXPLORERS',
  thefeelingsGarden: 'THE_FEELINGS_GARDEN',
  therobotsjournal: 'THE_ROBOTS_JOURNAL',
  themapmakersdaughter: 'THE_MAPMAKERS_DAUGHTER',
  thewordcollector: 'THE_WORD_COLLECTOR',
  thelighthousekeepersson: 'THE_LIGHTHOUSE_KEEPERS_SON',
  thegrandmothersrecipebox: 'THE_GRANDMOTHERS_RECIPE_BOX',
  thefieldguide: 'THE_FIELD_GUIDE_TO_IMPOSSIBLE_CREATURES',
  thescienceofsmallwonders: 'THE_SCIENCE_OF_SMALL_WONDERS',
  thecloudreader: 'THE_CLOUD_READER',
  thetimelibrary: 'THE_TIME_LIBRARY',
  thegiantwhowept: 'THE_GIANT_WHO_WEPT_MOUNTAINS',
  theartofbeing: 'THE_ART_OF_BEING_WRONG',
  theinsectorchestra: 'THE_INSECT_ORCHESTRA',
  thesandcastlearchitect: 'THE_SANDCASTLE_ARCHITECT',
  thecolourthief: 'THE_COLOUR_THIEF',
  theslowtrainexpresses: 'THE_SLOW_TRAIN_EXPRESS',
  thespellchecker: 'THE_SPELL_CHECKER',
  thevolcanologist: 'THE_YOUNG_VOLCANOLOGIST',
  thenightgarden: 'THE_NIGHT_GARDEN',
  theforgottenalphabet: 'THE_FORGOTTEN_ALPHABET',
  thebeekeeper: 'THE_LAST_BEEKEEPER',
  theislandofmists: 'THE_ISLAND_OF_MISTS',
  thecityofclocks: 'THE_CITY_OF_CLOCKS',
  thecoralqueen: 'THE_CORAL_QUEEN',
  theglasscomposer: 'THE_GLASS_COMPOSER',
  thewindmapper: 'THE_WIND_MAPPER',
  theanimalwhisperer: 'THE_ANIMAL_WHISPERER',
  thedreamarchitect: 'THE_DREAM_ARCHITECT',
  thechrononauts: 'THE_CHRONONAUTS',
  thepapergarden: 'THE_PAPER_GARDEN',
  thespacefarmer: 'THE_SPACE_FARMER',
}

// Fast lookup of a grid card by its id.
export const CARD_BY_ID = STORIES_GRID.reduce((acc, card) => {
  acc[card.id] = card
  return acc
}, {})

/**
 * Resolve everything the reader needs for a grid id.
 * @returns {{ card: object|null, key: string|null, chapters: any[], status: 'playable'|'empty'|'missing' }}
 */
export function resolveStory(gridId) {
  const card = CARD_BY_ID[gridId] || null

  let key = GRID_TO_REGISTRY[gridId] || null
  if (!key && Object.prototype.hasOwnProperty.call(STORY_REGISTRY, gridId)) {
    key = gridId // legacy: card id IS the registry key
  }

  const chapters = key && Array.isArray(STORY_REGISTRY[key]) ? STORY_REGISTRY[key] : []
  const status = chapters.length ? 'playable' : key ? 'empty' : 'missing'

  return { card, key, chapters, status }
}

/** Just the chapters array for a grid id (empty array if none). */
export function getStoryByGridId(gridId) {
  return resolveStory(gridId).chapters
}

/** The catalog card for a grid id (or null). */
export function getCardByGridId(gridId) {
  return CARD_BY_ID[gridId] || null
}

/** True when a card has real, readable chapters. */
export function isPlayable(gridId) {
  return resolveStory(gridId).status === 'playable'
}
