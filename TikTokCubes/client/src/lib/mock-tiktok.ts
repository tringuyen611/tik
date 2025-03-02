const MOCK_USERNAMES = [
  'tiktok_user123',
  'dancequeen',
  'meme_lord',
  'viral_creator',
  'trending_now',
  'funtime_streamer',
  'social_star',
  'content_king',
];

export function mockTikTokEvents(
  onViewerJoin: (username: string) => void
): () => void {
  // Simulate viewers joining every 2-5 seconds
  const interval = setInterval(() => {
    const username = MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)];
    onViewerJoin(username);
  }, Math.random() * 3000 + 2000);

  return () => clearInterval(interval);
}
