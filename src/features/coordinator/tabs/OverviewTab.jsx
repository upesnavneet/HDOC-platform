import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import Modal from '../../../components/ui/Modal';

export default function OverviewTab({ participants }) {
  const {
    toggleUserStatus,
    updateParticipantStreaks,
    editParticipantProgress,
  } = useApp();

  const [participantSearch, setParticipantSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [editProgressUid, setEditProgressUid] = useState(null);
  const [editDay, setEditDay] = useState('');
  const [editDayScore, setEditDayScore] = useState('');
  const [editStreakUid, setEditStreakUid] = useState(null);
  const [editLcStreak, setEditLcStreak] = useState('');
  const [editGcStreak, setEditGcStreak] = useState('');

  const sortedParticipants = [...participants]
    .filter((p) => {
      const term = participantSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        p.studentId.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const itemsPerPage = 30;
  const totalPages = Math.max(1, Math.ceil(sortedParticipants.length / itemsPerPage));
  const paginatedParticipants = sortedParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="coord-panel">
      <div className="panel-header-row">
        <h2 id="participant-mgmt-heading">Participant Management</h2>
        <label htmlFor="participant-search" className="sr-only">
          Search participants
        </label>
        <input
          id="participant-search"
          type="search"
          placeholder="Search participants…"
          value={participantSearch}
          onChange={(e) => {
            setParticipantSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
          aria-labelledby="participant-mgmt-heading"
        />
      </div>

      <div className="participants-table-wrapper">
        <table className="admin-table">
          <caption className="sr-only">Participant list with actions</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">SAP ID</th>
              <th scope="col">Scores</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedParticipants.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                </td>
                <td>{p.studentId}</td>
                <td>
                  {p.totalCodingScore} / {p.totalDebuggingScore}
                </td>
                <td>
                  <span className={`badge-status ${p.isActive ? 'submitted' : 'missed'}`}>
                    {p.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td>
                  <div className="coord-action-buttons">
                    <button
                      type="button"
                      className="small-action-btn grey"
                      onClick={() => setSelectedParticipant(p)}
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="small-action-btn grey"
                      onClick={() => {
                        setEditProgressUid(p.id);
                        setEditDay('');
                        setEditDayScore('');
                      }}
                    >
                      Edit Progress
                    </button>
                    <button
                      type="button"
                      className={`small-action-btn ${p.isActive ? 'red' : 'green'}`}
                      onClick={() => toggleUserStatus(p.id)}
                    >
                      {p.isActive ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            className="small-action-btn grey"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="small-action-btn grey"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedParticipant)}
        onClose={() => setSelectedParticipant(null)}
        title={selectedParticipant?.name}
      >
        {selectedParticipant && (
          <>
            <p>
              <strong>Email:</strong> {selectedParticipant.email}
            </p>
            <p>
              <strong>SAP ID:</strong> {selectedParticipant.studentId}
            </p>
            <p>
              <strong>GitHub:</strong> @{selectedParticipant.gitHubId}
            </p>
            <p>
              <strong>LeetCode:</strong> @{selectedParticipant.leetCodeId}
            </p>
            <p>
              <strong>Overall Rank:</strong> #{selectedParticipant.overallRank}
            </p>
            <p>
              <strong>Coding Score:</strong> {selectedParticipant.totalCodingScore} pts
            </p>
            <p>
              <strong>Debug Score:</strong> {selectedParticipant.totalDebuggingScore} pts
            </p>
          </>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editProgressUid)}
        onClose={() => setEditProgressUid(null)}
        title="Override Day Score"
      >
        <div className="form-group">
          <label htmlFor="edit-day-number">Day Number</label>
          <input
            id="edit-day-number"
            name="dayNumber"
            type="number"
            autoComplete="off"
            placeholder="e.g. 12"
            value={editDay}
            onChange={(e) => setEditDay(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-day-score">New Score</label>
          <input
            id="edit-day-score"
            name="dayScore"
            type="number"
            autoComplete="off"
            placeholder="e.g. 10 (or 20 for debugging)"
            value={editDayScore}
            onChange={(e) => setEditDayScore(e.target.value)}
          />
        </div>
        <div className="coord-action-buttons">
          <button
            type="button"
            className="small-action-btn green"
            onClick={async () => {
              const res = await editParticipantProgress(editProgressUid, editDay, editDayScore);
              alert(res.message);
              if (res.success) {
                setEditProgressUid(null);
              }
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="small-action-btn red"
            onClick={() => setEditProgressUid(null)}
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(editStreakUid)}
        onClose={() => setEditStreakUid(null)}
        title="Edit Streak"
      >
        <div className="form-group">
          <label htmlFor="edit-lc-streak">LeetCode Streak</label>
          <input
            id="edit-lc-streak"
            name="lcStreak"
            type="number"
            autoComplete="off"
            value={editLcStreak}
            onChange={(e) => setEditLcStreak(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-gh-streak">GitHub Streak</label>
          <input
            id="edit-gh-streak"
            name="ghStreak"
            type="number"
            autoComplete="off"
            value={editGcStreak}
            onChange={(e) => setEditGcStreak(e.target.value)}
          />
        </div>
        <div className="coord-action-buttons">
          <button
            type="button"
            className="small-action-btn green"
            onClick={() => {
              updateParticipantStreaks(editStreakUid, editGcStreak, editLcStreak);
              setEditStreakUid(null);
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="small-action-btn red"
            onClick={() => setEditStreakUid(null)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
