/**
 * Route template — unlike `layout`, this re-mounts on every navigation, so the
 * CSS entrance animation replays each time a page loads. Gives a smooth,
 * Apple-style "settle in" transition across all pages. Reduced-motion safe
 * (the animation is disabled via media query in globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter">{children}</div>
}
