import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
function getInitials(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part: DynamicStateObject) => part.charAt(0).toUpperCase())
    .join("") || "TC";
}

export interface AvatarProps {
  src?: DynamicState;
  name?: DynamicState;
  size?: DynamicState;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function Avatar({ src = "", name = "", size = "md", className = "" }: AvatarProps) {
  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-base",
    lg: "h-16 w-16 text-lg"
  };

  const classes = ["tc-avatar overflow-hidden ring-1 ring-white/80 shadow-sm", (sizes as DynamicStateObject)[size] || sizes.md, className].join(" ");

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        className={`${classes} object-cover`}
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    );
  }

  return (
    <span className={classes} aria-label={name || "Profile"}>
      {getInitials(name)}
    </span>
  );
}
