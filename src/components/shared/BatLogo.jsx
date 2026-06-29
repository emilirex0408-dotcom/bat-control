export default function BatLogo({ size = 32, className = '' }) {
  return (
    <img
      src="/bat-logo.svg"
      alt="Bat Control"
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}