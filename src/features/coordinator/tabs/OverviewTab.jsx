import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import Modal from '../../../components/ui/Modal';

export default function OverviewTab({ participants }) {
  const {
    toggleUserStatus,
    resetParticipantStreak,
    updateParticipantStreaks,
    editParticipantProgress,
  } = useApp();

  const [participantSearch, setParticipantSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [editProgressUid, setEditProgressUid] = useState(null);
  const [editCodingScore, setEditCodingScore] = useState('');
  const [editDebugScore, setEditDebugScore] = useState('');
  const [editStreakUid, setEditStreakUid] = useState(null);
  const [editLcStreak, setEditLcStreak] = useState('');
  const [editGcStreak, setEditGcStreak] = useState('');

  const filteredParticipants = participants.filter((p) => {
    const term = participantSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.studentId.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  });

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
          onChange={(e) => setParticipantSearch(e.target.value)}
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
              <th scope="col">Streaks</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{p.studentId}</td>
                <td>{p.totalCodingScore} / {p.totalDebuggingScore}</td>
                <td>LC {p.leetCodeStreak} · GH {p.gitHubStreak}</td>
                <td>
                  <span className={`badge-status ${p.isActive ? 'submitted' : 'missed'}`}>
                    {p.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td>
                  <div className="coord-action-buttons">
                    <button type="button" className="small-action-btn grey" onClick={() => setSelectedParticipant(p)}>
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="small-action-btn grey"
                      onClick={() => {
                        setEditStreakUid(p.id);
                        setEditLcStreak(p.leetCodeStreak);
                        setEditGcStreak(p.gitHubStreak);
                      }}
                    >
                      Edit Streak
                    </button>
                    <button
                      type="button"
                      className="small-action-btn grey"
                      onClick={() => {
                        setEditProgressUid(p.id);
                        setEditCodingScore(p.totalCodingScore);
                        setEditDebugScore(p.totalDebuggingScore);
                      }}
                    >
                      Edit Progress
                    </button>
                    <button type="button" className="small-action-btn grey" onClick={() => resetParticipantStreak(p.id)}>
                      Reset Streak
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

      <Modal
        isOpen={Boolean(selectedParticipant)}
        onClose={() => setSelectedParticipant(null)}
        title={selectedParticipant?.name}
      >
        {selectedParticipant && (
          <>
            <p><strong>Email:</strong> {selectedParticipant.email}</p>
            <p><strong>SAP ID:</strong> {selectedParticipant.studentId}</p>
            <p><strong>GitHub:</strong> @{selectedParticipant.gitHubId}</p>
            <p><strong>LeetCode:</strong> @{selectedParticipant.leetCodeId}</p>
            <p><strong>Overall Rank:</strong> #{selectedParticipant.overallRank}</p>
            <p><strong>Coding Score:</strong> {selectedParticipant.totalCodingScore} pts</p>
            <p><strong>Debug Score:</strong> {selectedParticipant.totalDebuggingScore} pts</p>
          </>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editProgressUid)}
        onClose={() => setEditProgressUid(null)}
        title="Edit Progress"
      >
        <div className="form-group">
          <label htmlFor="edit-coding-score">Coding Score</label>
          <input
            id="edit-coding-score"
            name="codingScore"
            type="number"
            autoComplete="off"
            value={editCodingScore}
            onChange={(e) => setEditCodingScore(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-debug-score">Debug Score</label>
          <input
            id="edit-debug-score"
            name="debugScore"
            type="number"
            autoComplete="off"
            value={editDebugScore}
            onChange={(e) => setEditDebugScore(e.target.value)}
          />
        </div>
        <div className="coord-action-buttons">
          <button
            type="button"
            className="small-action-btn green"
            onClick={() => {
              editParticipantProgress(editProgressUid, editCodingScore, editDebugScore);
              setEditProgressUid(null);
            }}
          >
            Save
          </button>
          <button type="button" className="small-action-btn red" onClick={() => setEditProgressUid(null)}>
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
          <button type="button" className="small-action-btn red" onClick={() => setEditStreakUid(null)}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
