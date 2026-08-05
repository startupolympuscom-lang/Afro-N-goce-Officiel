const fs = require('fs');
const file = 'src/stores/useVidangeStore.ts';
let code = fs.readFileSync(file, 'utf8');

const filterInterface = `
export interface VidangeFilter {
  id: string;
  type: 'air' | 'gasoil' | 'huile' | 'habitacle' | 'autre';
  name?: string;
  prix: number;
  source: 'magasin' | 'externe';
  magasinItemId?: string;
}
`;

code = code.replace(/export interface Vidange {/, filterInterface + '\nexport interface Vidange {\n  filters?: VidangeFilter[];');

fs.writeFileSync(file, code);
