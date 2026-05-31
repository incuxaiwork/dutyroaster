import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [officers, setOfficers] = useState([]);
  const [dutyTypes, setDutyTypes] = useState([]);
  const [config, setConfig] = useState(null);
  const [rosters, setRosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoster, setActiveRoster] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [o, d, c, r] = await Promise.all([
        api.getOfficers(), api.getDuties(), api.getConfig(), api.getRosters()
      ]);
      setOfficers(o.data.data);
      setDutyTypes(d.data.data);
      setConfig(c.data.data);
      setRosters(r.data.data);
      if (r.data.data.length > 0) setActiveRoster(r.data.data[0]);
    } catch (err) {
      toast.error('Failed to connect to server. Is the backend running?');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refreshOfficers = async () => {
    const res = await api.getOfficers();
    setOfficers(res.data.data);
  };

  const refreshDuties = async () => {
    const res = await api.getDuties();
    setDutyTypes(res.data.data);
  };

  const refreshRosters = async () => {
    const res = await api.getRosters();
    setRosters(res.data.data);
    if (res.data.data.length > 0) setActiveRoster(res.data.data[0]);
  };

  return (
    <AppContext.Provider value={{
      officers, dutyTypes, config, rosters, loading, activeRoster,
      setOfficers, setDutyTypes, setConfig, setRosters, setActiveRoster,
      refreshOfficers, refreshDuties, refreshRosters, loadAll,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);