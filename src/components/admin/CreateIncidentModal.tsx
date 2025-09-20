import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Box,
  Alert,
  CircularProgress,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Service, Incident } from '../../types';
import { api } from '../../services/api';

interface CreateIncidentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  incident?: Incident | null;
  services: Service[];
}

type IncidentType = 'incident' | 'maintenance';
type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'scheduled' | 'in_progress' | 'completed';
type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  open,
  onClose,
  onSuccess,
  incident,
  services,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [type, setType] = useState<IncidentType>('incident');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IncidentStatus>('investigating');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [affectedServices, setAffectedServices] = useState<string[]>([]);
  const [scheduledStartTime, setScheduledStartTime] = useState<Date | null>(null);
  const [scheduledEndTime, setScheduledEndTime] = useState<Date | null>(null);

  // Status options based on type
  const getStatusOptions = (): IncidentStatus[] => {
    if (type === 'incident') {
      return ['investigating', 'identified', 'monitoring', 'resolved'];
    } else {
      return ['scheduled', 'in_progress', 'completed'];
    }
  };

  // Initialize form with incident data if editing
  useEffect(() => {
    if (incident) {
      setType(incident.type);
      setTitle(incident.title);
      setDescription(incident.description);
      setStatus(incident.status);
      setSeverity(incident.severity || 'medium');
      setAffectedServices(incident.affectedServices || []);
      setScheduledStartTime(incident.scheduledStartTime ? new Date(incident.scheduledStartTime) : null);
      setScheduledEndTime(incident.scheduledEndTime ? new Date(incident.scheduledEndTime) : null);
    } else {
      // Reset form for new incident
      setType('incident');
      setTitle('');
      setDescription('');
      setStatus('investigating');
      setSeverity('medium');
      setAffectedServices([]);
      setScheduledStartTime(null);
      setScheduledEndTime(null);
    }
    setError(null);
  }, [incident, open]);

  // Update status when type changes
  useEffect(() => {
    if (type === 'incident') {
      setStatus('investigating');
    } else {
      setStatus('scheduled');
    }
  }, [type]);

  const handleServiceChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setAffectedServices(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      if (!description.trim()) {
        setError('Description is required');
        return;
      }

      if (affectedServices.length === 0) {
        setError('At least one affected service must be selected');
        return;
      }

      if (type === 'maintenance' && (!scheduledStartTime || !scheduledEndTime)) {
        setError('Scheduled start and end times are required for maintenance');
        return;
      }

      const data: any = {
        type,
        title,
        description,
        status,
        affectedServices,
      };

      // Add severity for incidents
      if (type === 'incident') {
        data.severity = severity;
      }

      // Add scheduled times for maintenance
      if (type === 'maintenance') {
        data.scheduledStartTime = scheduledStartTime?.toISOString();
        data.scheduledEndTime = scheduledEndTime?.toISOString();
      }

      if (incident) {
        // Update existing incident
        await api.put(`/api/admin/incidents/${incident._id}`, data);
      } else {
        // Create new incident
        await api.post('/api/admin/incidents', data);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save incident');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        {incident ? 'Edit Incident/Maintenance' : 'Create New Incident/Maintenance'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={type}
                  label="Type"
                  onChange={(e) => setType(e.target.value as IncidentType)}
                  disabled={!!incident}
                >
                  <MenuItem value="incident">Incident</MenuItem>
                  <MenuItem value="maintenance">Scheduled Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                required
                disabled={loading}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                  disabled={loading}
                >
                  {getStatusOptions().map((option) => (
                    <MenuItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Severity (only for incidents) */}
            {type === 'incident' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={severity}
                    label="Severity"
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    disabled={loading}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Scheduled Times (only for maintenance) */}
            {type === 'maintenance' && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Scheduled Start Time"
                    value={scheduledStartTime}
                    onChange={setScheduledStartTime}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        disabled: loading,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Scheduled End Time"
                    value={scheduledEndTime}
                    onChange={setScheduledEndTime}
                    minDateTime={scheduledStartTime || undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        disabled: loading,
                      },
                    }}
                  />
                </Grid>
              </LocalizationProvider>
            )}

            {/* Affected Services */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Affected Services</InputLabel>
                <Select
                  multiple
                  value={affectedServices}
                  onChange={handleServiceChange}
                  input={<OutlinedInput label="Affected Services" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((serviceId) => {
                        const service = services.find(s => s._id === serviceId);
                        return (
                          <Chip 
                            key={serviceId} 
                            label={service?.name || serviceId}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                  disabled={loading}
                  required
                >
                  {services.map((service) => (
                    <MenuItem key={service._id} value={service._id}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {incident ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateIncidentModal;