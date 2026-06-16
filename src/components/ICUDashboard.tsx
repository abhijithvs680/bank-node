
import { useState } from 'react';
import { PatientOverview } from './PatientOverview';
import { VitalSigns } from './VitalSigns';
import { Medications } from './Medications';
import { NotesAndObservations } from './NotesAndObservations';
import { AddFindingModal } from './AddFindingModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import UserProfile from '@/components/UserProfile';

export const ICUDashboard = () => {
  const [isAddFindingOpen, setIsAddFindingOpen] = useState(false);

  const handleAddMedication = () => {
    console.log('Add medication clicked');
  };

  const handleEditMedication = (medication: any) => {
    console.log('Edit medication clicked:', medication);
  };

  return (
    <div className="min-h-screen bg-medical-surface">
      {/* Header */}
      <header className="bg-white border-b border-medical-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-medical-primary">ICU Monitor</h1>
            <p className="text-sm text-muted-foreground">Intensive Care Unit - Ward 3A</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsAddFindingOpen(true)}
              className="bg-medical-primary hover:bg-medical-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Finding
            </Button>
            <UserProfile variant="header" />
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6">
            <PatientOverview patientData={[]} consultationId="" />
            <VitalSigns />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <Medications 
              onAddMedication={handleAddMedication}
              onEditMedication={handleEditMedication}
              medications={[]}
              loading={false}
              admissionId=""
              setMedications={() => {}}
            />
            <NotesAndObservations />
          </div>
        </div>
      </main>

      <AddFindingModal 
        consultationId="ICU2024001"
        isOpen={isAddFindingOpen}
        onClose={() => setIsAddFindingOpen(false)}
      />
    </div>
  );
};
