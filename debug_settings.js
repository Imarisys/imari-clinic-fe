// Quick debug script to test settings loading
const API_BASE_URL = 'http://localhost:8000';

async function testSettings() {
  try {
    // First, let's see what the auth service returns for doctor ID
    const doctorId = localStorage.getItem('doctorId') || 'test-doctor-id';
    console.log('Doctor ID:', doctorId);

    // Test the settings API call
    const url = `${API_BASE_URL}/api/v1/settings/${doctorId}`;
    console.log('Making request to:', url);

    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Settings data:', data);
      console.log('appointments_start_time:', data.appointments_start_time);
      console.log('appointments_end_time:', data.appointments_end_time);
      console.log('Type of start time:', typeof data.appointments_start_time);
      console.log('Type of end time:', typeof data.appointments_end_time);
    } else {
      console.error('Failed to fetch settings:', response.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testSettings();
