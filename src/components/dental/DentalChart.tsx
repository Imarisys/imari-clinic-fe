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
  { id: 'implant', name: 'Implant', color: '#059669', icon: 'precision_manufacturing' },
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
  // Planning mode: when enabled, clicking a tooth opens the treatment planning dialog
  const [planningMode, setPlanningMode] = useState<boolean>(false);
  // Clear mode: when enabled, clicking a tooth restores it to the initial state
  const [clearMode, setClearMode] = useState<boolean>(false);
  // New: plan summary modal visibility
  const [showPlanSummary, setShowPlanSummary] = useState<boolean>(false);

  // Removed ResizeObserver-based effect; sizes are no longer tied to screen width
  // useEffect(() => { /* removed */ }, []);

  const clamp = (min: number, val: number, max: number) => Math.max(min, Math.min(max, val));

  // Helper to get color by condition id
  const getConditionColor = (id?: string) => {
    if (!id) return 'transparent';
    // Do not color for implants; image swap represents implant
    if (id === 'implant') return 'transparent';
    return DENTAL_CONDITIONS.find(c => c.id === id)?.color ?? 'transparent';
  };

  // Surface color based on assigned surface condition
  const getToothSurfaceColor = (toothNumber: number, surface: string): string => {
    const cond = toothSurfaces[toothNumber]?.[surface];
    if (cond === 'implant') return 'transparent'; // do not color implant surfaces
    return getConditionColor(cond);
  };

  // Overall tooth color indicator (transparent for implant via getConditionColor)
  const getToothColor = (toothNumber: number) => {
    const cond = teethData[toothNumber]?.condition;
    return getConditionColor(cond);
  };

  // Save changes for selected tooth (planning mode saves only planned treatment and notes)
  const updateToothData = () => {
    if (selectedTooth == null) return;
    setTeethData(prev => ({
      ...prev,
      [selectedTooth]: {
        ...(prev[selectedTooth] || { number: selectedTooth, condition: prev[selectedTooth]?.condition || '' }),
        number: selectedTooth,
        treatment: selectedTreatment || undefined,
        notes: notes || undefined,
        surfaces: prev[selectedTooth]?.surfaces
      }
    }));
    setSelectedTooth(null);
  };

  // Clear a tooth to its initial state (remove condition, surfaces, treatment, notes)
  const clearTooth = (toothNumber: number) => {
    setTeethData(prev => {
      const next = { ...prev };
      delete next[toothNumber];
      return next;
    });
    setToothSurfaces(prev => {
      const next = { ...prev };
      delete next[toothNumber];
      return next;
    });
  };

  // Apply implant to the tooth: clear other conditions/surfaces and set overall condition to implant
  const applyImplantToTooth = (toothNumber: number) => {
    // Clear any surfaces
    setToothSurfaces(prev => {
      const next = { ...prev };
      delete next[toothNumber];
      return next;
    });
    // Set overall condition to implant while preserving treatment/notes if present
    setTeethData(prev => ({
      ...prev,
      [toothNumber]: {
        ...(prev[toothNumber] || { number: toothNumber }),
        number: toothNumber,
        condition: 'implant',
        treatment: prev[toothNumber]?.treatment,
        notes: prev[toothNumber]?.notes,
        surfaces: undefined
      }
    }));
  };

  // Apply missing to the tooth: clear other conditions/surfaces and set overall condition to missing
  const applyMissingToTooth = (toothNumber: number) => {
    setToothSurfaces(prev => {
      const next = { ...prev };
      delete next[toothNumber];
      return next;
    });
    setTeethData(prev => ({
      ...prev,
      [toothNumber]: {
        ...(prev[toothNumber] || { number: toothNumber }),
        number: toothNumber,
        condition: 'missing',
        treatment: prev[toothNumber]?.treatment,
        notes: prev[toothNumber]?.notes,
        surfaces: undefined
      }
    }));
  };

  // Apply root canal to the tooth: clear other conditions/surfaces and set overall condition to root canal
  const applyRootCanalToTooth = (toothNumber: number) => {
    setToothSurfaces(prev => {
      const next = { ...prev };
      delete next[toothNumber];
      return next;
    });
    setTeethData(prev => ({
      ...prev,
      [toothNumber]: {
        ...(prev[toothNumber] || { number: toothNumber }),
        number: toothNumber,
        condition: 'root_canal',
        treatment: prev[toothNumber]?.treatment,
        notes: prev[toothNumber]?.notes,
        surfaces: undefined
      }
    }));
  };

  // Click on a tooth surface to apply/toggle the active condition (respect clear and implant modes)
  const handleOverlayClick = (e: React.MouseEvent, toothNumber: number, surface: string) => {
    e.stopPropagation();
    if (readonly) return;
    // In plan mode, clicking anywhere on the tooth should open the planning dialog
    if (planningMode) {
      const td = teethData[toothNumber];
      setSelectedTooth(toothNumber);
      setSelectedTreatment(td?.treatment || '');
      setNotes(td?.notes || '');
      return;
    }
    if (clearMode) {
      clearTooth(toothNumber);
      return;
    }
    if (activeCondition === 'implant') {
      applyImplantToTooth(toothNumber);
      return;
    }
    if (activeCondition === 'missing') {
      applyMissingToTooth(toothNumber);
      return;
    }
    if (activeCondition === 'root_canal') {
      // Apply root canal to all root surfaces
      const quadrant = getToothQuadrant(toothNumber);
      const isUpperJaw = quadrant === 'upperRight' || quadrant === 'upperLeft';

      setToothSurfaces(prev => {
        const nextForTooth = { ...(prev[toothNumber] || {}) };

        if (isUpperJaw) {
          // Upper jaw (rotated 180°): root area appears at bottom visually, but maps to upper surfaces in code
          nextForTooth['upperLeft'] = 'root_canal';
          nextForTooth['upperCenter'] = 'root_canal';
          nextForTooth['upperRight'] = 'root_canal';
        } else {
          // Lower jaw: root area is at the bottom visually, so use lower surfaces
          nextForTooth['lowerLeft'] = 'root_canal';
          nextForTooth['lowerCenter'] = 'root_canal';
          nextForTooth['lowerRight'] = 'root_canal';
        }

        return { ...prev, [toothNumber]: nextForTooth };
      });
      return;
    }
    if (activeCondition === 'crown') {
      // Apply crown to all crown surfaces - opposite side of root canal
      const quadrant = getToothQuadrant(toothNumber);
      const isUpperJaw = quadrant === 'upperRight' || quadrant === 'upperLeft';

      setToothSurfaces(prev => {
        const nextForTooth = { ...(prev[toothNumber] || {}) };

        if (isUpperJaw) {
          // Upper jaw (rotated 180°): crown area appears at top visually, but maps to lower surfaces in code
          nextForTooth['lowerLeft'] = 'crown';
          nextForTooth['lowerCenter'] = 'crown';
          nextForTooth['lowerRight'] = 'crown';
        } else {
          // Lower jaw: crown area is at the top visually, so use upper surfaces
          nextForTooth['upperLeft'] = 'crown';
          nextForTooth['upperCenter'] = 'crown';
          nextForTooth['upperRight'] = 'crown';
        }

        return { ...prev, [toothNumber]: nextForTooth };
      });
      return;
    }
    if (!activeCondition) return; // no condition selected -> ignore

    // default surface behavior - all conditions (including caries and filling) can be applied to any surface
    setToothSurfaces(prev => {
      const current = prev[toothNumber]?.[surface];
      const nextCond = current === activeCondition ? undefined : activeCondition;
      const nextForTooth = { ...(prev[toothNumber] || {}) } as Record<string, string>;
      if (nextCond) nextForTooth[surface] = nextCond; else delete nextForTooth[surface];
      return { ...prev, [toothNumber]: nextForTooth };
    });
  };

  // Helper function to determine tooth quadrant
  const getToothQuadrant = (toothNumber: number): string => {
    if (toothNumber >= 11 && toothNumber <= 18) return 'upperRight';
    if (toothNumber >= 21 && toothNumber <= 28) return 'upperLeft';
    if (toothNumber >= 31 && toothNumber <= 38) return 'lowerLeft';
    if (toothNumber >= 41 && toothNumber <= 48) return 'lowerRight';
    return 'unknown';
  };

  // Open/click on a tooth
  const handleToothClick = (toothNumber: number) => {
    if (readonly) return;
    // Clear mode takes precedence
    if (clearMode) {
      clearTooth(toothNumber);
      return;
    }
    // If implant or missing is the active condition and we're not in planning mode, apply to whole tooth
    if (!planningMode && activeCondition === 'implant') {
      applyImplantToTooth(toothNumber);
      return;
    }
    if (!planningMode && activeCondition === 'missing') {
      applyMissingToTooth(toothNumber);
      return;
    }
    if (!planningMode && activeCondition === 'root_canal') {
      // Apply root canal to all root surfaces
      const quadrant = getToothQuadrant(toothNumber);
      const isUpperJaw = quadrant === 'upperRight' || quadrant === 'upperLeft';

      setToothSurfaces(prev => {
        const nextForTooth = { ...(prev[toothNumber] || {}) };

        if (isUpperJaw) {
          // Upper jaw (rotated 180°): root area appears at bottom visually, but maps to upper surfaces in code
          nextForTooth['upperLeft'] = 'root_canal';
          nextForTooth['upperCenter'] = 'root_canal';
          nextForTooth['upperRight'] = 'root_canal';
        } else {
          // Lower jaw: root area is at the bottom visually, so use lower surfaces
          nextForTooth['lowerLeft'] = 'root_canal';
          nextForTooth['lowerCenter'] = 'root_canal';
          nextForTooth['lowerRight'] = 'root_canal';
        }

        return { ...prev, [toothNumber]: nextForTooth };
      });
      return;
    }
    if (!planningMode) return;
    const td = teethData[toothNumber];
    setSelectedTooth(toothNumber);
    setSelectedTreatment(td?.treatment || '');
    setNotes(td?.notes || '');
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

    // Determine condition dot color (skip for implants)
    const indicatorColor = getToothColor(toothNumber);
    const showIndicator = indicatorColor !== 'transparent';

    // Planned treatment frame color
    const plannedColor = toothData?.treatment ? TREATMENT_TYPES.find(t => t.id === toothData.treatment)?.color : undefined;

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
                border: `2px solid ${plannedColor ?? '#9CA3AF'}`
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
                   border: `2px solid ${plannedColor ?? '#ffffff'}`
                 }}
              />

              {/* Tooth Surface Overlays - Full edge-to-edge coverage */}
              <div className="absolute inset-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                {/* Upper Half - Extended from top to middle of tooth */}
                <div
                  className="flex w-full absolute"
                  style={{
                    top: 0,
                    height: `${Math.round(toothSize.h * 0.5)}px`,
                    left: 0,
                    right: 0
                  }}
                >
                  {isUpperJaw ? (
                    <>
                      {/* Upper jaw - reversed order due to 180° rotation */}
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperRight'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperRight') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'upperRight')}
                        title="Upper Right Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperCenter'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperCenter') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'upperCenter')}
                        title="Upper Center Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperLeft'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperLeft') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'upperLeft')}
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
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'upperLeft')}
                        title="Upper Left Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperCenter'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperCenter') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'upperCenter')}
                        title="Upper Center Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'upperRight'),
                          opacity: getToothSurfaceColor(toothNumber, 'upperRight') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'upperRight')}
                        title="Upper Right Surface - Click to change condition"
                      />
                    </>
                  )}
                </div>

                {/* Lower Half - From middle to bottom */}
                <div
                  className="flex w-full absolute"
                  style={{
                    bottom: 0,
                    height: `${Math.round(toothSize.h * 0.5)}px`,
                    left: 0,
                    right: 0
                  }}
                >
                  {isUpperJaw ? (
                    <>
                      {/* Upper jaw - reversed order due to 180° rotation */}
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerRight'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerRight') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'lowerRight')}
                        title="Lower Right Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerCenter'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerCenter') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'lowerCenter')}
                        title="Lower Center Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerLeft'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerLeft') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'lowerLeft')}
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
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'lowerLeft')}
                        title="Lower Left Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerCenter'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerCenter') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'lowerCenter')}
                        title="Lower Center Surface - Click to change condition"
                      />
                      <div
                        className="w-1/3 h-full cursor-pointer"
                        style={{
                          backgroundColor: getToothSurfaceColor(toothNumber, 'lowerRight'),
                          opacity: getToothSurfaceColor(toothNumber, 'lowerRight') !== 'transparent' ? 0.6 : 0
                        }}
                        onClick={(e) => handleOverlayClick(e, toothNumber, 'lowerRight')}
                        title="Lower Right Surface - Click to change condition"
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Condition indicator - exclude for missing teeth */}
          {toothData && showIndicator && !isMissing && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: indicatorColor }}
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
      {/* Controls: Zoom */}
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

      {/* Horizontal Condition Selector with inline controls */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center">
            <span className="material-icons-round text-blue-600 mr-2 text-base">palette</span>
            Select Condition
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DENTAL_CONDITIONS.map(condition => (
            <button
              key={condition.id}
              onClick={() => {
                setActiveCondition(condition.id);
                if (planningMode) setPlanningMode(false);
                if (clearMode) setClearMode(false);
              }}
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
                style={{ backgroundColor: condition.id === 'implant' ? 'transparent' : condition.color }}
              />
              <span className="font-medium">{condition.name}</span>
            </button>
          ))}

          {/* Clear all chip inline */}
          <button
            type="button"
            onClick={() => {
              const next = !clearMode;
              setClearMode(next);
              if (next) {
                setActiveCondition('');
                setPlanningMode(false);
              }
            }}
            disabled={readonly}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-all border ${
              clearMode
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Click, then select a tooth to clear it to initial state"
          >
            <span className="material-icons-round text-sm">restart_alt</span>
            <span className="font-medium">Clear all</span>
          </button>

          {/* View plan button */}
          <button
            type="button"
            onClick={() => setShowPlanSummary(true)}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-all border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            title="View all planned treatments and notes"
          >
            <span className="material-icons-round text-sm">visibility</span>
            <span className="font-medium">View plan</span>
          </button>

          {/* Plan mode toggle (separate from View plan) */}
          <button
            type="button"
            onClick={() => {
              const next = !planningMode;
              setPlanningMode(next);
              if (next) {
                setActiveCondition('');
                setClearMode(false);
              }
            }}
            disabled={readonly}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-all border ${
              planningMode
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Enable to click a tooth and plan a treatment"
          >
            <span className="material-icons-round text-sm">event_note</span>
            <span className="font-medium">Plan mode</span>
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-600">
          Select a condition and click tooth surfaces to apply. Or toggle Plan mode, then click a tooth to plan. Use View plan to see all planned items, and Clear all to reset a tooth.
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

      {/* Tooth Selection Modal - planning mode only */}
      {selectedTooth && !readonly && planningMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Plan treatment for tooth {selectedTooth}</h3>

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

      {/* Plan Summary Modal */}
      {showPlanSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Planned treatments</h3>
              <button
                type="button"
                onClick={() => setShowPlanSummary(false)}
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Close plan summary"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            {/* Summary list */}
            <div className="max-h-[60vh] overflow-y-auto">
              {Object.keys(teethData)
                .map(k => parseInt(k, 10))
                .filter(tn => teethData[tn]?.treatment || teethData[tn]?.notes)
                .sort((a, b) => a - b)
                .map(toothNumber => {
                  const td = teethData[toothNumber];
                  const treatmentName = td?.treatment ? (TREATMENT_TYPES.find(t => t.id === td.treatment)?.name || td.treatment) : 'No treatment';
                  return (
                    <div key={toothNumber} className="border border-gray-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-800">Tooth {toothNumber}</div>
                        <div className="text-sm text-blue-700 font-medium">{treatmentName}</div>
                      </div>
                      {td?.notes && (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{td.notes}</div>
                      )}
                    </div>
                  );
                })}

              {Object.keys(teethData).filter(k => {
                const tn = parseInt(k, 10);
                return teethData[tn]?.treatment || teethData[tn]?.notes;
              }).length === 0 && (
                <div className="text-sm text-gray-600">No planned treatments yet.</div>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPlanSummary(false)}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
