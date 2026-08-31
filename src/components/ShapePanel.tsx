import type { ProjectData } from "../types";
import { projectPresets } from "../lib/presets";
import { presetMeta, shapeIcons, shapeLabels } from "../lib/shapeMeta";
import { Section } from "./ui";

export default function ShapePanel({
  activeShape,
  activePresetName,
  onSelectPreset,
  onSelectShape
}: {
  activeShape: ProjectData["settings"]["shape"];
  activePresetName?: string;
  onSelectPreset: (presetName: string) => void;
  onSelectShape: (shape: ProjectData["settings"]["shape"]) => void;
}) {
  return (
    <div className="shape-panel">
      <Section title="Presets" defaultOpen>
        <div className="preset-grid">
          {projectPresets.map((preset) => {
            const Icon = shapeIcons[preset.settings.shape];
            const meta = presetMeta[preset.name];
            const isActive = preset.name === activePresetName;
            return (
              <button
                key={preset.name}
                className={isActive ? "preset-card is-active" : "preset-card"}
                onClick={() => onSelectPreset(preset.name)}
              >
                <Icon size={20} />
                <span className="preset-card-name">{preset.name}</span>
                {meta && <span className="preset-card-description">{meta.description}</span>}
                {meta && <span className="preset-card-hint">{meta.imageHint}</span>}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="All Shapes" defaultOpen={false}>
        <div className="shape-grid">
          {(Object.keys(shapeLabels) as Array<keyof typeof shapeLabels>).map((shape) => {
            const Icon = shapeIcons[shape];
            return (
              <button
                key={shape}
                className={shape === activeShape ? "shape-tile is-active" : "shape-tile"}
                onClick={() => onSelectShape(shape)}
              >
                <Icon size={18} />
                <span>{shapeLabels[shape]}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
