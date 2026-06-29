export default function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`bat-card ${hover ? 'bat-card-hover' : ''} ${className}`}
    >
      {children}
    </div>
  )
}