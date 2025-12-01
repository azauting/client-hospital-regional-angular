import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TicketService } from '../../../../core/services/ticket/ticket.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-tickets-sin-revisar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tickets-sin-revisar.html',
})
export class AdminTicketsSinRevisarComponent implements OnInit {

    // =========================================
    // Signals internas (estado reactivo real)
    // =========================================
    tickets = signal<any[]>([]);
    loading = signal<boolean>(false);
    errorMsg = signal<string>('');
    fechaActual = signal(new Date());

    // =========================================
    // Propiedades normales (ngModel bind)
    // =========================================
    filtroBusqueda = '';
    filtroOrigen = 'todos';
    filtroEvento = 'todos';
    filtroFechaDesde = '';
    filtroFechaHasta = '';

    // Signals espejo (reactivo real)
    _filtroBusqueda = signal('');
    _filtroOrigen = signal('todos');
    _filtroEvento = signal('todos');
    _filtroFechaDesde = signal('');
    _filtroFechaHasta = signal('');

    // =========================================
    // Paginación
    // =========================================
    currentPage = 1;
    itemsPerPage = 10;
    totalTickets = 0;

    constructor(
        private ticketService: TicketService,
        private router: Router,
    ) { }

    ngOnInit() {
        this.cargarTickets();

        // Timer para refrescar hora
        setInterval(() => this.fechaActual.set(new Date()), 1000);
    }

    // =========================================
    // Cargar tickets iniciales
    // =========================================
    cargarTickets() {
        this.loading.set(true);
        this.errorMsg.set('');

        this.ticketService.getTicketsSinRevisar()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const data = resp.data?.tickets ?? resp.data?.tickets_sin_revisar ?? [];
                        this.tickets.set(data);
                        this.totalTickets = data.length;
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron cargar los tickets.');
                    }
                },
                error: () => {
                    this.errorMsg.set('Error de conexión al cargar tickets.');
                }
            });
    }

    // =========================================
    // Eventos ngModel → signals
    // =========================================
    onFiltroBusquedaChange(v: string) { this.filtroBusqueda = v; this._filtroBusqueda.set(v); }
    onFiltroOrigenChange(v: string) { this.filtroOrigen = v; this._filtroOrigen.set(v); }
    onFiltroEventoChange(v: string) { this.filtroEvento = v; this._filtroEvento.set(v); }
    onFiltroFechaDesdeChange(v: string) { this.filtroFechaDesde = v; this._filtroFechaDesde.set(v); }
    onFiltroFechaHastaChange(v: string) { this.filtroFechaHasta = v; this._filtroFechaHasta.set(v); }

    // =========================================
    // Filtrado y Paginación
    // =========================================
    getFilteredTickets() {
        const search = this._filtroBusqueda().toLowerCase().trim();

        return this.tickets().filter(t => {
            const matchSearch =
                !search ||
                t.asunto.toLowerCase().includes(search) ||
                t.usuario_nombre.toLowerCase().includes(search) ||
                t.ticket_id.toString().includes(search);

            const matchOrigen =
                this._filtroOrigen() === 'todos' ||
                t.origen?.toLowerCase() === this._filtroOrigen();

            const matchEvento =
                this._filtroEvento() === 'todos' ||
                t.evento?.toLowerCase() === this._filtroEvento();

            const fechaTicket = new Date(t.fecha_creacion);

            const matchDesde =
                !this._filtroFechaDesde() ||
                fechaTicket >= new Date(this._filtroFechaDesde());

            const matchHasta =
                !this._filtroFechaHasta() ||
                fechaTicket <= new Date(this._filtroFechaHasta() + 'T23:59:59');

            return matchSearch && matchOrigen && matchEvento && matchDesde && matchHasta;
        });
    }

    getPaginatedTickets() {
        const filtered = this.getFilteredTickets();
        this.totalTickets = filtered.length;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
    }

    resetFiltros() {
        this.filtroBusqueda = '';
        this.filtroOrigen = 'todos';
        this.filtroEvento = 'todos';
        this.filtroFechaDesde = '';
        this.filtroFechaHasta = '';

        this._filtroBusqueda.set('');
        this._filtroOrigen.set('todos');
        this._filtroEvento.set('todos');
        this._filtroFechaDesde.set('');
        this._filtroFechaHasta.set('');

        this.currentPage = 1;
    }

    // TrackBy
    trackByTicketId(index: number, ticket: any) {
        return ticket.ticket_id;
    }

    // ===============================
    // Paginación UI
    // ===============================
    get totalPages() {
        return Math.ceil(this.totalTickets / this.itemsPerPage) || 1;
    }

    previousPage() { if (this.currentPage > 1) this.currentPage--; }
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

    goToPage(page: number) {
        if (page !== -1 && page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    getPageNumbers() {
        const pages: number[] = [];
        const total = this.totalPages;
        const current = this.currentPage;

        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

        if (current <= 4)
            return [1, 2, 3, 4, 5, -1, total];

        if (current >= total - 3)
            return [1, -1, total - 4, total - 3, total - 2, total - 1, total];

        return [1, -1, current - 1, current, current + 1, -1, total];
    }

    onItemsPerPageChange(event: any) {
        this.itemsPerPage = Number(event.target.value);
        this.currentPage = 1;
    }

    verDetalle(ticket_id: number) {
        this.router.navigate([`/admin/ticket/${ticket_id}/sin-revisar`]);
    }
}
