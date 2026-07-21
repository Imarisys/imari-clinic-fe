import { PatientFile, PatientFileRead, PatientFileListResponse, FileUploadData } from '../types/PatientFile';
import { API_CONFIG, buildApiUrl } from '../config/api';
import { authService } from './authService';

const H = () => authService.getAuthHeaders();

export class PatientFileService {
  /**
   * Get all files for a specific patient
   */
  static async getPatientFiles(
    patientId: string,
    offset: number = 0,
    limit: number = 100
  ): Promise<PatientFileListResponse> {
    const response = await fetch(
      buildApiUrl(`/api/v1/patients/${patientId}/files?offset=${offset}&limit=${limit}`),
      { method: 'GET', headers: H() }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch patient files');
    }
    return response.json();
  }

  /**
   * Upload a new file for a patient
   */
  static async uploadPatientFile(
    patientId: string,
    fileData: FileUploadData
  ): Promise<PatientFile> {
    const formData = new FormData();
    formData.append('file', fileData.file);
    if (fileData.description) {
      formData.append('description', fileData.description);
    }
    const hdrs = { ...H() };
    delete (hdrs as any)['Content-Type']; // browser sets multipart boundary

    const response = await fetch(buildApiUrl(`/api/v1/patients/${patientId}/files`), {
      method: 'POST',
      headers: hdrs,
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
    return response.json();
  }

  /**
   * Get thumbnail URL for an image file
   */
  static getThumbnailUrl(patientId: string, fileId: string): string {
    return buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/thumbnail`);
  }

  /**
   * Get thumbnail blob for an image file
   */
  static async getThumbnailBlob(patientId: string, fileId: string): Promise<string | null> {
    try {
      const response = await fetch(
        buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/thumbnail`),
        { method: 'GET', headers: H() }
      );
      if (!response.ok) return null;
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }

  /**
   * Get preview URL for a file (opens in browser)
   */
  static getPreviewUrl(patientId: string, fileId: string): string {
    return buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/preview`);
  }

  /**
   * Get a presigned URL for direct file download
   */
  static async getFileDownloadUrl(patientId: string, fileId: string): Promise<string> {
    const response = await fetch(
      buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/url`),
      { method: 'GET', headers: H() }
    );
    const data = await response.json();
    return data.url;
  }

  /**
   * Delete a patient file
   */
  static async deletePatientFile(patientId: string, fileId: string): Promise<void> {
    const response = await fetch(
      buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}`),
      { method: 'DELETE', headers: H() }
    );
    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Delete all files for a patient
   */
  static async deleteAllPatientFiles(patientId: string): Promise<void> {
    const response = await fetch(
      buildApiUrl(`/api/v1/patients/${patientId}/files`),
      { method: 'DELETE', headers: H() }
    );
    if (!response.ok) {
      throw new Error('Failed to delete all files');
    }
  }

  /**
   * Update file description
   */
  static async updateFileDescription(
    patientId: string,
    fileId: string,
    description: string
  ): Promise<PatientFileRead> {
    const response = await fetch(
      buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/description`),
      {
        method: 'PUT',
        headers: H(),
        body: JSON.stringify({ description }),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to update file description');
    }
    return response.json();
  }

  /**
   * Get Material Icon name for a file type
   */
  static getFileIcon(file: PatientFileRead): string {
    switch (file.file_type) {
      case 'image': return 'image';
      case 'document':
        if (file.mime_type?.includes('pdf')) return 'picture_as_pdf';
        if (file.mime_type?.includes('word') || file.mime_type?.includes('msword') || file.mime_type?.includes('wordprocessingml')) return 'description';
        if (file.mime_type?.includes('excel') || file.mime_type?.includes('spreadsheet')) return 'table_chart';
        return 'description';
      case 'video': return 'play_circle_outline';
      case 'audio': return 'audiotrack';
      default:
        if (file.mime_type?.startsWith('image/')) return 'image';
        if (file.mime_type?.includes('pdf')) return 'picture_as_pdf';
        if (file.mime_type?.startsWith('video/')) return 'play_circle_outline';
        if (file.mime_type?.startsWith('audio/')) return 'audiotrack';
        if (file.mime_type?.includes('text')) return 'text_snippet';
        return 'insert_drive_file';
    }
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file is an image
   */
  static isImageFile(file: PatientFileRead): boolean {
    return file.mime_type?.startsWith('image/') || false;
  }

  /**
   * Download a file
   */
  static async downloadFile(patientId: string, fileId: string, filename: string): Promise<void> {
    const response = await fetch(
      buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/download`),
      { method: 'GET', headers: H() }
    );
    if (!response.ok) throw new Error('Failed to download file');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
