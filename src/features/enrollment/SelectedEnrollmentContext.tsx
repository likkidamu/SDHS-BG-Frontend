import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { LearningEnrollment } from './models';

interface SelectedEnrollmentContextValue {
  selectedEnrollment: LearningEnrollment | null;
  selectEnrollment: (enrollment: LearningEnrollment) => void;
  clearSelectedEnrollment: () => void;
}

const SelectedEnrollmentContext = createContext<SelectedEnrollmentContextValue | undefined>(undefined);

export function SelectedEnrollmentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedEnrollment, setSelectedEnrollment] = useState<LearningEnrollment | null>(null);

  useEffect(() => {
    setSelectedEnrollment(null);
  }, [user?.volunteerId]);

  const value = useMemo(() => ({
    selectedEnrollment,
    selectEnrollment: setSelectedEnrollment,
    clearSelectedEnrollment: () => setSelectedEnrollment(null),
  }), [selectedEnrollment]);

  return (
    <SelectedEnrollmentContext.Provider value={value}>
      {children}
    </SelectedEnrollmentContext.Provider>
  );
}

export function useSelectedEnrollment() {
  const context = useContext(SelectedEnrollmentContext);
  if (!context) {
    throw new Error('useSelectedEnrollment must be used within SelectedEnrollmentProvider');
  }
  return context;
}
