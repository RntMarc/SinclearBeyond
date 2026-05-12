import * as icons from "simple-icons";

export default function BrandIcon({ name, size = 16, className = "" }) {
  // Simple Icons are keyed by 'si' + PascalCaseName
  // We can try to find it by name
  const iconKey = `si${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()}`;
  const icon = icons[iconKey];

  if (!icon) {
    return <div className={className} style={{ width: size, height: size }} />;
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={icon.path} />
    </svg>
  );
}
