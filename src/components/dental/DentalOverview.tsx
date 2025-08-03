import React, { useState } from 'react';

interface ToothProps {
  number: number;
  type: 'incisor' | 'canine' | 'premolar' | 'molar';
  quadrant: 'upper-right' | 'upper-left' | 'lower-right' | 'lower-left';
  condition?: 'healthy' | 'cavity' | 'filled' | 'crown' | 'missing' | 'root-canal';
  onClick?: (toothNumber: number) => void;
}

const Tooth: React.FC<ToothProps> = ({ number, type, quadrant, condition = 'healthy', onClick }) => {
  const getToothShape = () => {
    switch (type) {
      case 'incisor':
        return 'M12 4 L16 8 L16 20 L8 20 L8 8 Z';
      case 'canine':
        return 'M12 2 L18 8 L18 20 L6 20 L6 8 Z';
      case 'premolar':
        return 'M6 6 L18 6 L18 20 L6 20 Z M10 6 L10 10 M14 6 L14 10';
      case 'molar':
        return 'M4 6 L20 6 L20 20 L4 20 Z M8 6 L8 10 M12 6 L12 10 M16 6 L16 10';
      default:
        return 'M6 6 L18 6 L18 20 L6 20 Z';
    }
  };

  const getToothColor = () => {
    switch (condition) {
      case 'healthy':
        return '#F8F9FA';
      case 'cavity':
        return '#DC3545';
      case 'filled':
        return '#6C757D';
      case 'crown':
        return '#FFD700';
      case 'missing':
        return 'transparent';
      case 'root-canal':
        return '#FFC107';
      default:
        return '#F8F9FA';
    }
  };

  const getStrokeColor = () => {
    return condition === 'missing' ? '#DEE2E6' : '#495057';
  };

  return (
    <div className="relative">
      <svg
        width="32"
        height="40"
        viewBox="0 0 24 24"
        className={`cursor-pointer transition-all duration-200 hover:scale-110 ${
          condition === 'missing' ? 'opacity-30' : ''
        }`}
        onClick={() => onClick?.(number)}
      >
        <path
          d={getToothShape()}
          fill={getToothColor()}
          stroke={getStrokeColor()}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {condition === 'cavity' && (
          <circle cx="12" cy="12" r="3" fill="#8B0000" />
        )}
        {condition === 'filled' && (
          <rect x="10" y="10" width="4" height="4" fill="#4A5568" rx="1" />
        )}
        {condition === 'root-canal' && (
          <line x1="12" y1="8" x2="12" y2="16" stroke="#B91C1C" strokeWidth="2" />
        )}
      </svg>
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
        {number}
      </div>
    </div>
  );
};

const DentalOverview: React.FC = () => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Adult dental numbering system (32 teeth)
  const upperRight = [1, 2, 3, 4, 5, 6, 7, 8];
  const upperLeft = [9, 10, 11, 12, 13, 14, 15, 16];
  const lowerLeft = [17, 18, 19, 20, 21, 22, 23, 24];
  const lowerRight = [25, 26, 27, 28, 29, 30, 31, 32];

  const getToothType = (number: number): ToothProps['type'] => {
    const position = ((number - 1) % 8) + 1;
    if (position <= 2) return 'incisor';
    if (position === 3) return 'canine';
    if (position <= 5) return 'premolar';
    return 'molar';
  };

  // Sample conditions for demonstration
  const toothConditions: Record<number, ToothProps['condition']> = {
    3: 'cavity',
    7: 'filled',
    14: 'crown',
    18: 'root-canal',
    25: 'missing',
    30: 'filled',
  };

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
  };

  const conditionColors = {
    healthy: 'bg-green-100 text-green-800',
    cavity: 'bg-red-100 text-red-800',
    filled: 'bg-gray-100 text-gray-800',
    crown: 'bg-yellow-100 text-yellow-800',
    missing: 'bg-red-100 text-red-800',
    'root-canal': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🦷 Dental Overview
      </h2>

      {/* Dental Chart */}
      <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-8 mb-6">
        {/* Upper Jaw */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Upper Jaw</h3>
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-6 shadow-inner">
              {/* Upper Right */}
              <div className="flex justify-center mb-4">
                <div className="flex space-x-2">
                  {upperRight.reverse().map((number) => (
                    <Tooth
                      key={number}
                      number={number}
                      type={getToothType(number)}
                      quadrant="upper-right"
                      condition={toothConditions[number]}
                      onClick={handleToothClick}
                    />
                  ))}
                </div>
                <div className="mx-4 w-px bg-gray-300"></div>
                <div className="flex space-x-2">
                  {upperLeft.map((number) => (
                    <Tooth
                      key={number}
                      number={number}
                      type={getToothType(number)}
                      quadrant="upper-left"
                      condition={toothConditions[number]}
                      onClick={handleToothClick}
                    />
                  ))}
                </div>
              </div>

              {/* Gum line */}
              <div className="border-t-2 border-pink-200 my-6"></div>

              {/* Lower Jaw */}
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  {lowerRight.reverse().map((number) => (
                    <Tooth
                      key={number}
                      number={number}
                      type={getToothType(number)}
                      quadrant="lower-right"
                      condition={toothConditions[number]}
                      onClick={handleToothClick}
                    />
                  ))}
                </div>
                <div className="mx-4 w-px bg-gray-300"></div>
                <div className="flex space-x-2">
                  {lowerLeft.map((number) => (
                    <Tooth
                      key={number}
                      number={number}
                      type={getToothType(number)}
                      quadrant="lower-left"
                      condition={toothConditions[number]}
                      onClick={handleToothClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mt-4 text-center">Lower Jaw</h3>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-400 rounded"></div>
          <span className="text-sm">Healthy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Cavity</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-sm">Filled</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span className="text-sm">Crown</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-400 rounded bg-transparent"></div>
          <span className="text-sm">Missing</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-400 rounded"></div>
          <span className="text-sm">Root Canal</span>
        </div>
      </div>

      {/* Selected Tooth Info */}
      {selectedTooth && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Tooth #{selectedTooth}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Type:</span> {getToothType(selectedTooth)}
            </div>
            <div>
              <span className="font-medium">Condition:</span>{' '}
              <span className={`px-2 py-1 rounded-full text-xs ${
                conditionColors[toothConditions[selectedTooth] || 'healthy']
              }`}>
                {toothConditions[selectedTooth] || 'healthy'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {32 - Object.keys(toothConditions).length}
          </div>
          <div className="text-sm text-green-700">Healthy</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {Object.values(toothConditions).filter(c => c === 'cavity').length}
          </div>
          <div className="text-sm text-red-700">Cavities</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {Object.values(toothConditions).filter(c => c === 'filled').length}
          </div>
          <div className="text-sm text-gray-700">Filled</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {Object.values(toothConditions).filter(c => c === 'crown').length}
          </div>
          <div className="text-sm text-yellow-700">Crowns</div>
        </div>
      </div>
    </div>
  );
};

export default DentalOverview;
