import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket/ticket.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin-ticket-revisar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ticket-revisar.html',
})
export class AdminTicketRevisarComponent implements OnInit {

    // ============================
    // DATA
    // ============================
    ticket = signal<any | null>(null);
    detalle = signal<any | null>(null);
    soportes = signal<any[]>([]);

    // ============================
    // STATES
    // ============================
    loading = signal(false);
    savingConfig = signal(false);

    // Controla si la sección de clasificación está en modo lectura (guardado) o edición
    isClassificationSaved = signal(false);

    // ============================
    // FORM SIGNALS
    // ============================
    unidad_id = signal<number | null>(null);
    prioridad_id = signal<number | null>(null);
    // Mantenemos estado_id aunque no esté en el HTML por si el backend lo requiere
    estado_id = signal<number | null>(null);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ticketService: TicketService,
        private toastr: ToastrService
    ) { }

    // ============================
    // INIT
    // ============================
    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.toastr.error('Identificador de ticket inválido', 'Error');
            this.volver();
            return;
        }

        this.cargar(id);
        this.cargarSoportes();
    }

    // ============================
    // HELPER PARA HTML
    // ============================
    // Esto lo usa el *ngIf="clasificacionGuardada()" en tu HTML
    clasificacionGuardada(): boolean {
        return this.isClassificationSaved();
    }

    // ============================
    // CARGAR TICKET PRINCIPAL
    // ============================
    cargar(id: number) {
        this.loading.set(true);

        this.ticketService.getTicketById(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (!resp?.success) {
                        this.toastr.error(resp?.message || 'No se pudo obtener el ticket', 'Error');
                        return;
                    }

                    const wrapper = resp.data?.ticket;
                    if (!wrapper) return;

                    this.ticket.set(wrapper.ticket);
                    this.detalle.set(wrapper.detalle || null);

                    const t = wrapper.ticket;

                    // -----------------------------------------------------
                    // 1. MAPEO DE TEXTO A IDs (Para que coincida con los selects)
                    // -----------------------------------------------------
                    // Como el JSON trae "infraestructura", "alta", "en proceso",
                    // debemos convertirlos a números para que las variables _id funcionen.

                    const mapUnidad: any = { 'soporte técnico': 1, 'infraestructura': 2, 'desarrollo': 3 };
                    const mapPrioridad: any = { 'baja': 1, 'media': 2, 'alta': 3 };
                    // Mapeo simple de estado si fuera necesario
                    const mapEstado: any = { 'abierto': 1, 'en proceso': 2, 'resuelto': 3, 'cerrado': 4 };

                    const uVal = t.unidad ? t.unidad.toLowerCase() : '';
                    const pVal = t.prioridad ? t.prioridad.toLowerCase() : '';
                    const eVal = t.estado ? t.estado.toLowerCase() : '';

                    this.unidad_id.set(mapUnidad[uVal] || null);
                    this.prioridad_id.set(mapPrioridad[pVal] || null);
                    this.estado_id.set(mapEstado[eVal] || null);

                    // -----------------------------------------------------
                    // 2. LÓGICA DE BLOQUEO (TU SOLICITUD)
                    // -----------------------------------------------------
                    // Si el estado es "en proceso" O ya tiene unidad y prioridad definidas,
                    // activamos el modo lectura.

                    if (eVal === 'en proceso' || (this.unidad_id() && this.prioridad_id())) {
                        this.isClassificationSaved.set(true);
                    } else {
                        this.isClassificationSaved.set(false);
                    }
                },
                error: () => this.toastr.error('Error de conexión cargando datos', 'Error'),
            });
    }

    // ============================
    // LISTA DE SOPORTES
    // ============================
    cargarSoportes() {
        this.ticketService.getSoportes().subscribe({
            next: (resp: any) => {
                if (resp?.success) this.soportes.set(resp.data || []);
            }
        });
    }

    // ============================
    // ASIGNAR SOPORTE
    // ============================
    asignarSoporte(soporteId: number) {
        const t = this.ticket();
        if (!t) return;

        // Validamos que se haya guardado la clasificación antes de asignar (opcional, pero recomendado)
        if (!this.isClassificationSaved()) {
            this.toastr.warning('Debes guardar la clasificación (Unidad y Prioridad) antes de asignar.', 'Atención');
            return;
        }

        const toastId = this.toastr.info('Asignando técnico...', 'Procesando', { disableTimeOut: true }).toastId;

        this.ticketService.assignSoporte(t.ticket_id, soporteId).subscribe({
            next: (resp: any) => {
                this.toastr.clear(toastId);

                if (resp?.success) {
                    this.toastr.success('Técnico asignado correctamente', 'Éxito');
                    // Recargamos para que se actualice la vista (aparezca la card del técnico y desaparezca la lista)
                    this.cargar(t.ticket_id);
                } else {
                    this.toastr.error(resp?.message || 'No se pudo asignar', 'Error');
                }
            },
            error: () => {
                this.toastr.clear(toastId);
                this.toastr.error('Error en el servidor al asignar', 'Error');
            }
        });
    }

    // ============================
    // GUARDAR CAMBIOS (CLASIFICACIÓN)
    // ============================
    guardarCambios() {
        const t = this.ticket();
        if (!t) return;

        // Validaciones simples
        if (!this.unidad_id()) {
            this.toastr.warning('Debes seleccionar una Unidad Responsable.', 'Faltan datos');
            return;
        }
        if (!this.prioridad_id()) {
            this.toastr.warning('Debes seleccionar un Nivel de Prioridad.', 'Faltan datos');
            return;
        }

        this.savingConfig.set(true);

        const payload = {
            unidad_id: this.unidad_id()!,
            prioridad_id: this.prioridad_id()!,
            estado_id: this.estado_id()!, // Se envía el estado actual (o el que venga del back)
        };

        this.ticketService.updateTicket(t.ticket_id, payload)
            .pipe(finalize(() => this.savingConfig.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.toastr.success('Clasificación guardada correctamente', 'Guardado');
                        // Aquí bloqueamos los inputs activando el flag
                        this.isClassificationSaved.set(true);

                        // Opcional: Recargar datos para asegurar consistencia
                        // this.cargar(t.ticket_id); 
                    } else {
                        this.toastr.warning(resp?.message || 'No se pudieron guardar cambios', 'Atención');
                    }
                },
                error: () => this.toastr.error('Error al guardar configuración', 'Error'),
            });
    }

    // ============================
    // FINALIZAR REVISIÓN
    // ============================
    guardarRevision() {
        const t = this.ticket();
        if (!t) return;

        // Validación: Si no ha clasificado, no dejar finalizar
        if (!this.isClassificationSaved()) {
            this.toastr.error('Debes clasificar el ticket (Unidad y Prioridad) antes de finalizar.', 'Error');
            return;
        }

        if (!this.detalle()?.soporte_asignado) {
            this.toastr.warning(
                'Te recomendamos asignar un técnico antes de finalizar la revisión, aunque no es obligatorio.',
                'Aviso',
                { timeOut: 5000 }
            );
        }

        const toastId = this.toastr.info('Finalizando revisión...', 'Procesando').toastId;

        this.ticketService.markReviewed(t.ticket_id).subscribe({
            next: (resp: any) => {
                this.toastr.clear(toastId);

                if (resp?.success) {
                    this.toastr.success('Ticket movido a bandeja de salida', 'Revisión Completada');

                    setTimeout(() => {
                        this.router.navigate(['/admin/tickets/revisados']);
                    }, 900);
                } else {
                    this.toastr.error(resp?.message || 'Fallo al finalizar revisión', 'Error');
                }
            },
            error: () => {
                this.toastr.clear(toastId);
                this.toastr.error('Error de servidor', 'Error');
            }
        });
    }

    // ============================
    // UTILS
    // ============================
    getInicialSoporte(): string {
        return this.detalle()?.soporte_nombre?.charAt(0).toUpperCase() || '?';
    }

    volver() {
        this.router.navigate(['/admin/tickets/sin-revisar']);
    }
}