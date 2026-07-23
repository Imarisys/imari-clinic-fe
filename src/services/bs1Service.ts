import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const TEMPLATE_PATH = '/BS1_CNAM_template.pdf';
const BOXES_PATH = '/bs1_template.json';
const LABELER_SCALE = 1.5;

interface BoxDef {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BS1Data {
  patientFirstName: string;
  patientLastName: string;
  patientCnamId: string;
  patientDob: string;
  patientStreet: string;
  patientCity: string;
  patientZipCode: string;
  patientInsuranceNumber: string;
  doctorFirstName: string;
  doctorLastName: string;
  doctorProviderNumber: string;
  doctorSpecialization: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentType: string;
  diagnosis: string;
  cost: number;
  insurancePct: number;
}

async function getTemplateBoxes(): Promise<BoxDef[]> {
  const resp = await fetch(BOXES_PATH);
  if (!resp.ok) throw new Error('BS1 template JSON not found');
  return resp.json();
}

async function getPdfBackground(): Promise<ArrayBuffer> {
  const resp = await fetch(TEMPLATE_PATH);
  if (!resp.ok) throw new Error('BS1 template PDF not found');
  return resp.arrayBuffer();
}

function toPdfCoord(labelerVal: number): number {
  return labelerVal / LABELER_SCALE;
}

export async function generateBS1PDF(data: BS1Data): Promise<Blob> {
  const [boxes, bgBuf] = await Promise.all([getTemplateBoxes(), getPdfBackground()]);
  const bgDoc = await PDFDocument.load(bgBuf);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const [bgPage] = await doc.copyPages(bgDoc, [0]);
  doc.addPage(bgPage);
  const page = doc.getPage(0);
  const { height: ph } = page.getSize();

  const cnamDigits = (data.patientCnamId || '').replace(/\D/g, '');

  const fieldValues: Record<string, string> = {
    patient_cnam_id: data.patientCnamId || '',
    reference_dossier: data.appointmentId.slice(0, 8),
    patient_first_name: data.patientFirstName,
    patient_last_name: data.patientLastName,
    address_line1: data.patientStreet || '',
    address_line2: '',
    address_line3: data.patientCity || '',
    code_postal: data.patientZipCode || '',
    check_cnss: (data.patientInsuranceNumber || '').toUpperCase().startsWith('CNSS') ? 'X' : '',
    check_cnrps: (data.patientInsuranceNumber || '').toUpperCase().startsWith('CNRPS') ? 'X' : '',
    check_convention: '',
  };

  for (let i = 0; i < 10; i++) {
    fieldValues[`cnam_digit_${i + 1}`] = cnamDigits[i] || '';
  }

  for (const box of boxes) {
    const value = fieldValues[box.name];
    if (value === undefined) continue;
    if (!value) continue;

    const x = toPdfCoord(box.x);
    const boxBottom = ph - toPdfCoord(box.y) - toPdfCoord(box.height);
    const y = boxBottom + 2;
    const fontSize = Math.min(toPdfCoord(box.height) * 0.8, 9);
    const text = typeof value === 'string' ? value : String(value);

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.05, 0.15, 0.4),
    });
  }

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
}
