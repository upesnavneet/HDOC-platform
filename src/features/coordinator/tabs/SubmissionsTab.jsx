import { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function SubmissionsTab() {
  const { db } = useApp();
  const [filterDay, setFilterDay] = useState('all');

  // H12: Read from DataContext (Schema B) instead of a separate getDocs call.
  // Map Schema B fields for display.
  const submissions = useMemo(() => {
    return db.submissions.map((s) => {
      // Find the user name from the users list
      const user = db.users.find((u) => (u.uid || u.id) === s.userId);
      return {
        id: s.id,
        studentName: user?.name || 'Unknown',
        studentEmail: user?.email || 'N/A',
        dayNumber: s.day,
        commitUrl: s.link || s.code || '',
        type: s.type || '',
        status: s.status || '',
        submittedAt: s.timestamp ? new Date(s.timestamp) : new Date(),
      };
    });
  }, [db.submissions, db.users]);

  const filteredSubmissions =
    filterDay === 'all'
      ? submissions
      : submissions.filter((s) => s.day === parseInt(filterDay));

  const uniqueDays = [...new Set(submissions.map((s) => s.day))].sort((a, b) => a - b);

  return (
    <div className="submissions-tab">
      <div className="submissions-header">
        <h3>Submissions</h3>
        <div className="submissions-filter">
          <label>Filter by Day:</label>
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="day-filter-select"
          >
            <option value="all">All Days</option>
            {uniqueDays.map((day) => (
              <option key={day} value={day}>
                Day {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="submissions-stats">
        <div className="stat-card">
          <span className="stat-number">{submissions.length}</span>
          <span className="stat-label">Total Submissions</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{new Set(submissions.map((s) => s.studentName)).size}</span>
          <span className="stat-label">Unique Students</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{uniqueDays.length}</span>
          <span className="stat-label">Active Days</span>
        </div>
      </div>

      <div className="submissions-table-wrapper">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Email</th>
              <th>Day</th>
              <th>Type</th>
              <th>Link</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No submissions found
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="student-name">{sub.studentName}</td>
                  <td className="student-email">{sub.studentEmail}</td>
                  <td className="day-badge">Day {sub.dayNumber}</td>
                  <td>{sub.type}</td>
                  <td>
                    {sub.commitUrl ? (
                      <a
                        href={sub.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="commit-link"
                      >
                        View →
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="submit-time">
                    {sub.submittedAt?.toLocaleDateString()}{' '}
                    {sub.submittedAt?.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
