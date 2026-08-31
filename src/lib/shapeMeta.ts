import type { ShapeKind } from "../types";
import {
  CylinderIcon,
  LampIcon,
  MoonIcon,
  OrnamentIcon,
  PanelIcon,
  SphereIcon
} from "../components/icons";

export const shapeLabels: Record<ShapeKind, string> = {
  flat: "Flat Panel",
  curved: "Curved Panel",
  cylinder: "Cylinder",
  sphere: "Sphere",
  hemisphere: "Hemisphere",
  lampshade: "Lampshade",
  heart: "Heart Panel",
  oval: "Oval Panel",
  ornament: "Ornament",
  moon: "Moon Style"
};

export const shapeIcons: Record<ShapeKind, typeof SphereIcon> = {
  flat: PanelIcon,
  curved: PanelIcon,
  cylinder: CylinderIcon,
  sphere: SphereIcon,
  hemisphere: SphereIcon,
  lampshade: LampIcon,
  heart: PanelIcon,
  oval: PanelIcon,
  ornament: OrnamentIcon,
  moon: MoonIcon
};

export const shapeDescriptions: Record<ShapeKind, string> = {
  flat: "A single flat print, the classic lithophane panel.",
  curved: "A gently curved panel that stands on its own.",
  cylinder: "Wraps a photo fully around a lamp-ready cylinder.",
  sphere: "A full photo globe with multi-photo wraparound support.",
  hemisphere: "A dome-shaped half sphere for wall or shelf display.",
  lampshade: "A tapered shade that widens from top to bottom.",
  heart: "A heart-shaped panel, ideal for gifts and ornaments.",
  oval: "An oval panel with softened edges.",
  ornament: "A small hangable panel with an integrated loop.",
  moon: "A textured panel styled after the lunar surface."
};

export interface PresetMeta {
  description: string;
  imageHint: string;
}

export const presetMeta: Record<string, PresetMeta> = {
  "Photo Panel": { description: "One photo, printed flat. The simplest and fastest lithophane.", imageHint: "1 photo" },
  "Curved Photo": { description: "A photo panel with a gentle shelf-standing curve.", imageHint: "1 photo" },
  "Cylinder Lamp": { description: "Wraps a photo around a cylinder lampshade.", imageHint: "1 photo" },
  "Single Photo Sphere": { description: "One photo wrapped around a full sphere.", imageHint: "1 photo" },
  "Four Photo Sphere": { description: "Four photos placed evenly around a sphere.", imageHint: "4 photos" },
  "Six Photo Sphere": { description: "Six photos for denser sphere coverage.", imageHint: "6 photos" },
  "Photo Globe": { description: "A large split sphere with a display base, built for many photos.", imageHint: "4-8 photos" },
  "Moon Lamp": { description: "A textured lunar-style globe lamp.", imageHint: "1-2 photos" },
  "Photo Ornament": { description: "A small hangable ornament with a loop.", imageHint: "1 photo" },
  "Night Light": { description: "A compact panel sized for a small night light base.", imageHint: "1 photo" },
  "Desk Lithophane": { description: "A medium desk-standing photo panel.", imageHint: "1 photo" },
  "Rotating Globe": { description: "A large split sphere designed for a rotating display base.", imageHint: "4-8 photos" }
};
