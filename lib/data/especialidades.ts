export interface Especialidad {
  id: string;
  nombre: string;
  descripcion: string;
  profesional: string;
  dias: string[];
  duracion: number;
  icono: string;
}

export const ESPECIALIDADES: Especialidad[] = [
  {
    id: "clinica-general",
    nombre: "Clínica General",
    descripcion: "Consultas generales, vacunas y revisaciones de rutina.",
    profesional: "Dr. Sebastián Morales",
    dias: ["lunes", "miércoles", "viernes"],
    duracion: 30,
    icono: "stethoscope",
  },
  {
    id: "dermatologia",
    nombre: "Dermatología",
    descripcion: "Enfermedades de piel, alergias cutáneas y micosis.",
    profesional: "Dra. Lucía Fernández",
    dias: ["martes", "jueves"],
    duracion: 45,
    icono: "skin",
  },
  {
    id: "cardiologia",
    nombre: "Cardiología",
    descripcion: "Electrocardiograma, ecocardiograma y seguimiento cardíaco.",
    profesional: "Dr. Andrés Quintero",
    dias: ["miércoles"],
    duracion: 60,
    icono: "heart",
  },
  {
    id: "odontologia",
    nombre: "Odontología",
    descripcion: "Limpieza dental, extracciones y tratamiento de encías.",
    profesional: "Dra. Camila Rojas",
    dias: ["viernes"],
    duracion: 60,
    icono: "tooth",
  },
  {
    id: "traumatologia",
    nombre: "Traumatología",
    descripcion: "Fracturas, displasia y lesiones musculoesqueléticas.",
    profesional: "Dr. Ignacio Peralta",
    dias: ["martes", "jueves"],
    duracion: 60,
    icono: "bone",
  },
  {
    id: "oftalmologia",
    nombre: "Oftalmología",
    descripcion: "Cataratas, glaucoma y enfermedades oculares.",
    profesional: "Dra. Valeria Sosa",
    dias: ["lunes"],
    duracion: 45,
    icono: "eye",
  },
];

export const DIAS_SEMANA = {
  lunes: "Lunes",
  martes: "Martes",
  miércoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sábado: "Sábado",
  domingo: "Domingo",
};
