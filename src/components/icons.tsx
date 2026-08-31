import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(paths: React.ReactNode) {
  return function Icon({ size = 16, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const UploadIcon = base(
  <>
    <path d="M12 16V4" />
    <path d="M6.5 9.5 12 4l5.5 5.5" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </>
);

export const ImageIcon = base(
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m5 17 4.5-5 3.5 3.5L17 11l2.5 3.5" />
  </>
);

export const ShapesIcon = base(
  <>
    <circle cx="8" cy="8.5" r="4.2" />
    <rect x="12.8" y="12.8" width="8.4" height="8.4" rx="1.6" />
  </>
);

export const FolderIcon = base(
  <path d="M4 6.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2h7a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
);

export const TrashIcon = base(
  <>
    <path d="M5 7h14" />
    <path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
    <path d="M7 7l1 12.5a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7" />
  </>
);

export const SwapIcon = base(
  <>
    <path d="M4 8h13l-3-3" />
    <path d="M20 16H7l3 3" />
  </>
);

export const ChevronDownIcon = base(<path d="m6 9 6 6 6-6" />);

export const UndoIcon = base(
  <>
    <path d="M9 8 4.5 12 9 16" />
    <path d="M4.5 12h9.5a5 5 0 1 1 0 10H12" />
  </>
);

export const RedoIcon = base(
  <>
    <path d="m15 8 4.5 4-4.5 4" />
    <path d="M19.5 12H10a5 5 0 1 0 0 10h1.5" />
  </>
);

export const SaveIcon = base(
  <>
    <path d="M5 4.5h11L20 9v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" />
    <path d="M8 4.5V9h7V4.5" />
    <path d="M8 14.5h8" />
  </>
);

export const ExportIcon = base(
  <>
    <path d="M12 15V3" />
    <path d="M7.5 7.5 12 3l4.5 4.5" />
    <path d="M4 15v4.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V15" />
  </>
);

export const OrbitIcon = base(
  <>
    <circle cx="12" cy="12" r="2.2" />
    <ellipse cx="12" cy="12" rx="9" ry="4" />
    <ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(35 12 12)" />
  </>
);

export const FitIcon = base(
  <>
    <path d="M9 4H5a1 1 0 0 0-1 1v4" />
    <path d="M15 4h4a1 1 0 0 1 1 1v4" />
    <path d="M9 20H5a1 1 0 0 1-1-1v-4" />
    <path d="M15 20h4a1 1 0 0 0 1-1v-4" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const FrontViewIcon = base(<rect x="6" y="6" width="12" height="12" rx="1.4" />);
export const SideViewIcon = base(
  <>
    <path d="M4 8v8l8 4 8-4V8l-8-4Z" />
    <path d="M4 8l8 4 8-4" />
    <path d="M12 12v8" />
  </>
);
export const TopViewIcon = base(
  <>
    <path d="M12 3 4 8l8 5 8-5Z" />
  </>
);

export const GridIcon = base(
  <>
    <rect x="4" y="4" width="16" height="16" rx="1.4" />
    <path d="M4 10h16M4 15h16M10 4v16M15 4v16" />
  </>
);

export const RulerIcon = base(
  <>
    <rect x="3.5" y="8" width="17" height="8" rx="1.4" transform="rotate(-8 12 12)" />
    <path d="M8 9.5 8.7 11M11 9 11.9 11M14 8.5 14.9 10.6M17 8 17.9 10.2" />
  </>
);

export const WireframeIcon = base(
  <>
    <path d="M12 3 4 8l8 5 8-5Z" />
    <path d="M4 8v8l8 5 8-5V8" />
    <path d="M12 13v8" />
  </>
);

export const SolidIcon = base(<path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z" />);

export const LitIcon = base(
  <>
    <circle cx="12" cy="12" r="4.4" />
    <path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.1 5.9l-1.7 1.7M7.6 16.5l-1.7 1.7M18.1 18.1l-1.7-1.7M7.6 7.5 5.9 5.8" />
  </>
);

export const BackIcon = base(
  <>
    <circle cx="12" cy="12" r="7.2" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
  </>
);

export const PlusIcon = base(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>
);

export const CloseIcon = base(
  <>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </>
);

export const ArrowUpIcon = base(<path d="m6 14 6-6 6 6" />);
export const ArrowDownIcon = base(<path d="m6 10 6 6 6-6" />);
export const RotateLeftIcon = base(
  <>
    <path d="M4 12a8 8 0 1 1 2.6 5.9" />
    <path d="M4 12V7M4 12h5" />
  </>
);
export const RotateRightIcon = base(
  <>
    <path d="M20 12a8 8 0 1 0-2.6 5.9" />
    <path d="M20 12V7M20 12h-5" />
  </>
);

export const InfoIcon = base(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 8.2v.1" />
  </>
);

export const AlertIcon = base(
  <>
    <path d="M12 3.5 21 19H3Z" />
    <path d="M12 9.5v4.2" />
    <path d="M12 16.7v.1" />
  </>
);

export const CheckIcon = base(<path d="m5 12.5 4.5 4.5L19 7" />);

export const SphereIcon = base(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <ellipse cx="12" cy="12" rx="8.5" ry="3.4" />
    <path d="M12 3.5v17" />
  </>
);

export const CylinderIcon = base(
  <>
    <ellipse cx="12" cy="6" rx="7" ry="2.6" />
    <path d="M5 6v12a7 2.6 0 0 0 14 0V6" />
  </>
);

export const PanelIcon = base(<rect x="5" y="4" width="14" height="16" rx="1.6" />);
export const LampIcon = base(
  <>
    <path d="M7 5h10l-2.4 8H9.4Z" />
    <path d="M12 13v6" />
    <path d="M8.5 19h7" />
  </>
);
export const MoonIcon = base(<path d="M15.5 4A8.5 8.5 0 1 0 20 15.5 7 7 0 0 1 15.5 4Z" />);
export const OrnamentIcon = base(
  <>
    <circle cx="12" cy="14" r="6.5" />
    <path d="M10 5.5h4l-1 3.5h-2Z" />
  </>
);
