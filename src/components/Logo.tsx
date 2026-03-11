interface Props {
  className?: string
}

export default function Logo({ className = 'h-6' }: Props) {
  return <img src="/logo.svg" alt="Lemnisca" className={className} />
}
