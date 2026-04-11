export type NivelAlerta = "critica" | "advertencia" | "informativa";

export interface Alerta {
  id: number;
  vencimiento_id: number;
  cliente_id: number;
  nivel: NivelAlerta;
  dias_restantes: number;
  documentos_faltantes: string[];
  mensaje: string;
  vista: boolean;
  created_at: string;
}

export interface ResumenAlertas {
  criticas: number;
  advertencias: number;
  informativas: number;
}
