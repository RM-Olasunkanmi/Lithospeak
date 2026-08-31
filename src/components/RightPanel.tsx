import type { GeneratedResult, ImageLayer, ProjectData, QualityPreset, ShapeKind } from "../types";
import { Section, SelectField, SliderField, ToggleField } from "./ui";
import { AlertIcon, CheckIcon, ExportIcon, InfoIcon } from "./icons";

const qualityOptions: Array<{ value: QualityPreset; label: string }> = [
  { value: "Draft", label: "Draft (fast)" },
  { value: "Standard", label: "Standard" },
  { value: "High", label: "High" },
  { value: "Ultra", label: "Ultra (slow)" },
  { value: "Custom", label: "Custom" }
];

const dimensionalShapes: ShapeKind[] = ["flat", "heart", "oval", "ornament", "moon"];

export default function RightPanel({
  project,
  updateSettings,
  selectedImage,
  updateSelectedImage,
  result,
  onExportPart,
  onExportZip,
  onAutoLayout,
  onSettle,
  mobileOpen
}: {
  project: ProjectData;
  updateSettings: (updater: (settings: ProjectData["settings"]) => ProjectData["settings"]) => void;
  selectedImage?: ImageLayer;
  updateSelectedImage: (updater: (image: ImageLayer) => ImageLayer) => void;
  result: GeneratedResult;
  onExportPart: (format: "stl" | "obj", name: string) => void;
  onExportZip: () => void;
  onAutoLayout: (count: number) => void;
  onSettle: () => void;
  mobileOpen?: boolean;
}) {
  const settings = project.settings;
  const set = <K extends keyof ProjectData["settings"]>(key: K, value: ProjectData["settings"][K]) =>
    updateSettings((current) => ({ ...current, [key]: value }));

  const errors = result.validation.filter((issue) => issue.severity === "error");
  const warnings = result.validation.filter((issue) => issue.severity === "warning");

  return (
    <aside className={mobileOpen ? "right-panel is-open" : "right-panel"} aria-label="Properties">
      <Section title="Dimensions" defaultOpen>
        <SelectField
          label="Quality"
          value={settings.quality}
          options={qualityOptions}
          onChange={(value) => set("quality", value as QualityPreset)}
          hint="Higher quality increases mesh detail and generation time."
        />

        {dimensionalShapes.includes(settings.shape) && (
          <>
            <SliderField label="Width" value={settings.panelWidth} min={60} max={240} unit="mm" onChange={(v) => set("panelWidth", v)} onSettle={onSettle} />
            <SliderField label="Height" value={settings.panelHeight} min={60} max={240} unit="mm" onChange={(v) => set("panelHeight", v)} onSettle={onSettle} />
          </>
        )}

        {settings.shape === "curved" && (
          <>
            <SliderField label="Width" value={settings.panelWidth} min={80} max={240} unit="mm" onChange={(v) => set("panelWidth", v)} onSettle={onSettle} />
            <SliderField label="Curve Amount" value={settings.curveDegrees} min={45} max={300} unit="°" onChange={(v) => set("curveDegrees", v)} onSettle={onSettle} hint="How far the panel wraps around, in degrees." />
          </>
        )}

        {settings.shape === "cylinder" && (
          <>
            <SliderField label="Diameter" value={settings.cylinderDiameter} min={60} max={200} unit="mm" onChange={(v) => set("cylinderDiameter", v)} onSettle={onSettle} />
            <SliderField label="Height" value={settings.cylinderHeight} min={80} max={240} unit="mm" onChange={(v) => set("cylinderHeight", v)} onSettle={onSettle} />
          </>
        )}

        {settings.shape === "lampshade" && (
          <>
            <SliderField label="Top Diameter" value={settings.lampshadeTopDiameter} min={60} max={200} unit="mm" onChange={(v) => set("lampshadeTopDiameter", v)} onSettle={onSettle} />
            <SliderField label="Bottom Diameter" value={settings.lampshadeBottomDiameter} min={80} max={240} unit="mm" onChange={(v) => set("lampshadeBottomDiameter", v)} onSettle={onSettle} />
            <SliderField label="Height" value={settings.lampshadeHeight} min={60} max={260} unit="mm" onChange={(v) => set("lampshadeHeight", v)} onSettle={onSettle} />
          </>
        )}

        {(settings.shape === "sphere" || settings.shape === "hemisphere") && (
          <>
            <SliderField label="Sphere Diameter" value={settings.sphereDiameter} min={80} max={220} unit="mm" onChange={(v) => set("sphereDiameter", v)} onSettle={onSettle} />
            {settings.shape === "sphere" && (
              <SliderField
                label="Opening Diameter"
                value={settings.openingDiameter}
                min={0}
                max={80}
                unit="mm"
                onChange={(v) => set("openingDiameter", v)}
                onSettle={onSettle}
                hint="Size of the hole for inserting an LED, 0 for none."
              />
            )}
          </>
        )}
      </Section>

      {selectedImage && (
        <Section title="Image" defaultOpen>
          <SliderField label="Brightness" value={selectedImage.adjustments.brightness} min={-100} max={100} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, brightness: v } }))} onSettle={onSettle} />
          <SliderField label="Contrast" value={selectedImage.adjustments.contrast} min={-100} max={100} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, contrast: v } }))} onSettle={onSettle} />
          <SliderField label="Gamma" value={selectedImage.adjustments.gamma} min={0.3} max={2.2} step={0.05} precision={2} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, gamma: v } }))} onSettle={onSettle} hint="Adjusts midtone balance." />
          <SliderField label="Exposure" value={selectedImage.adjustments.exposure} min={-100} max={100} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, exposure: v } }))} onSettle={onSettle} />
          <SliderField label="Shadows" value={selectedImage.adjustments.shadows} min={-100} max={100} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, shadows: v } }))} onSettle={onSettle} />
          <SliderField label="Highlights" value={selectedImage.adjustments.highlights} min={-100} max={100} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, highlights: v } }))} onSettle={onSettle} />
          <SliderField label="Sharpness" value={selectedImage.adjustments.sharpness} min={0} max={100} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, sharpness: v } }))} onSettle={onSettle} />
          <SliderField label="Smoothing" value={selectedImage.adjustments.smoothing} min={0} max={100} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, smoothing: v } }))} onSettle={onSettle} />
          <SliderField
            label="Rotate"
            value={selectedImage.adjustments.rotate}
            min={-180}
            max={180}
            unit="°"
            onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, rotate: v } }))}
            onSettle={onSettle}
          />
          <div className="field-row">
            <SliderField label="Crop X" value={selectedImage.crop.x} min={0} max={0.5} step={0.01} precision={2} onChange={(v) => updateSelectedImage((img) => ({ ...img, crop: { ...img.crop, x: v } }))} onSettle={onSettle} />
            <SliderField label="Crop Y" value={selectedImage.crop.y} min={0} max={0.5} step={0.01} precision={2} onChange={(v) => updateSelectedImage((img) => ({ ...img, crop: { ...img.crop, y: v } }))} onSettle={onSettle} />
          </div>
          <div className="field-row">
            <SliderField label="Crop Width" value={selectedImage.crop.w} min={0.4} max={1} step={0.01} precision={2} onChange={(v) => updateSelectedImage((img) => ({ ...img, crop: { ...img.crop, w: v } }))} onSettle={onSettle} />
            <SliderField label="Crop Height" value={selectedImage.crop.h} min={0.4} max={1} step={0.01} precision={2} onChange={(v) => updateSelectedImage((img) => ({ ...img, crop: { ...img.crop, h: v } }))} onSettle={onSettle} />
          </div>
          <div className="toggle-row">
            <ToggleField label="Invert thickness" checked={selectedImage.adjustments.invert} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, invert: v } }))} hint="Swap which tones print thick vs. thin." />
            <ToggleField label="Auto enhance" checked={selectedImage.adjustments.autoEnhance} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, autoEnhance: v } }))} hint="Automatically stretches contrast to use the full tonal range." />
            <ToggleField label="Flip horizontal" checked={selectedImage.adjustments.flipX} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, flipX: v } }))} />
            <ToggleField label="Flip vertical" checked={selectedImage.adjustments.flipY} onChange={(v) => updateSelectedImage((img) => ({ ...img, adjustments: { ...img.adjustments, flipY: v } }))} />
          </div>
        </Section>
      )}

      {settings.shape === "sphere" && selectedImage && (
        <Section title="Sphere Layout" defaultOpen>
          <div className="auto-layout-row">
            <span className="field-label">Auto-arrange</span>
            <div className="toolbar-group compact">
              <button className="chip-button" onClick={() => onAutoLayout(2)}>2</button>
              <button className="chip-button" onClick={() => onAutoLayout(3)}>3</button>
              <button className="chip-button" onClick={() => onAutoLayout(4)}>4</button>
              <button className="chip-button" onClick={() => onAutoLayout(6)}>6</button>
              <button className="chip-button" onClick={() => onAutoLayout(project.images.length)}>All</button>
            </div>
          </div>
          <div className="field-row">
            <SliderField label="Longitude" value={selectedImage.centerLon} min={0} max={360} unit="°" onChange={(v) => updateSelectedImage((img) => ({ ...img, centerLon: v }))} onSettle={onSettle} hint="Position around the sphere, left to right." />
            <SliderField label="Latitude" value={selectedImage.centerLat} min={-70} max={70} unit="°" onChange={(v) => updateSelectedImage((img) => ({ ...img, centerLat: v }))} onSettle={onSettle} hint="Position from bottom to top." />
          </div>
          <div className="field-row">
            <SliderField label="Width on Sphere" value={selectedImage.widthDeg} min={30} max={180} unit="°" onChange={(v) => updateSelectedImage((img) => ({ ...img, widthDeg: v }))} onSettle={onSettle} />
            <SliderField label="Height on Sphere" value={selectedImage.heightDeg} min={20} max={140} unit="°" onChange={(v) => updateSelectedImage((img) => ({ ...img, heightDeg: v }))} onSettle={onSettle} />
          </div>
          <div className="field-row">
            <SliderField label="Rotation" value={selectedImage.rotationDeg} min={-180} max={180} unit="°" onChange={(v) => updateSelectedImage((img) => ({ ...img, rotationDeg: v }))} onSettle={onSettle} />
            <SliderField label="Blend Feather" value={selectedImage.feather} min={0} max={40} onChange={(v) => updateSelectedImage((img) => ({ ...img, feather: v }))} onSettle={onSettle} hint="Softens the seam between overlapping photos." />
          </div>
          <SelectField
            label="Blend Mode"
            value={settings.sphereBlendMode}
            onChange={(value) => set("sphereBlendMode", value as typeof settings.sphereBlendMode)}
            options={[
              { value: "average", label: "Average overlaps" },
              { value: "darkest-wins", label: "Darkest wins" },
              { value: "lightest-wins", label: "Lightest wins" }
            ]}
          />
        </Section>
      )}

      <Section title="Lithophane" defaultOpen>
        <SliderField label="Minimum Thickness" value={settings.minThickness} min={0.4} max={2} step={0.05} precision={2} unit="mm" onChange={(v) => set("minThickness", v)} onSettle={onSettle} hint="Thinnest, brightest area. Too thin can be fragile." />
        <SliderField label="Maximum Thickness" value={settings.maxThickness} min={1.2} max={5} step={0.05} precision={2} unit="mm" onChange={(v) => set("maxThickness", v)} onSettle={onSettle} hint="Thickest, darkest area. Too thick blocks all backlight." />
      </Section>

      {settings.shape === "sphere" && (
        <Section title="Geometry">
          <ToggleField label="Split sphere for smaller printers" checked={settings.splitSphere} onChange={(v) => set("splitSphere", v)} hint="Prints as two hemispheres with a friction-fit seam instead of one large sphere." />
          {settings.openingDiameter > 0 && (
            <SelectField
              label="Opening Position"
              value={settings.openingPosition}
              options={[
                { value: "bottom", label: "Bottom" },
                { value: "top", label: "Top" }
              ]}
              onChange={(value) => set("openingPosition", value as "top" | "bottom")}
            />
          )}
        </Section>
      )}

      {settings.shape === "sphere" && (
        <Section title="Base">
          <ToggleField label="Include display base" checked={settings.base.enabled} onChange={(v) => set("base", { ...settings.base, enabled: v })} />
          {settings.base.enabled && (
            <>
              <SliderField label="Base Diameter" value={settings.base.diameter} min={60} max={140} unit="mm" onChange={(v) => set("base", { ...settings.base, diameter: v })} onSettle={onSettle} />
              <SliderField label="Base Height" value={settings.base.height} min={16} max={50} unit="mm" onChange={(v) => set("base", { ...settings.base, height: v })} onSettle={onSettle} />
              <SliderField label="LED Cavity" value={settings.base.cavityDiameter} min={24} max={70} unit="mm" onChange={(v) => set("base", { ...settings.base, cavityDiameter: v })} onSettle={onSettle} />
            </>
          )}
        </Section>
      )}

      <Section title="Print" badge={errors.length > 0 ? <span className="section-badge is-error">{errors.length}</span> : warnings.length > 0 ? <span className="section-badge is-warning">{warnings.length}</span> : undefined} defaultOpen={errors.length > 0}>
        <div className="field-row">
          <SliderField label="Printer X" value={settings.buildVolume.x} min={120} max={400} step={5} unit="mm" onChange={(v) => set("buildVolume", { ...settings.buildVolume, x: v })} onSettle={onSettle} />
          <SliderField label="Printer Y" value={settings.buildVolume.y} min={120} max={400} step={5} unit="mm" onChange={(v) => set("buildVolume", { ...settings.buildVolume, y: v })} onSettle={onSettle} />
        </div>
        <SliderField label="Printer Z" value={settings.buildVolume.z} min={120} max={400} step={5} unit="mm" onChange={(v) => set("buildVolume", { ...settings.buildVolume, z: v })} onSettle={onSettle} />

        {result.validation.length === 0 ? (
          <div className="validation-card is-ok">
            <CheckIcon size={14} />
            <span>No issues detected.</span>
          </div>
        ) : (
          <ul className="validation-list">
            {result.validation.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className={`validation-card is-${issue.severity}`}>
                {issue.severity === "error" ? <AlertIcon size={14} /> : issue.severity === "warning" ? <AlertIcon size={14} /> : <InfoIcon size={14} />}
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Advanced">
        <SliderField label="Mesh Sampling" value={settings.advanced.sampling} min={64} max={256} step={16} onChange={(v) => updateSettings((current) => ({ ...current, quality: "Custom", advanced: { ...current.advanced, sampling: v, meshResolution: v } }))} onSettle={onSettle} hint="Detail level of the generated surface. Higher is slower." />
        <SliderField label="Connector Clearance" value={settings.advanced.connectorClearance} min={0.15} max={0.8} step={0.01} precision={2} unit="mm" onChange={(v) => set("advanced", { ...settings.advanced, connectorClearance: v })} onSettle={onSettle} hint="Gap between split-sphere connector parts." />
        <SliderField label="Seam Band" value={settings.advanced.seamBandDegrees} min={4} max={20} unit="°" onChange={(v) => set("advanced", { ...settings.advanced, seamBandDegrees: v })} onSettle={onSettle} />
      </Section>

      <Section title="Export" defaultOpen>
        {result.parts.length === 0 && <p className="subtle">Generate a model to enable export.</p>}
        {result.parts.map((part) => (
          <div key={part.name} className="export-row">
            <span>{part.name}</span>
            <div className="toolbar-group compact">
              <button className="ghost-button small" onClick={() => onExportPart("stl", part.name)}>STL</button>
              <button className="ghost-button small" onClick={() => onExportPart("obj", part.name)}>OBJ</button>
            </div>
          </div>
        ))}
        {result.parts.length > 0 && (
          <button className="primary-button full-width" onClick={onExportZip}>
            <ExportIcon size={16} />
            Export All ({result.parts.length > 1 ? "ZIP" : "STL"})
          </button>
        )}
      </Section>
    </aside>
  );
}
