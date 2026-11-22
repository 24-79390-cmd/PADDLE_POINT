export default function StatusBadge({ status }) {
  return <span className={`badge s-${status}`}>{status}</span>;
}
