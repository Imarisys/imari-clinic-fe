export interface PatientFile {
  id: string;
  patient_id: string;
  filename: string;
  file_type: FileType;
  file_size: number;
  mime_type: string;
  description?: string | null;
  minio_object_name: string;
  upload_date: string;
}

export interface PatientFileRead extends PatientFile {
  upload_date: string;
}

export interface PatientFileListResponse {
  files: PatientFileRead[];
  total: number;
  offset: number;
  limit: number;
}

export enum FileType {
  IMAGE = "image",
  DOCUMENT = "document",
  VIDEO = "video",
  AUDIO = "audio",
  OTHER = "other"
}

export interface FileUploadData {
  file: File;
  description?: string;
}
