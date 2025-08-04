import { PatientFile, PatientFileRead, PatientFileListResponse, FileUploadData } from '../types/PatientFile';
import { API_CONFIG, buildApiUrl } from '../config/api';

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
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
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

    const response = await fetch(buildApiUrl(`/api/v1/patients/${patientId}/files`), {
      method: 'POST',
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
   * Get preview URL for a file (opens in browser)
   */
  static getPreviewUrl(patientId: string, fileId: string): string {
    return buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/preview`);
  }

  /**
   * Get download URL for a file
   */
  static getDownloadUrl(patientId: string, fileId: string): string {
    return buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/download`);
  }

  /**
   * Get a presigned URL for direct file download
   */
  static async getFileDownloadUrl(patientId: string, fileId: string): Promise<string> {
    const response = await fetch(buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/url`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get download URL');
    }

    const data = await response.json();
    return data.url;
  }

  /**
   * Delete a patient file
   */
  static async deletePatientFile(patientId: string, fileId: string): Promise<void> {
    const response = await fetch(buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Update file description
   */
  static async updateFileDescription(
    patientId: string,
    fileId: string,
    description: string
  ): Promise<PatientFile> {
    const formData = new FormData();
    formData.append('description', description);

    const response = await fetch(
      buildApiUrl(`/api/v1/patients/${patientId}/files/${fileId}/description`),
      {
        method: 'PUT',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update file description');
    }

    return response.json();
  }

  /**
   * Preview a file by opening it in a new tab
   */
  static previewFile(patientId: string, fileId: string): void {
    const previewUrl = this.getPreviewUrl(patientId, fileId);
    window.open(previewUrl, '_blank');
  }

  /**
   * Download a file
   */
  static async downloadFile(patientId: string, fileId: string, filename?: string): Promise<void> {
    try {
      const downloadUrl = this.getDownloadUrl(patientId, fileId);

      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }

  /**
   * Get file type icon based on file type and mime type
   */
  static getFileIcon(file: PatientFileRead): string {
    switch (file.file_type) {
      case 'image':
        return 'image';
      case 'document':
        if (file.mime_type.includes('pdf')) return 'picture_as_pdf';
        if (file.mime_type.includes('word')) return 'description';
        if (file.mime_type.includes('excel') || file.mime_type.includes('spreadsheet')) return 'table_chart';
        if (file.mime_type.includes('powerpoint') || file.mime_type.includes('presentation')) return 'slideshow';
        return 'description';
      case 'video':
        return 'play_circle';
      case 'audio':
        return 'audiotrack';
      default:
        return 'insert_drive_file';
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file is an image and can have thumbnail
   */
  static isImageFile(file: PatientFileRead): boolean {
    return file.file_type === 'image' && file.mime_type.startsWith('image/');
  }
}
