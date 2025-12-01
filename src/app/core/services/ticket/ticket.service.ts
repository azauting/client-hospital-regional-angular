import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface TicketCreatePayload {
    asunto: string;
    descripcion: string;
    telefono: string;
    autor_problema: string;
    evento?: string;
    ubicacion_id: number;
    ip_manual: string;
}

export interface Ubicacion {
    ubicacion_id: number;
    ubicacion: string;
    area_id?: number | null;
    nombre_area?: string | null;
}

export interface TicketResumen {
    ticket_id: number;
    asunto: string;
    estado: string;
    fecha_creacion: string;
}

export interface Ticket {
    ticket_id: number;
    asunto: string;
    descripcion: string;
    telefono: string;
    autor_problema: string;
    ubicacion: Ubicacion;
    prioridad: string;
    unidad: string;
    estado: string;
    evento?: string;
    fecha_creacion: string;
}


@Injectable({
    providedIn: 'root',
})
export class TicketService {
    constructor(
        private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) { }

    crearTicket(payload: TicketCreatePayload) {
        return this.http.post(
            `${this.apiUrl}/api/tickets`,
            payload,
            {
                withCredentials: true,
            }
        );
    }

    getUbicaciones() {
        return this.http.get(
            `${this.apiUrl}/api/tipos/ubicacion`,
            {
                withCredentials: true,
            }
        );
    }
    getMisTickets() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/mis-tickets`,
            {
                withCredentials: true,
            }
        );
    }
    getTicketById(id: number) {
        return this.http.get(
            `${this.apiUrl}/api/tickets/${id}`,
            {
                withCredentials: true,
            }
        );
    }
    getTicketsSinRevisar() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/sin-revisar`,
            {
                withCredentials: true,
            }
        );
    }
    getInternalTickets() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/internal`,
            {
                withCredentials: true,
            }
        );
    }
    getTicketsAsignadosPorSoporte() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/mis-tickets/asignados`,
            {
                withCredentials: true,
            }
        );
    }

    updateTicket(
        id: number,
        data: { unidad_id?: number; prioridad_id?: number; }
    ) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${id}`,
            data,
            { withCredentials: true }
        );
    }

    getSoportes() {
        return this.http.get(
            `${this.apiUrl}/api/user/soportes-disponibles`,
            { withCredentials: true }
        );
    }

    assignSoporte(ticketId: number, soporteId: number) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/assign`,
            { soporte_id: soporteId },
            { withCredentials: true }
        );
    }

    // ✅ Marca el ticket como revisado (estado_de_revision = 1)
    markReviewed(ticketId: number) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/review`,
            {},
            { withCredentials: true }
        );
    }
    getTicketsRevisados() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/revisados`,
            { withCredentials: true }
        );
    }

    assignTicketToSelf(ticketId: number, soporteId: number) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/assign`,
            { soporte_id: soporteId },
            { withCredentials: true }
        );
    }

    cerrarTicket(ticketId: number, respuestaFinal: string) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/close`,
            {
                respuesta_final: respuestaFinal  
            },
            { withCredentials: true }
        );
    }

    addTicketObservation(ticketId: number, observacion: string) {
        return this.http.post(
            `${this.apiUrl}/api/tickets/${ticketId}/detalle/observacion`,
            { observacion },
            { withCredentials: true }
        );
    }

    agregarIntegrante(ticketId: number, usuarioId: number) {
        return this.http.post(
            `${this.apiUrl}/api/tickets/${ticketId}/detalle/integrante`,
            { usuario_id: usuarioId },
            { withCredentials: true }
        );
    }




}
