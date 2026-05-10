const colors = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}
const labels = {
  todo: 'To Do', in_progress: 'In Progress', done: 'Done',
  low: 'Low', medium: 'Medium', high: 'High'
}

export default function StatusBadge({ value }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100'}`}>
      {labels[value] || value}
    </span>
  )
}