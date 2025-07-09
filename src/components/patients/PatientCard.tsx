interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  lastVisit?: string;
  nextAppointment?: string;
  status: 'active' | 'inactive';
}

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="material-icons text-blue-600">person</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-500">{patient.age} years • {patient.gender}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          patient.status === 'active' 
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {patient.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Last Visit</p>
          <p className="text-sm">{patient.lastVisit || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Next Appointment</p>
          <p className="text-sm">{patient.nextAppointment || 'None scheduled'}</p>
        </div>
      </div>
    </div>
  );
};
