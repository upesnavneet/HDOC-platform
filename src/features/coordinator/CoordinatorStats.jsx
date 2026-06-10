import TiltCard from '../../components/TiltCard';

export default function CoordinatorStats({
  participants,
  activeToday,
  uniqueTodaySubmitters,
  debugSubsToday,
  topPerformer,
}) {
  return (
    <section className="coordinator-overview-cards">
      <TiltCard className="coord-stat-card press-card" maxTilt={6}>
        <div className="coord-stat-label">Total Participants</div>
        <div className="coord-stat-value">{participants.length}</div>
      </TiltCard>
      <TiltCard className="coord-stat-card press-card" maxTilt={6}>
        <div className="coord-stat-label">Active Today</div>
        <div className="coord-stat-value">{activeToday}</div>
      </TiltCard>
      <TiltCard className="coord-stat-card press-card" maxTilt={6}>
        <div className="coord-stat-label">Challenge Submissions Today</div>
        <div className="coord-stat-value">{uniqueTodaySubmitters}</div>
      </TiltCard>
      <TiltCard className="coord-stat-card press-card" maxTilt={6}>
        <div className="coord-stat-label">Sunday Debug Submissions</div>
        <div className="coord-stat-value">{debugSubsToday}</div>
      </TiltCard>
      <TiltCard className="coord-stat-card press-card highlight" maxTilt={6}>
        <div className="coord-stat-label">Top Performer</div>
        <div className="coord-stat-value coord-stat-name">
          {topPerformer ? topPerformer.name.split(' ')[0] : '-'}
        </div>
        {topPerformer && (
          <div className="coord-stat-footnote">
            {topPerformer.totalCodingScore + topPerformer.totalDebuggingScore} pts
          </div>
        )}
      </TiltCard>
    </section>
  );
}
