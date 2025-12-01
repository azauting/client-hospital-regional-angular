import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket/ticket.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
    selector: 'app-ticket-detalle-staff',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ticket-detalle-staff.html',
})
export class TicketDetalleStaffComponent implements OnInit {

    // Signals (sin interfaces, todo flexible)
    ticket = signal<any>(null);
    detalle = signal<any>(null);
    observaciones = signal<any[]>([]);
    integrantes = signal<any[]>([]);

    // UI States
    loading = signal(false);
    loadingAction = signal(false); // Spinner para acciones (botones)
    errorMsg = signal('');
    successMsg = signal('');

    // Inputs del formulario
    respuesta = signal('');
    nuevaObservacion = signal('');

    // Datos usuario
    currentUser: any;

    // Modal
    showIntegrantesModal = signal(false);
    soportesDisponibles = signal<any[]>([]);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ticketService: TicketService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        // Convertimos a número para asegurar que el ID sea válido
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.errorMsg.set('ID de ticket inválido');
            return;
        }

        this.resolveUserAndLoadTicket(id);
    }

    // Lógica unificada para obtener usuario y luego el ticket
    private resolveUserAndLoadTicket(ticketId: number) {
        const u = this.authService.getUser();

        if (u) {
            this.currentUser = u;
            this.cargarDatos(ticketId);
        } else {
            this.loading.set(true);
            this.authService.getMe()
                .pipe(finalize(() => this.loading.set(false)))
                .subscribe({
                    next: (resp: any) => {
                        if (resp?.success && resp.data?.user) {
                            this.currentUser = resp.data.user;
                            this.authService.setUser(this.currentUser);
                            this.cargarDatos(ticketId);
                        } else {
                            this.errorMsg.set('Error de autenticación');
                        }
                    },
                    error: () => this.errorMsg.set('Error obteniendo sesión')
                });
        }
    }

    cargarDatos(id: number) {
        this.loading.set(true);
        this.resetMessages();

        this.ticketService.getTicketById(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (!resp?.success) {
                        this.errorMsg.set(resp?.message || 'Error al cargar ticket');
                        return;
                    }

                    const data = resp.data?.ticket;
                    // Asignamos directamente los datos
                    this.ticket.set(data?.ticket || null);
                    this.detalle.set(data?.detalle || null);
                    this.observaciones.set(data?.observaciones || []);
                    this.integrantes.set(data?.integrantes || []);
                },
                error: () => this.errorMsg.set('Error de conexión con el servidor')
            });
    }

    // --- Acciones del Ticket ---

    autoAsignarme() {
        const t = this.ticket();
        if (!t) return;

        this.loadingAction.set(true);

        this.ticketService.assignTicketToSelf(t.ticket_id, this.currentUser.usuario_id)
            .pipe(finalize(() => this.loadingAction.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.showSuccess('Ticket asignado exitosamente');
                        this.cargarDatos(t.ticket_id);
                    } else {
                        this.errorMsg.set(resp?.message);
                    }
                },
                error: () => this.errorMsg.set('Error al asignar ticket')
            });
    }

    cerrarTicket() {
        const t = this.ticket();
        if (!t) return;

        if (!this.respuesta().trim()) {
            this.errorMsg.set('Es obligatoria una respuesta de resolución para cerrar el ticket.');
            return;
        }

        if (!confirm('¿Estás seguro de cerrar este ticket? Esta acción notificará al usuario.')) return;

        this.loadingAction.set(true);

        this.ticketService.cerrarTicket(t.ticket_id, this.respuesta())
            .pipe(finalize(() => this.loadingAction.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.volver();
                    } else {
                        this.errorMsg.set(resp?.message);
                    }
                },
                error: () => this.errorMsg.set('Error al cerrar el ticket')
            });
    }

    agregarObservacion() {
        const t = this.ticket();
        const obs = this.nuevaObservacion().trim();
        if (!t || !obs) return;

        this.loadingAction.set(true);

        this.ticketService.addTicketObservation(t.ticket_id, obs)
            .pipe(finalize(() => this.loadingAction.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.nuevaObservacion.set('');
                        this.cargarDatos(t.ticket_id); // Recargamos para ver la fecha/hora del server
                    }
                },
                error: () => this.errorMsg.set('Error al guardar observación')
            });
    }

    // --- Gestión de Integrantes ---

    abrirModalIntegrantes() {
        this.showIntegrantesModal.set(true);

        // Carga perezosa: solo pedimos los soportes si no los tenemos aún
        if (this.soportesDisponibles().length === 0) {
            this.ticketService.getSoportes().subscribe((resp: any) => {
                if (resp?.success) this.soportesDisponibles.set(resp.data || []);
            });
        }
    }

    agregarIntegrante(soporteId: number) {
        const t = this.ticket();
        if (!t) return;

        this.ticketService.agregarIntegrante(t.ticket_id, soporteId).subscribe((resp: any) => {
            if (resp?.success) {
                this.cargarDatos(t.ticket_id);
                this.showIntegrantesModal.set(false);
            }
        });
    }

    // --- Helpers & UI Logic ---

    volver() {
        const ruta = this.currentUser?.rol === 'soporte' ? '/soporte' : '/admin/tickets/revisados';
        this.router.navigate([ruta]);
    }

    resetMessages() {
        this.errorMsg.set('');
        this.successMsg.set('');
    }

    showSuccess(msg: string) {
        this.successMsg.set(msg);
        // Limpia el mensaje de éxito después de 4 segundos
        setTimeout(() => this.successMsg.set(''), 4000);
    }

    // Clases dinámicas para Tailwind
    getStatusClass(estado: string): string {
        const map: any = {
            'abierto': 'bg-blue-100 text-blue-800 ring-blue-600/20',
            'en proceso': 'bg-amber-100 text-amber-800 ring-amber-600/20',
            'en pausa': 'bg-gray-100 text-gray-800 ring-gray-600/20',
            'cancelado': 'bg-red-100 text-red-800 ring-red-600/20',
            'cerrado': 'bg-emerald-100 text-emerald-800 ring-emerald-600/20'
        };
        return `ring-1 ring-inset ${map[estado] || 'bg-gray-50 text-gray-600'}`;
    }

    getPriorityClass(prioridad: string): string {
        const map: any = {
            'alta': 'text-red-700 bg-red-50 ring-red-600/10',
            'media': 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
            'baja': 'text-green-700 bg-green-50 ring-green-600/20'
        };
        return `ring-1 ring-inset ${map[prioridad] || 'text-gray-600 bg-gray-50'}`;
    }
}