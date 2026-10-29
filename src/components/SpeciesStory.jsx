import { SPECIES, SPECIES_STORIES } from "../domain/catalog.js";

export default function SpeciesStory({ species }) {
  const story = SPECIES_STORIES[species];
  if (!story) return null;
  return (
    <section
      className={`species-story species-story-${species}`}
      aria-label={`${SPECIES[species]}背景故事`}
    >
      <p className="story-species">{SPECIES[species]}</p>
      <h3>{story.title}</h3>
      <p>{story.text}</p>
    </section>
  );
}
