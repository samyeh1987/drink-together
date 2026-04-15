'use client';

import { useState, useMemo } from 'react';
import {
  Search, Eye, X, AlertTriangle, CheckCircle2, XCircle,
  Clock, MessageSquare, User, ChevronRight, Filter,
  Mail, Calendar, ShieldCheck, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_REPORTS, ADMIN_STATUS_COLORS, REPORT_REASON_LABELS, type AdminReport } from '../data';

export default function AdminReportsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const filtered = useMemo(() => {
    let list = [...DEMO_REPORTS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.reporter_name.toLowerCase().includes(q) ||
        r.meal_title.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [search, statusFilter]);

  const stats = useMemo(() => ({
    total: DEMO_REPORTS.length,
    pending: DEMO_REPORTS.filter(r => r.status === 'pending').length,
    reviewing: DEMO_REPORTS.filter(r => r.status === 'reviewing').length,
    resolved: DEMO_REPORTS.filter(r => r.status === 'resolved').length,
  }), []);

  const handleResolve = (report: AdminReport, action: 'resolved' | 'dismissed') => {
    alert(`Report ${report.id} ${action}: ${resolutionNote || '(no note)'}`);
    setSelectedReport(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Review and handle user-submitted reports.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Reports', value: stats.total, icon: AlertTriangle, color: 'from-[#FF6B35] to-[#FF6B6B]' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
          { label: 'Under Review', value: stats.reviewing, icon: Eye, color: 'from-blue-500 to-blue-600' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'from-[#2EC4B6] to-[#5DD9CE]' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize',
                statusFilter === s ? 'bg-[#FF6B35] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Report List */}
      <div className="space-y-3">
        {filtered.map(report => (
          <div
            key={report.id}
            onClick={() => { setSelectedReport(report); setResolutionNote(''); }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                report.status === 'pending' ? 'bg-yellow-50' :
                report.status === 'reviewing' ? 'bg-blue-50' :
                report.status === 'resolved' ? 'bg-[#2EC4B6]/10' : 'bg-gray-100'
              )}>
                {report.status === 'pending' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : report.status === 'reviewing' ? (
                  <Eye className="w-5 h-5 text-blue-500" />
                ) : report.status === 'resolved' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#2EC4B6]" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full capitalize', ADMIN_STATUS_COLORS[report.status])}>
                    {report.status}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {REPORT_REASON_LABELS[report.reason] || report.reason}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mb-1">{report.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {report.reporter_name}
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {report.reported_user_name || 'N/A'}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="truncate">{report.meal_title}</span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">Report Details</h2>
                <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full capitalize', ADMIN_STATUS_COLORS[selectedReport.status])}>
                  {selectedReport.status}
                </span>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Reason */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {REPORT_REASON_LABELS[selectedReport.reason] || selectedReport.reason}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedReport.description}</p>
              </div>

              {/* People */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[11px] text-gray-500">Reporter</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedReport.reporter_name}</p>
                  <p className="text-[11px] text-gray-400">{selectedReport.reporter_email}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-[11px] text-gray-500">Reported</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedReport.reported_user_name || 'N/A'}</p>
                  <p className="text-[11px] text-gray-400">{selectedReport.reported_user_email || 'N/A'}</p>
                </div>
              </div>

              {/* Related Meal */}
              <div className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] text-gray-500">Related Meal</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{selectedReport.meal_title}</p>
                <p className="text-[11px] text-gray-400">ID: {selectedReport.meal_id}</p>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                Reported: {new Date(selectedReport.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Existing Resolution (if resolved/dismissed) */}
              {selectedReport.resolution_note && (
                <div className="bg-[#2EC4B6]/5 border border-[#2EC4B6]/20 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2EC4B6]" />
                    <span className="text-[11px] font-medium text-[#2EC4B6]">Resolution</span>
                  </div>
                  <p className="text-sm text-gray-700">{selectedReport.resolution_note}</p>
                  {selectedReport.resolved_at && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(selectedReport.resolved_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              )}

              {/* Action area (only for pending/reviewing) */}
              {(selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Resolution Note</label>
                    <textarea
                      value={resolutionNote}
                      onChange={e => setResolutionNote(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none"
                      placeholder="Describe the action taken..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResolve(selectedReport, 'dismissed')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Dismiss
                    </button>
                    <button
                      onClick={() => handleResolve(selectedReport, 'resolved')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Resolve
                    </button>
                  </div>
                  <button
                    onClick={() => alert(`Notification sent to ${selectedReport.reporter_name}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Send className="w-4 h-4" /> Notify Reporter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
