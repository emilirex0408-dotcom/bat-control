export default function BatLogo({ size = 32, className = '' }) {
  return (
    <img
      src="/batman-logo.jpg"
      alt="Bat Control"
      className={`object-contain rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  )
}