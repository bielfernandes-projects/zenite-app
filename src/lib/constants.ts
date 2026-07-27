export const GRADES = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"] as const;

export const SHIFTS = ["Manhã", "Tarde"] as const;

export const STATUSES = ["Ativo", "Transferido", "Desistente"] as const;

export const ENROLLMENT_STATUSES = ["Ativo", "Transferido", "Desistente"] as const;

export const RACES = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não Declarada"] as const;

export const PRODUCT_CATEGORIES = ["Fardamento", "Material Didático", "Taxa"] as const;

export const SCHOOL_NAME = "I. I. Tia Neuma";
export const APP_NAME = "Zenite";
export const APP_FULL_NAME = `${APP_NAME} — ${SCHOOL_NAME}`;

export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_RANGE = Array.from({ length: 4 }, (_, i) => (CURRENT_YEAR - 3 + i).toString());
