import React, { useState, useEffect } from 'react';
import { 
  getAllReports, 
  updateReportStatus, 
  type QuestionReport, 
  type ReportStatus 
} from '../firebase/reports';
import useInlineNotification from '../hooks/useInlineNotification';
import './ReportsManager.css';

interface ReportsManagerProps {
  onUpdate?: () => void;
}

const ReportsManager: React.FC<ReportsManagerProps> = ({ onUpdate }) => {
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const { inlineNotification, showError, showSuccess } = useInlineNotification({ autoClose: true, autoCloseDelay: 3000 });

  const loadReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const reportsData = await getAllReports();
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
      showError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleReportAction = async (reportId: string, action: ReportStatus) => {
    try {
      await updateReportStatus(reportId, action);
      showSuccess(`Report ${action === 'resolved' ? 'resolved' : 'dismissed'} successfully`);
      await loadReports();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating report:', error);
      showError('Failed to update report');
    }
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(report => report.status === filter);

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'open': return '#ff9800';
      case 'resolved': return '#4caf50';
      case 'dismissed': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Unknown';
    const ts = timestamp as { toDate?: () => Date };
    const date = ts.toDate ? ts.toDate() : new Date(timestamp as string);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="loader">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="reports-manager">
      {/* Inline notification area */}
      {inlineNotification}
      <div className="reports-header">
        <h2>Question Reports</h2>
        <div className="reports-stats">
          <span className="stat">Total: {reports.length}</span>
          <span className="stat">Open: {reports.filter(r => r.status === 'open').length}</span>
          <span className="stat">Resolved: {reports.filter(r => r.status === 'resolved').length}</span>
        </div>
      </div>

      <div className="reports-filters">
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as ReportStatus | 'all')}>
          <option value="all">All Reports</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <button onClick={loadReports} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {filteredReports.length === 0 ? (
        <div className="no-reports">
          {filter === 'all' 
            ? 'No reports submitted yet.' 
            : `No ${filter} reports.`
          }
        </div>
      ) : (
        <div className="reports-list">
          {filteredReports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <div className="report-type">
                  <strong>{report.reportType.toUpperCase()}</strong>
                  <span 
                    className="report-status" 
                    style={{ color: getStatusColor(report.status) }}
                  >
                    {report.status.toUpperCase()}
                  </span>
                </div>
                <div className="report-date">
                  {formatDate(report.createdAt)}
                </div>
              </div>

              <div className="report-question">
                <h4>Question:</h4>
                <p>{report.questionText}</p>
                <div className="question-details">
                  <strong>Answer:</strong> {report.answer} | 
                  <strong> Topic:</strong> {report.topic}
                </div>
              </div>

              {report.message && (
                <div className="report-message">
                  <h4>Reporter's Message:</h4>
                  <p>{report.message}</p>
                </div>
              )}

              <div className="report-actions">
                {report.status === 'open' && (
                  <>
                    <button
                      className="resolve-btn"
                      onClick={() => handleReportAction(report.id!, 'resolved')}
                    >
                      ✅ Resolve
                    </button>
                    <button
                      className="dismiss-btn"
                      onClick={() => handleReportAction(report.id!, 'dismissed')}
                    >
                      ❌ Dismiss
                    </button>
                  </>
                )}
                {report.status !== 'open' && (
                  <button
                    className="reopen-btn"
                    onClick={() => handleReportAction(report.id!, 'open')}
                  >
                    🔄 Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsManager;
