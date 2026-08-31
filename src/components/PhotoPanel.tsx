import { useRef, useState } from "react";
import type { ImageLayer } from "../types";
import { EmptyState, IconButton } from "./ui";
import { RotateLeftIcon, RotateRightIcon, SwapIcon, TrashIcon, UploadIcon } from "./icons";

function cropStyle(image: ImageLayer): React.CSSProperties {
  return {
    left: `${image.crop.x * 100}%`,
    top: `${image.crop.y * 100}%`,
    width: `${image.crop.w * 100}%`,
    height: `${image.crop.h * 100}%`
  };
}

export default function PhotoPanel({
  images,
  selectedId,
  onFilesAdded,
  onSelect,
  onRemove,
  onReplace,
  onReorder,
  onRotateQuick
}: {
  images: ImageLayer[];
  selectedId?: string;
  onFilesAdded: (files: FileList | null) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReplace: (id: string, files: FileList | null) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRotateQuick: (id: string, deltaDeg: number) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetId = useRef<string | null>(null);

  return (
    <div className="photo-panel">
      <div
        className={dragOver ? "dropzone is-active" : "dropzone"}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          onFilesAdded(event.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
        }}
      >
        <UploadIcon size={20} />
        <p>
          <strong>Drop photos here</strong> or click to browse
        </p>
        <span className="dropzone-hint">JPG, PNG, or WebP · multiple files supported</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          multiple
          onChange={(event) => {
            onFilesAdded(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          if (replaceTargetId.current) onReplace(replaceTargetId.current, event.target.files);
          event.target.value = "";
          replaceTargetId.current = null;
        }}
      />

      {images.length === 0 ? (
        <EmptyState title="No photos yet" description="Uploaded photos will appear here as thumbnails you can reorder and adjust." />
      ) : (
        <ul className="photo-list">
          {images.map((image, index) => (
            <li
              key={image.id}
              className={`photo-card${image.id === selectedId ? " is-selected" : ""}${dragIndex === index ? " is-dragging" : ""}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <button className="photo-card-thumb" onClick={() => onSelect(image.id)} aria-label={`Select ${image.name}`}>
                <img src={image.dataUrl} alt="" />
                <span className="photo-card-crop" style={cropStyle(image)} />
              </button>
              <div className="photo-card-meta">
                <span className="photo-card-name" title={image.name}>
                  {image.name}
                </span>
                <div className="photo-card-actions">
                  <IconButton label="Rotate left 90°" icon={<RotateLeftIcon size={14} />} onClick={() => onRotateQuick(image.id, -90)} />
                  <IconButton label="Rotate right 90°" icon={<RotateRightIcon size={14} />} onClick={() => onRotateQuick(image.id, 90)} />
                  <IconButton
                    label="Replace photo"
                    icon={<SwapIcon size={14} />}
                    onClick={() => {
                      replaceTargetId.current = image.id;
                      replaceInputRef.current?.click();
                    }}
                  />
                  <IconButton label="Remove photo" icon={<TrashIcon size={14} />} onClick={() => onRemove(image.id)} />
                </div>
              </div>
              {image.id === selectedId && <span className="photo-card-badge">Selected</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
