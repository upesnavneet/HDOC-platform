import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db as firestoreDb } from '../../../firebaseConfig';

export default function SubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDay, setFilterDay] = useState('all');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const q = query(
          collection(firestoreDb, 'submissions'),
          orderBy('submittedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const submissionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate?.() || new Date(),
        }));
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const filteredSubmissions = filterDay === 'all'
    ? submissions
    : submissions.filter((s) => s.dayNumber === parseInt(filterDay));

  const uniqueDays = [...new Set(submissions.map((s) => s.dayNumber))].sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="submissions-loading">
        <div className="loading-spinner"></div>
        <p>Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="submissions-tab">
      <div className="submissions-header">
        <h3>GitHub Submissions</h3>
        <div className="submissions-filter">
          <label>Filter by Day:</label>
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="day-filter-select"
          >
            <option value="all">All Days</option>
            {uniqueDays.map((day) => (
              <option key={day} value={day}>Day {day}</option>
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
          <span className="stat-number">{new Set(submissions.map((s) => s.studentId)).size}</span>
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
              <th>Commit URL</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">No submissions found</td>
              </tr>
            ) : (
              filteredSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="student-name">{sub.studentName || 'Unknown'}</td>
                  <td className="student-email">{sub.studentEmail || 'N/A'}</td>
                  <td className="day-badge">Day {sub.dayNumber}</td>
                  <td>
                    <a
                      href={sub.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="commit-link"
                    >
                      View Commit →
                    </a>
                  </td>
                  <td className="submit-time">
                    {sub.submittedAt?.toLocaleDateString()}{' '}
                    {sub.submittedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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