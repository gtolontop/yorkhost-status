'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import '../admin.css';

interface Service {
  id: string;
  name: string;
}

interface Incident {
  id: string;
  type: 'incident' | 'maintenance';
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'scheduled' | 'in_progress' | 'completed';
  severity: 'minor' | 'major' | 'critical';
  affectedServices: string[];
  createdAt: string;
  updatedAt: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'incident' | 'maintenance'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    type: 'incident' as 'incident' | 'maintenance',
    title: '',
    description: '',
    status: 'investigating' as Incident['status'],
    severity: 'minor' as Incident['severity'],
    affectedServices: [] as string[],
    scheduledStart: '',
    scheduledEnd: ''
  });

  useEffect(() => {
    fetchIncidents();
    fetchServices();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const data = await response.json();
      setIncidents(data);
    } catch (err) {
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingIncident 
        ? `/api/incidents/${editingIncident.id}`
        : '/api/incidents';
      
      const method = editingIncident ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save incident');
      
      await fetchIncidents();
      closeModal();
    } catch (err) {
      setError('Failed to save incident');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;
    
    try {
      const response = await fetch(`/api/incidents/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete incident');
      await fetchIncidents();
    } catch (err) {
      setError('Failed to delete incident');
    }
  };

  const openModal = (incident?: Incident) => {
    if (incident) {
      setEditingIncident(incident);
      setFormData({
        type: incident.type,
        title: incident.title,
        description: incident.description,
        status: incident.status,
        severity: incident.severity,
        affectedServices: incident.affectedServices,
        scheduledStart: incident.scheduledStart || '',
        scheduledEnd: incident.scheduledEnd || ''
      });
    } else {
      setEditingIncident(null);
      setFormData({
        type: 'incident',
        title: '',
        description: '',
        status: 'investigating',
        severity: 'minor',
        affectedServices: [],
        scheduledStart: '',
        scheduledEnd: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIncident(null);
  };

  const getStatusOptions = () => {
    if (formData.type === 'incident') {
      return ['investigating', 'identified', 'monitoring', 'resolved'];
    } else {
      return ['scheduled', 'in_progress', 'completed'];
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      investigating: 'badge-warning',
      identified: 'badge-warning',
      monitoring: 'badge-info',
      resolved: 'badge-success',
      scheduled: 'badge-info',
      in_progress: 'badge-warning',
      completed: 'badge-success'
    };
    return statusClasses[status] || 'badge-secondary';
  };

  const getSeverityBadgeClass = (severity: string) => {
    const severityClasses: { [key: string]: string } = {
      minor: 'badge-info',
      major: 'badge-warning',
      critical: 'badge-danger'
    };
    return severityClasses[severity] || 'badge-secondary';
  };

  const filteredIncidents = incidents.filter(incident => {
    if (typeFilter !== 'all' && incident.type !== typeFilter) return false;
    if (statusFilter !== 'all' && incident.status !== statusFilter) return false;
    return true;
  });

  if (loading) return <AdminLayout><div className="loading">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <h1>Incidents & Maintenance</h1>
          <button onClick={() => openModal()} className="btn btn-primary">
            Create New
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filters">
          <div className="filter-group">
            <label>Type:</label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="form-select"
            >
              <option value="all">All Types</option>
              <option value="incident">Incidents</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Statuses</option>
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Affected Services</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident) => (
                <tr key={incident.id}>
                  <td>
                    <span className={`badge ${incident.type === 'incident' ? 'badge-danger' : 'badge-info'}`}>
                      {incident.type}
                    </span>
                  </td>
                  <td>{incident.title}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(incident.status)}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getSeverityBadgeClass(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td>
                    {incident.affectedServices.length > 0 ? (
                      <div className="service-list">
                        {incident.affectedServices.map((serviceId, index) => {
                          const service = services.find(s => s.id === serviceId);
                          return (
                            <span key={index} className="service-tag">
                              {service?.name || serviceId}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td>{new Date(incident.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openModal(incident)} className="btn btn-sm btn-secondary">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(incident.id)} className="btn btn-sm btn-danger">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredIncidents.length === 0 && (
            <div className="empty-state">
              No incidents found matching your filters.
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingIncident ? 'Edit' : 'Create'} {formData.type === 'incident' ? 'Incident' : 'Maintenance'}</h2>
                <button onClick={closeModal} className="close-button">&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      type: e.target.value as 'incident' | 'maintenance',
                      status: e.target.value === 'incident' ? 'investigating' : 'scheduled'
                    })}
                    className="form-control"
                  >
                    <option value="incident">Incident</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control"
                    rows={4}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Incident['status'] })}
                      className="form-control"
                    >
                      {getStatusOptions().map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as Incident['severity'] })}
                      className="form-control"
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Affected Services</label>
                  <div className="checkbox-group">
                    {services.map(service => (
                      <label key={service.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.affectedServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                affectedServices: [...formData.affectedServices, service.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                affectedServices: formData.affectedServices.filter(id => id !== service.id)
                              });
                            }
                          }}
                        />
                        {service.name}
                      </label>
                    ))}
                  </div>
                </div>

                {formData.type === 'maintenance' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Scheduled Start</label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledStart}
                        onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label>Scheduled End</label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledEnd}
                        onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>
                )}

                <div className="modal-footer">
                  <button type="button" onClick={closeModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingIncident ? 'Update' : 'Create'} {formData.type === 'incident' ? 'Incident' : 'Maintenance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default IncidentsPage;