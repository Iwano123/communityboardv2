export function getHelpers(posts: any[]) {
  const categories = ['All', 'Community', 'For Sale', 'Services', 'Jobs', 'Events', 'Featured'];
  const sortOptions = [
    { key: 'created_at', order: -1, description: 'Newest first' },
    { key: 'created_at', order: 1, description: 'Oldest first' },
    { key: 'title', order: 1, description: 'Title A-Z' },
    { key: 'title', order: -1, description: 'Title Z-A' },
    { key: 'views', order: -1, description: 'Most viewed' }
  ];
  const sortDescriptions = sortOptions.map(x => x.description);

  return {
    posts,
    categories,
    sortOptions,
    sortDescriptions
  };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}