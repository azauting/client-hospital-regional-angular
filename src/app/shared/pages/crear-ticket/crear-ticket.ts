import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr'; // <--- Importar Toastr

import {
    TicketService,
    Ubicacion
} from '../../../core/services/ticket/ticket.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
    selector: 'app-crear-ticket',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './crear-ticket.html',
})
export class CrearTicketComponent implements OnInit {
    
    // Inyecciones
    private ticketService = inject(TicketService);
    private router = inject(Router);
    private authService = inject(AuthService);
    private toastr = inject(ToastrService); // <--- Inyección

    // Datos del usuario
    rol = '';
    
    // Campos del formulario
    asunto = '';
    descripcion = '';
    telefono = '';
    autor_problema = '';
    evento_id: number | null = null;
    ubicacion_id: number | null = null;

    // Signals
    ubicaciones = signal<Ubicacion[]>([]);
    loading = signal<boolean>(false);
    loadingUbicaciones = signal<boolean>(false);

    ngOnInit() {
        const user = this.authService.getUser();
        this.rol = user?.nombre_rol?.toLowerCase() ?? '';
        this.autor_problema = user?.nombre_completo ?? ''; // Prellenar nombre
        this.cargarUbicaciones();
    }

    cargarUbicaciones() {
        if (this.loadingUbicaciones() || this.ubicaciones().length > 0) return;

        this.loadingUbicaciones.set(true);

        this.ticketService.getUbicaciones()
            .pipe(finalize(() => this.loadingUbicaciones.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const data = resp.data?.ubicaciones ?? [];
                        this.ubicaciones.set(data);
                        if (data.length === 0) {
                            this.toastr.warning('No hay ubicaciones configuradas en el sistema.', 'Aviso');
                        }
                    } else {
                        this.toastr.error('No se pudieron cargar las ubicaciones', 'Error');
                    }
                },
                error: () => {
                    this.toastr.error('Error de conexión al cargar ubicaciones', 'Error de Red');
                }
            });
    }

    onSubmit() {
        if (!this.validarFormulario()) return;

        // Payload base
        const payload: any = {
            asunto: this.asunto.trim(),
            descripcion: this.descripcion.trim(),
            telefono: this.telefono.trim(),
            autor_problema: this.autor_problema.trim(),
            ubicacion_id: this.ubicacion_id!,
        };

        // Payload extra para Staff
        if (this.rol === 'soporte' || this.rol === 'administrador') {
            if (!this.evento_id) {
                this.toastr.warning('Debes clasificar el tipo de evento', 'Faltan datos');
                return;
            }
            payload.evento_id = this.evento_id;
        }

        this.loading.set(true);

        this.ticketService.crearTicket(payload)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        // ÉXITO
                        this.toastr.success('Ticket creado correctamente', '¡Enviado!');
                        
                        // Esperar 1.5s para que el usuario vea el mensaje y redirigir
                        setTimeout(() => {
                            this.navegarSegunRol();
                        }, 1500);
                        
                    } else {
                        this.toastr.error(resp?.message || 'No se pudo crear el ticket', 'Error');
                    }
                },
                error: (error) => {
                    console.error(error);
                    const msg = error.status === 0 ? 'Sin conexión al servidor' : 'Error interno del servidor';
                    this.toastr.error(msg, 'Error');
                }
            });
    }

    private validarFormulario(): boolean {
        if (!this.asunto.trim()) {
            this.toastr.warning('El asunto es obligatorio', 'Atención');
            return false;
        }
        if (!this.descripcion.trim()) {
            this.toastr.warning('La descripción es obligatoria', 'Atención');
            return false;
        }
        if (!this.ubicacion_id) {
            this.toastr.warning('Selecciona una ubicación', 'Atención');
            return false;
        }
        if (!this.telefono.trim()) {
            this.toastr.warning('Indica un teléfono de contacto', 'Atención');
            return false;
        }
        if (!this.autor_problema.trim()) {
            this.toastr.warning('Indica quién reporta el problema', 'Atención');
            return false;
        }
        return true;
    }

    // Navegación inmediata (botón Cancelar)
    cancelar() {
        this.navegarSegunRol();
    }

    // Lógica centralizada de redirección
    private navegarSegunRol() {
        if (this.rol === 'administrador') {
            this.router.navigate(['/admin/tickets/sin-revisar']);
        } else if (this.rol === 'soporte') {
            this.router.navigate(['/soporte']);
        } else {
            this.router.navigate(['/inicio/mis-tickets']);
        }
    }
}