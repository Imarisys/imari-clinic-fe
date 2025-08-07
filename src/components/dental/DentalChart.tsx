import React, { useState } from 'react';

// FDI numbering system (11-18, 21-28, 31-38, 41-48)
const FDI_NUMBERS = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38], // Reversed to mirror upper
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41] // Reversed to mirror upper
};

// Tooth type mapping for FDI numbers
const getToothType = (number: number): string => {
  const lastDigit = number % 10;
  switch (lastDigit) {
    case 1:
    case 2: return 'Incisor';
    case 3: return 'Canine';
    case 4:
    case 5: return 'premolar';
    case 6:
    case 7: return 'Molar';
    case 8: return 'Molar_3root';
    default: return 'Molar';
  }
};

// Function to get the appropriate tooth image based on tooth type and implant status
const getToothImage = (toothType: string, hasImplant: boolean): string => {
  if (hasImplant) {
    // Return implant-specific images
    switch (toothType) {
      case 'Incisor':
        return '/incisor_implant.png';
      case 'Canine':
        return '/canine_implant.png';
      case 'premolar':
        return '/premolar_implant.png';
      case 'Molar':
      case 'Molar_3root':
        return '/molar_implant.png';
      default:
        return '/molar_implant.png';
    }
  } else {
    // Return regular tooth images
    return `/${toothType}.png`;
  }
};

// Dental conditions
const DENTAL_CONDITIONS = [
  { id: 'caries', name: 'Caries', color: '#F59E0B', icon: 'warning' },
  { id: 'filling', name: 'Filling', color: '#6B7280', icon: 'build' },
  { id: 'crown', name: 'Crown', color: '#8B5CF6', icon: 'stars' },
  { id: 'root_canal', name: 'Root Canal', color: '#EF4444', icon: 'healing' },
  { id: 'extraction', name: 'Extraction', color: '#DC2626', icon: 'clear' },
  { id: 'implant', name: 'Implant', color: '#059669', icon: 'precision_manufacturing' },
  { id: 'bridge', name: 'Bridge', color: '#7C3AED', icon: 'link' },
  { id: 'missing', name: 'Missing', color: '#374151', icon: 'close' }
];

// Treatment types
const TREATMENT_TYPES = [
  { id: 'cleaning', name: 'Cleaning', color: '#06B6D4' },
  { id: 'filling', name: 'Filling', color: '#6B7280' },
  { id: 'crown', name: 'Crown', color: '#8B5CF6' },
  { id: 'root_canal', name: 'Root Canal', color: '#EF4444' },
  { id: 'extraction', name: 'Extraction', color: '#DC2626' },
  { id: 'implant', name: 'Implant', color: '#059669' },
  { id: 'bridge', name: 'Bridge', color: '#7C3AED' },
  { id: 'orthodontics', name: 'Orthodontics', color: '#F59E0B' },
  { id: 'whitening', name: 'Whitening', color: '#10B981' }
];

interface ToothData {
  number: number;
  condition: string;
  treatment?: string;
  notes?: string;
  surfaces?: Record<string, string>; // Surface name to condition mapping
}

interface ToothSurfaceData {
  [toothNumber: number]: Record<string, string>; // tooth -> surface -> condition
}

interface DentalChartProps {
  patientId?: string;
  appointmentId?: string;
  readonly?: boolean;
}

