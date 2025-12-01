import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ===== TIPOS =====

// KPI simples
export interface KpiNumberResponse {
    success: boolean;
    message: string;
    data: number;
}

// Resueltos por mes
export interface ResueltosMesItem {
    mes: string;
    resueltos: number;
}

export interface ResueltosMesResponse {
    success: boolean;
    message: string;
    data: ResueltosMesItem[];
}

// MTTR mensual
export interface MttrItem {
    mes: string;
    mttr_horas: string;
}

export interface MttrMensualResponse {
    success: boolean;
    message: string;
    data: MttrItem[];
}

// Treemap ubicaciones
export interface TreemapUbicacionItem {
    ubicacion: string;
    tickets: number;
}

export interface TreemapCategoria {
    name: string;
    data: TreemapUbicacionItem[];
}

export interface TreemapResponse {
    success: boolean;
    message: string;
    data: TreemapCategoria[];
}


@Injectable({
    providedIn: 'root'
})
export class DashboardService {


    constructor(
        private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) { }

    // ===== KPI NUMÉRICOS =====

    getTicketsCreadosHoy() {
        return this.http.get<KpiNumberResponse>(
            `${this.apiUrl}/api/analytics/tickets-creados-hoy`,
            { withCredentials: true }
        );
    }

    getTicketsCerradosHoy() {
        return this.http.get<KpiNumberResponse>(
            `${this.apiUrl}/api/analytics/tickets-cerrados-hoy`,
            { withCredentials: true }
        );
    }

    getTicketsAbiertos() {
        return this.http.get<KpiNumberResponse>(
            `${this.apiUrl}/api/analytics/tickets-abiertos`,
            { withCredentials: true }
        );
    }

    getTicketsEnProceso() {
        return this.http.get<KpiNumberResponse>(
            `${this.apiUrl}/api/analytics/tickets-en-proceso`,
            { withCredentials: true }
        );
    }


    // ===== CHARTS =====

    getResueltosMes() {
        return this.http.get<ResueltosMesResponse>(
            `${this.apiUrl}/api/analytics/resueltos-mes`,
            { withCredentials: true }
        );
    }

    getMTTRMensual() {
        return this.http.get<MttrMensualResponse>(
            `${this.apiUrl}/api/analytics/mttr-mensual`,
            { withCredentials: true }
        );
    }

    getUbicacionesTreemap() {
        return this.http.get<TreemapResponse>(
            `${this.apiUrl}/api/analytics/ubicaciones/treemap`,
            { withCredentials: true }
        );
    }

}
