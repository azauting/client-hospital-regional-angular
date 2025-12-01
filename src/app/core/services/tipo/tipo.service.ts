import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TipoService {

    constructor(
        private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) { }

    // ============================
    // UBICACIONES
    // ============================
    getUbicaciones(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/ubicacion`, {
            withCredentials: true
        });
    }

    createUbicacion(data: { ubicacion: string, area_id: number }): Observable<any> {
        return this.http.post(`${this.apiUrl}/api/tipos/ubicacion`, data, {
            withCredentials: true
        });
    }

    updateUbicacion(id: number, data: { ubicacion: string, area_id: number }): Observable<any> {
        return this.http.patch(`${this.apiUrl}/api/tipos/ubicacion/${id}`, data, {
            withCredentials: true
        });
    }

    // ============================
    // AREAS
    // ============================
    getAreas(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/area`, {
            withCredentials: true
        });
    }

    createArea(data: { nombre_area: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/api/tipos/area`, data, {
            withCredentials: true
        });
    }

    updateArea(id: number, data: { nombre_area: string }): Observable<any> {
        return this.http.patch(`${this.apiUrl}/api/tipos/area/${id}`, data, {
            withCredentials: true
        });
    }
}