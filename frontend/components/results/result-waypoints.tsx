const waypoints = [
  { href: "#summary", label: "Coverage", step: "01" },
  { href: "#findings", label: "Terms", step: "02" },
  { href: "#evidence-explorer", label: "Evidence", step: "03" },
  { href: "#review", label: "Review", step: "04" },
  { href: "#resume-lab", label: "Lab", step: "05" },
] as const;

export function ResultWaypoints() {
  return (
    <nav className="result-waypoints" aria-label="Result waypoints">
      <span className="result-waypoints-label">Result map</span>
      <ol>
        {waypoints.map((waypoint) => (
          <li key={waypoint.href}>
            <a href={waypoint.href}>
              <span aria-hidden="true">{waypoint.step}</span>
              {waypoint.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