export const DentalChart: React.FC<DentalChartProps> = ({
  patientId,
  appointmentId,
  readonly = false
}) => {
  // TODO: Implement data persistence with patientId and appointmentId
  console.log('DentalChart initialized for patient:', patientId, 'appointment:', appointmentId);

  const [teethData, setTeethData] = useState<Record<number, ToothData>>({});
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string>('caries');
  const [selectedTreatment, setSelectedTreatment] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [toothSurfaces, setToothSurfaces] = useState<ToothSurfaceData>({});
  const [activeCondition, setActiveCondition] = useState<string>('caries');

  const getToothSurfaceColor = (toothNumber: number, surface: string): string => {
    const surfaceCondition = toothSurfaces[toothNumber]?.[surface];
    if (!surfaceCondition || surfaceCondition === 'implant') return 'transparent';

    const condition = DENTAL_CONDITIONS.find(c => c.id === surfaceCondition);
    return condition?.color || 'transparent';
  };

  const handleSurfaceClick = (toothNumber: number, surface: string) => {
    if (readonly) return;

    // Special behavior for extraction - apply to all surfaces of the tooth
    if (activeCondition === 'extraction') {
      const allSurfaces = ['upperLeft', 'upperCenter', 'upperRight', 'lowerLeft', 'lowerCenter', 'lowerRight', 'upper', 'lower'];
      setToothSurfaces(prev => ({
        ...prev,
        [toothNumber]: allSurfaces.reduce((acc, surf) => ({
          ...acc,
          [surf]: 'extraction'
        }), {})
      }));
    } else {
      // Apply the currently selected condition to the clicked surface
      setToothSurfaces(prev => ({
        ...prev,
        [toothNumber]: {
          ...prev[toothNumber],
          [surface]: activeCondition
        }
      }));
    }
  };

  const handleToothClick = (_toothNumber: number) => {
    // Removed popup functionality - no longer needed with condition selector
    return;
  };

  const updateToothData = () => {
    if (!selectedTooth) return;

    setTeethData(prev => ({
      ...prev,
      [selectedTooth]: {
        number: selectedTooth,
        condition: selectedCondition,
        treatment: selectedTreatment,
        notes: notes
      }
    }));

    setSelectedTooth(null);
    setSelectedCondition('caries');
    setSelectedTreatment('');
    setNotes('');
  };

  const getToothColor = (toothNumber: number) => {
    const toothData = teethData[toothNumber];
    if (!toothData) return '#F3F4F6'; // Default gray

    const condition = DENTAL_CONDITIONS.find(c => c.id === toothData.condition);
    return condition?.color || '#F3F4F6';
  };

  const getToothImageSize = (toothType: string) => {
    // Define different sizes for different tooth types to match their actual proportions
    switch (toothType) {
      case 'Incisor':
        return { width: 'w-12', height: 'h-16', size: '48px 64px' }; // Narrower width for incisors
      case 'Canine':
        return { width: 'w-12', height: 'h-16', size: '48px 64px' }; // Same as incisors
      case 'premolar':
        return { width: 'w-14', height: 'h-16', size: '56px 64px' }; // Medium width
      case 'Molar':
      case 'Molar_3root':
        return { width: 'w-16', height: 'h-16', size: '64px 64px' }; // Full width for molars
      default:
        return { width: 'w-16', height: 'h-16', size: '64px 64px' };
    }
  };

  const ToothComponent: React.FC<{ number: number; quadrant: string }> = ({ number, quadrant }) => {
    const toothType = getToothType(number);
    const isSelected = selectedTooth === number;
    const toothData = teethData[number];
    const toothSize = getToothImageSize(toothType);

    // Determine if tooth should be rotated (upper jaw teeth)
    const isUpperJaw = quadrant === 'upperRight' || quadrant === 'upperLeft';

    // Check if tooth has implant condition - either as overall tooth condition or on any surface
    const hasImplant = toothData?.condition === 'implant' ||
      Object.values(toothSurfaces[number] || {}).some(condition => condition === 'implant');

    // Check if tooth is missing - either as overall tooth condition or on any surface
    const isMissing = toothData?.condition === 'missing' ||
      Object.values(toothSurfaces[number] || {}).some(condition => condition === 'missing');

    return (
      <div className="relative flex flex-col items-center">
        {/* FDI Number */}
        <div className="text-sm font-bold text-gray-700 mb-2">{number}</div>

        {/* Tooth Image with Overlays or Missing Box */}
        <div
          className={`relative cursor-pointer transition-all duration-200 ${
            isSelected ? 'scale-110 ring-4 ring-blue-500 ring-opacity-50' : 'hover:scale-105'
          } ${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => handleToothClick(number)}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            width: toothSize.size.split(' ')[0],
            height: toothSize.size.split(' ')[1]
          }}
        >
          {isMissing ? (
            /* Missing tooth - grey box */
            <div
              className={`${toothSize.width} ${toothSize.height} bg-gray-400 flex items-center justify-center`}
              style={{
                borderRadius: '8px',
                padding: '2px',
                border: '2px solid #9CA3AF'
              }}
            >
              <span className="material-icons-round text-gray-600 text-lg">close</span>
            </div>
          ) : (
            <>
              {/* Base tooth image */}
              <img
                src={getToothImage(toothType, hasImplant)}
                alt={`Tooth ${number}`}
                className={`${toothSize.width} ${toothSize.height} object-contain transition-transform duration-200 ${
                  isUpperJaw ? 'rotate-180' : ''
                }`}
                style={{
                  borderRadius: '8px',
                  padding: '2px',
                  border: '2px solid #e5e7eb'
                }}
              />

              {/* Tooth Surface Overlays - Adaptive to tooth size */}
              <div className="absolute inset-0" style={{ padding: '2px' }}>
                {/* Upper Half - Split into 3 parts for lower jaw, or lower part for upper jaw */}
                {!isUpperJaw ? (
                  // Lower jaw - divide upper half into 3 parts
                  <div className="flex h-8 w-full">
                    {/* Upper Left */}
                    <div
                      className="w-1/3 h-full cursor-pointer"
                      style={{
                        backgroundColor: getToothSurfaceColor(number, 'upperLeft'),
                        opacity: getToothSurfaceColor(number, 'upperLeft') !== 'transparent' ? 0.6 : 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSurfaceClick(number, 'upperLeft');
                      }}
                      title="Upper Left Surface - Click to change condition"
                    />
                    {/* Upper Center */}
                    <div
                      className="w-1/3 h-full cursor-pointer"
                      style={{
                        backgroundColor: getToothSurfaceColor(number, 'upperCenter'),
                        opacity: getToothSurfaceColor(number, 'upperCenter') !== 'transparent' ? 0.6 : 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSurfaceClick(number, 'upperCenter');
                      }}
                      title="Upper Center Surface - Click to change condition"
                    />
                    {/* Upper Right */}
                    <div
                      className="w-1/3 h-full cursor-pointer"
                      style={{
                        backgroundColor: getToothSurfaceColor(number, 'upperRight'),
                        opacity: getToothSurfaceColor(number, 'upperRight') !== 'transparent' ? 0.6 : 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSurfaceClick(number, 'upperRight');
                      }}
                      title="Upper Right Surface - Click to change condition"
                    />
                  </div>
                ) : (
                  // Upper jaw - single lower part (becomes upper when rotated)
                  <div className="h-8 w-full mt-8">
                    <div
                      className="w-full h-full cursor-pointer"
                      style={{
                        backgroundColor: getToothSurfaceColor(number, 'lower'),
                        opacity: getToothSurfaceColor(number, 'lower') !== 'transparent' ? 0.6 : 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSurfaceClick(number, 'lower');
                      }}
                      title="Lower Surface - Click to change condition"
                    />
                  </div>
                )}

                {/* Lower Half */}
                {isUpperJaw ? (
                  // Upper jaw - divide lower half into 3 parts (becomes upper when rotated)
                  <div className="flex h-8 w-full">
                    {/* Lower Left */}
                    <div
                      className="w-1/3 h-full cursor-pointer"
                      style={{
                        backgroundColor: getToothSurfaceColor(number, 'lowerLeft'),
                        opacity: getToothSurfaceColor(number, 'lowerLeft') !== 'transparent' ? 0.6 : 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSurfaceClick(number, 'lowerLeft');
                      }}
                      title="Lower Left Surface - Click to change condition"
                    />
                    {/* Lower Center */}
                    <div
                      className="w-1/3 h-full cursor-pointer"
                      style={{
                        backgroundColor: getToothSurfaceColor(number, 'lowerCenter'),
                        opacity: getToothSurfaceColor(number, 'lowerCenter') !== 'transparent' ? 0.6 : 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSurfaceClick(number, 'lowerCenter');
                      }}
                      title="Lower Center Surface - Click to change condition"
                    />
                    {/* Lower Right */}
                    <div
                      className="w-1/3 h-full cursor-pointer"
                      style={{
                        backgroundColor: getToothSurfaceColor(number, 'lowerRight'),
                        opacity: getToothSurfaceColor(number, 'lowerRight') !== 'transparent' ? 0.6 : 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSurfaceClick(number, 'lowerRight');
                      }}
                      title="Lower Right Surface - Click to change condition"
                    />
                  </div>
                ) : (
                  // Lower jaw - single upper part
                  <div className="h-8 w-full">
                    <div
                      className="w-full h-full cursor-pointer"
                      style={{
                        backgroundColor: getToothSurfaceColor(number, 'upper'),
                        opacity: getToothSurfaceColor(number, 'upper') !== 'transparent' ? 0.6 : 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSurfaceClick(number, 'upper');
                      }}
                      title="Upper Surface - Click to change condition"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Condition indicator */}
          {toothData && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: getToothColor(number) }}
            />
          )}
        </div>

        {/* Treatment indicator */}
        {toothData?.treatment && (
          <div className="text-xs text-center mt-2 font-medium text-blue-600 leading-tight" style={{ maxWidth: toothSize.size.split(' ')[0] }}>
            {TREATMENT_TYPES.find(t => t.id === toothData.treatment)?.name}
          </div>
        )}
      </div>
    );

  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex gap-6">
        {/* Left Side - Dental Chart */}
        <div className="flex-1 space-y-8">
          {/* Upper Teeth */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-center mb-2">
              <div className="flex space-x-3">
                {FDI_NUMBERS.upperRight.map(number => (
                  <ToothComponent key={number} number={number} quadrant="upperRight" />
                ))}
              </div>
              <div className="mx-6 border-l-2 border-gray-300"></div>
              <div className="flex space-x-3">
                {FDI_NUMBERS.upperLeft.map(number => (
                  <ToothComponent key={number} number={number} quadrant="upperLeft" />
                ))}
              </div>
            </div>
          </div>

          {/* Lower Teeth */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-center mb-2">
              <div className="flex space-x-3">
                {FDI_NUMBERS.lowerRight.map(number => (
                  <ToothComponent key={number} number={number} quadrant="lowerRight" />
                ))}
              </div>
              <div className="mx-6 border-l-2 border-gray-300"></div>
              <div className="flex space-x-3">
                {FDI_NUMBERS.lowerLeft.map(number => (
                  <ToothComponent key={number} number={number} quadrant="lowerLeft" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Condition Selector */}
        <div className="w-80 bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="material-icons-round text-blue-600 mr-2">palette</span>
            Select Condition
          </h4>

          {/* Active Condition Display */}
          <div className="mb-4 p-3 bg-white rounded-lg border-2 border-blue-200">
            <div className="flex items-center space-x-3">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: DENTAL_CONDITIONS.find(c => c.id === activeCondition)?.color }}
              />
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {DENTAL_CONDITIONS.find(c => c.id === activeCondition)?.name}
                </div>
                <div className="text-xs text-gray-600">Currently selected</div>
              </div>
            </div>
          </div>

          {/* Condition Buttons */}
          <div className="space-y-2">
            {DENTAL_CONDITIONS.map(condition => (
              <button
                key={condition.id}
                onClick={() => setActiveCondition(condition.id)}
                disabled={readonly}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                  activeCondition === condition.id
                    ? 'bg-blue-100 border-2 border-blue-300 shadow-md'
                    : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: condition.color }}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{condition.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Click tooth surfaces to apply
                  </div>
                </div>
                <span className={`material-icons-round text-sm ${
                  activeCondition === condition.id ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {condition.icon}
                </span>
              </button>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <span className="material-icons-round text-blue-600 text-sm mt-0.5">info</span>
              <div className="text-xs text-blue-800">
                <div className="font-semibold mb-1">How to use:</div>
                <div>1. Select a condition above</div>
                <div>2. Click on tooth surfaces to apply the condition</div>
                <div>3. Colors will appear on affected areas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-3">Conditions Legend</h4>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {DENTAL_CONDITIONS.map(condition => (
            <div key={condition.id} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: condition.color }}
              />
              <span className="text-xs">{condition.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooth Selection Modal */}
      {selectedTooth && !readonly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Tooth {selectedTooth}</h3>

            {/* Condition Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {DENTAL_CONDITIONS.map(condition => (
                  <option key={condition.id} value={condition.id}>
                    {condition.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Treatment Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Planned Treatment</label>
              <select
                value={selectedTreatment}
                onChange={(e) => setSelectedTreatment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No treatment planned</option>
                {TREATMENT_TYPES.map(treatment => (
                  <option key={treatment.id} value={treatment.id}>
                    {treatment.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this tooth..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={updateToothData}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setSelectedTooth(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
