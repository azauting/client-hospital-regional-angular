import { Inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UpdateUserPayload {
    contrasena?: string;
    rol_id?: number;
    unidad_id?: number | null;
    activo?: number;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(
        private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) { }

    // Obtener todos los usuarios
    getRequestingUser() {
        console.log('Llamando a getRequestingUser');
        return this.http.get(`${this.apiUrl}/api/users/solicitantes`, {
            withCredentials: true
        });
    }

    // obtener los usuarios soportes
    getSupportUsers() {
        console.log('Llamando a getSupportUsers');
        return this.http.get(`${this.apiUrl}/api/users/soportes`, {
            withCredentials: true
        });
    }

    // Obtener un usuario
    getUserById(id: number) {
        console.log(`Llamando a getUserById con id: ${id}`);
        return this.http.get(`${this.apiUrl}/api/users/${id}`, {
            withCredentials: true
        });

    }

    // Actualizar un usuario
    updateUser(id: number, payload: UpdateUserPayload) {
        console.log(`Llamando a updateUser con id: ${id} y payload:`, payload);
        return this.http.patch(
            `${this.apiUrl}/api/users/${id}`,
            payload,
            { withCredentials: true }
        );
    }   

    // Obtener soportes disponibles
    getAvailableSupports() {
        return this.http.get(
            `${this.apiUrl}/api/user/soportes/disponibles`,
            { withCredentials: true }
        );
    }
}
