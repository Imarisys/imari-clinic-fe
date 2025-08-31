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

interface ToothProps { toothNumber: number; quadrant: string }

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
  const [toothSurfaces, setToothSurfaces] = useState<ToothSurfaceData>({});
  const [activeCondition, setActiveCondition] = useState<string>('caries');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  // Removed containerRef and containerWidth to stop screen-size based sizing
  // const containerRef = useRef<HTMLDivElement | null>(null);
  // const [containerWidth, setContainerWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  // Zoom factor (user-controlled). 1 = default. Range 0.7x - 2.0x
  const [zoom, setZoom] = useState<number>(1);

  // Removed ResizeObserver-based effect; sizes are no longer tied to screen width
  // useEffect(() => { /* removed */ }, []);

  const clamp = (min: number, val: number, max: number) => Math.max(min, Math.min(max, val));

  // Helper to get color by condition id
  const getConditionColor = (id?: string) => {
    if (!id) return 'transparent';
    return DENTAL_CONDITIONS.find(c => c.id === id)?.color ?? 'transparent';
  };

  // Surface color based on assigned surface condition
  const getToothSurfaceColor = (toothNumber: number, surface: string): string => {
    const cond = toothSurfaces[toothNumber]?.[surface];
    return getConditionColor(cond);
  };

  // Click on a tooth surface to apply/toggle the active condition
  const handleSurfaceClick = (toothNumber: number, surface: string) => {
    if (readonly) return;
    setToothSurfaces(prev => {
      const current = prev[toothNumber]?.[surface];
      const nextCond = current === activeCondition ? undefined : activeCondition;
      const nextForTooth = { ...(prev[toothNumber] || {}) } as Record<string, string>;
      if (nextCond) nextForTooth[surface] = nextCond; else delete nextForTooth[surface];
      return { ...prev, [toothNumber]: nextForTooth };
    });
  };

  // Overall tooth color indicator
  const getToothColor = (toothNumber: number) => {
    const cond = teethData[toothNumber]?.condition;
    return getConditionColor(cond);
  };

  // Open modal for a tooth
  const handleToothClick = (toothNumber: number) => {
    const td = teethData[toothNumber];
    setSelectedTooth(toothNumber);
    setSelectedCondition(td?.condition || activeCondition || 'caries');
    setSelectedTreatment(td?.treatment || '');
    setNotes(td?.notes || '');
  };

  // Save changes for selected tooth
  const updateToothData = () => {
    if (selectedTooth == null) return;
    setTeethData(prev => ({
      ...prev,
      [selectedTooth]: {
        number: selectedTooth,
        condition: selectedCondition,
        treatment: selectedTreatment || undefined,
        notes: notes || undefined,
        surfaces: toothSurfaces[selectedTooth] || undefined
      }
    }));
    setSelectedTooth(null);
  };

  const getToothImageSize = (toothType: string) => {
    // Fixed base size independent of screen width; scales only with zoom
    const baseUnit = 60 * zoom; // was 100, slightly smaller now
    switch (toothType) {
      case 'Incisor':
        return { w: Math.round(baseUnit * 0.9), h: Math.round(baseUnit * 1.35) };
      case 'Canine':
        return { w: Math.round(baseUnit * 0.95), h: Math.round(baseUnit * 1.35) };
      case 'premolar':
        return { w: Math.round(baseUnit * 1.1), h: Math.round(baseUnit * 1.35) };
      case 'Molar':
      case 'Molar_3root':
        return { w: Math.round(baseUnit * 1.35), h: Math.round(baseUnit * 1.35) };
      default:
        return { w: Math.round(baseUnit * 1.2), h: Math.round(baseUnit * 1.35) };
    }
  };

  const ToothComponent: React.FC<ToothProps> = ({ toothNumber, quadrant }) => {
    const toothType = getToothType(toothNumber);
    const isSelected = selectedTooth === toothNumber;
    const toothData = teethData[toothNumber];
    const toothSize = getToothImageSize(toothType);

    // Determine if tooth should be rotated (upper jaw teeth)
    const isUpperJaw = quadrant === 'upperRight' || quadrant === 'upperLeft';

    // Check if tooth has implant condition - either as overall tooth condition or on any surface
    const hasImplant = toothData?.condition === 'implant' ||
      Object.values(toothSurfaces[toothNumber] || {}).some(condition => condition === 'implant');

    // Check if tooth is missing - either as overall tooth condition or on any surface
    const isMissing = toothData?.condition === 'missing' ||
      Object.values(toothSurfaces[toothNumber] || {}).some(condition => condition === 'missing');

    return (
      <div className="relative flex flex-col items-center">
        {/* FDI Number */}
        <div
          className="font-bold text-gray-700 mb-2"
          style={{ fontSize: `${Math.max(10, Math.round(toothSize.h * 0.14))}px` }}
        >
          {toothNumber}
        </div>

        {/* Tooth Image with Overlays or Missing Box */}
        <div
          className={`relative cursor-pointer transition-all duration-200 ${
            isSelected ? 'scale-110 ring-4 ring-blue-500 ring-opacity-50' : 'hover:scale-105'
          } ${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => handleToothClick(toothNumber)}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            width: `${toothSize.w}px`,
            height: `${toothSize.h}px`
          }}
        >
          {isMissing ? (
            /* Missing tooth - grey box */
            <div
              className={`bg-gray-400 flex items-center justify-center`}
              style={{
                width: `${toothSize.w}px`,
                height: `${toothSize.h}px`,
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
                alt={`Tooth ${toothNumber}`}
                className={`object-contain transition-transform duration-200 ${
                   isUpperJaw ? 'rotate-180' : ''
                 }`}
                 style={{
                  width: `${toothSize.w}px`,
                  height: `${toothSize.h}px`,
                   borderRadius: '8px',
                   padding: '2px',
                   border: '2px solid #ffffff'
                 }}
              />

              {/* Tooth Surface Overlays - Properly contained within tooth boundaries */}
              <div className="absolute inset-0" style={{ padding: '2px', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Upper Half - Properly positioned within tooth boundaries */}
                <div
                  className="flex w-full absolute"
                  style={{
                    ...(isUpperJaw ? { bottom: 6 } : { top: 6 }),
                    height: `${Math.max(12, Math.round(toothSize.h * 0.32))}px`
                  }}
                >
                  {/* Surface areas - reverse order for upper jaw to account for rotation */}
                  {isUpperJaw ? (
                    <>
                      {/* Upper jaw - reversed order due to 180° rotation */}
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperRight'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperRight') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'upperRight');
                        }}
                        title="Upper Right Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperCenter'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperCenter') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'upperCenter');
                        }}
                        title="Upper Center Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperLeft'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperLeft') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'upperLeft');
                        }}
                        title="Upper Left Surface - Click to change condition"
                      />
                    </>
                  ) : (
                    <>
                      {/* Lower jaw - normal order */}
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperLeft'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperLeft') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'upperLeft');
                        }}
                        title="Upper Left Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperCenter'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperCenter') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'upperCenter');
                        }}
                        title="Upper Center Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperRight'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperRight') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'upperRight');
                        }}
                        title="Upper Right Surface - Click to change condition"
                      />
                    </>
                  )}
                </div>

                {/* Lower Half - Properly positioned within tooth boundaries */}
                <div
                  className="flex w-full absolute"
                  style={{
                    ...(isUpperJaw ? { top: 6 } : { bottom: 6 }),
                    height: `${Math.max(12, Math.round(toothSize.h * 0.32))}px`
                  }}
                >
                  {/* Surface areas - reverse order for upper jaw to account for rotation */}
                  {isUpperJaw ? (
                    <>
                      {/* Upper jaw - reversed order due to 180° rotation */}
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerRight'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerRight') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'lowerRight');
                        }}
                        title="Lower Right Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerCenter'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerCenter') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'lowerCenter');
                        }}
                        title="Lower Center Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerLeft'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerLeft') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'lowerLeft');
                        }}
                        title="Lower Left Surface - Click to change condition"
                      />
                    </>
                  ) : (
                    <>
                      {/* Lower jaw - normal order */}
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerLeft'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerLeft') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'lowerLeft');
                        }}
                        title="Lower Left Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerCenter'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerCenter') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'lowerCenter');
                        }}
                        title="Lower Center Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerRight'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerRight') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurfaceClick(toothNumber, 'lowerRight');
                        }}
                        title="Lower Right Surface - Click to change condition"
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Condition indicator */}
          {toothData && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: getToothColor(toothNumber) }}
            />
          )}
        </div>

        {/* Treatment indicator */}
        {toothData?.treatment && (
          <div
            className="text-center mt-2 font-medium text-blue-600 leading-tight"
            style={{ maxWidth: `${toothSize.w}px`, fontSize: `${Math.max(10, Math.round(toothSize.h * 0.11))}px` }}
          >
            {TREATMENT_TYPES.find(t => t.id === toothData.treatment)?.name}
          </div>
        )}
      </div>
    );

  };

  // Derived spacing between teeth as a function of zoom only (not screen size)
  const groupGapPx = Math.max(4, Math.round(10 * zoom));
  // Extra top padding so FDI numbers above teeth aren’t clipped
  const labelPadPx = Math.max(12, Math.round(18 * zoom)); // increased padding

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Zoom Controls */}
      <div className="flex items-center justify-end mb-3 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Zoom</span>
          <button
            type="button"
            onClick={() => setZoom(z => clamp(0.7, parseFloat((z - 0.1).toFixed(2)), 2.0))}
            className="p-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            title="Zoom out"
          >
            <span className="material-icons-round text-base">remove</span>
          </button>
          <input
            type="range"
            min={0.7}
            max={2.0}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(clamp(0.7, parseFloat(e.target.value), 2.0))}
            className="w-40 accent-blue-600"
            aria-label="Zoom level"
          />
          <button
            type="button"
            onClick={() => setZoom(z => clamp(0.7, parseFloat((z + 0.1).toFixed(2)), 2.0))}
            className="p-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            title="Zoom in"
          >
            <span className="material-icons-round text-base">add</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
            title="Reset zoom"
          >
            100%
          </button>
        </div>
      </div>

      {/* Horizontal Condition Selector */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
          <span className="material-icons-round text-blue-600 mr-2 text-base">palette</span>
          Select Condition
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {DENTAL_CONDITIONS.map(condition => (
            <button
              key={condition.id}
              onClick={() => setActiveCondition(condition.id)}
              disabled={readonly}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-all border ${
                activeCondition === condition.id
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={`Apply ${condition.name}`}
            >
              <span
                className="inline-block w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: condition.color }}
              />
              <span className="font-medium">{condition.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Select a condition, then click on tooth surfaces to apply.
        </div>
      </div>

      {/* Dental Chart */}
      <div className="flex flex-col gap-4">
        {/* Upper Teeth */}
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <div className="flex justify-center mb-1 min-w-max" style={{ gap: `${groupGapPx}px`, paddingTop: `${labelPadPx}px` }}>
            <div className="flex" style={{ gap: `${groupGapPx}px` }}>
              {FDI_NUMBERS.upperRight.map(number => (
                <ToothComponent key={number} toothNumber={number} quadrant="upperRight" />
              ))}
            </div>
            <div className="border-l border-gray-300" style={{ marginLeft: groupGapPx, marginRight: groupGapPx }}></div>
            <div className="flex" style={{ gap: `${groupGapPx}px` }}>
              {FDI_NUMBERS.upperLeft.map(number => (
                <ToothComponent key={number} toothNumber={number} quadrant="upperLeft" />
              ))}
            </div>
          </div>
        </div>

        {/* Lower Teeth */}
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <div className="flex justify-center mb-1 min-w-max" style={{ gap: `${groupGapPx}px`, paddingTop: `${labelPadPx}px` }}>
            <div className="flex" style={{ gap: `${groupGapPx}px` }}>
              {FDI_NUMBERS.lowerRight.map(number => (
                <ToothComponent key={number} toothNumber={number} quadrant="lowerRight" />
              ))}
            </div>
            <div className="border-l border-gray-300" style={{ marginLeft: groupGapPx, marginRight: groupGapPx }}></div>
            <div className="flex" style={{ gap: `${groupGapPx}px` }}>
              {FDI_NUMBERS.lowerLeft.map(number => (
                <ToothComponent key={number} toothNumber={number} quadrant="lowerLeft" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Notes */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
          <span className="material-icons-round text-yellow-600 mr-2">note_alt</span>
          Doctor notes
        </h4>
        <textarea
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          disabled={readonly}
          rows={3}
          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
          placeholder="Enter overall dental notes, findings, and plan"
        />
        {readonly && (
          <p className="text-xs text-neutral-500 mt-2">Start appointment to edit notes.</p>
        )}
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
