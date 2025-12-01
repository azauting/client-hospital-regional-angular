import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class TicketLogService {

    constructor(
        private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) { }

    getLatestGlobalMovement() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/movimientos/recientes`,
            { withCredentials: true }
        );
    }
}