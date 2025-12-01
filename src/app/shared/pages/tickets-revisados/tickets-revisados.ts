import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket/ticket.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-tickets-revisados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-revisados.html',
})
export class TicketsRevisadosComponent implements OnInit {

  // DATA
  tickets = signal<any[]>([]);

  // STATES
  loading = signal(false);
  errorMsg = signal('');

  // FILTROS
  filtroBusqueda: string = '';
  filtroPrioridad: string = 'todos';
  filtroEstado: string = 'todos';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';

  // USUARIO
  usuario: any;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarUsuario(); // Separé la lógica para reutilizarla
    this.cargarTickets();
  }

  // =========================================================
  // CARGA DE USUARIO (CORREGIDA)
  // =========================================================
  cargarUsuario() {
    const rawUser = this.authService.getUser();

    // Verificamos si el usuario viene anidado en 'data.user' (como muestra tu JSON)
    if (rawUser && rawUser.data && rawUser.data.user) {
        this.usuario = rawUser.data.user;
    } else {
        // Fallback: por si acaso ya viniera "plano"
        this.usuario = rawUser;
    }
    
    console.log('Usuario cargado:', this.usuario); // Para depurar que "unidad" esté en la raíz del objeto
  }

  get fechaActual(): Date {
    return new Date();
  }

  // =========================================================
  // CARGA DE TICKETS
  // =========================================================
  cargarTickets() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.ticketService.getTicketsRevisados()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp: any) => {
          if (resp?.success) {
            const ticketsData = resp.data?.tickets || [];
            
            // Ordenar por fecha ASCENDENTE (Más antiguo primero)
            ticketsData.sort((a: any, b: any) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime());

            this.tickets.set(ticketsData);
          } else {
            this.errorMsg.set(resp?.message || 'No se pudieron obtener los tickets');
          }
        },
        error: () => {
          this.errorMsg.set('Error de conexión con el servidor');
        },
      });
  }

  verDetalle(ticket_id: number): void {
    // 1. REVALIDACIÓN DE SEGURIDAD
    if (!this.usuario) {
      this.cargarUsuario();
    }

    // 2. COMPROBACIÓN FINAL
    if (!this.usuario || !this.usuario.nombre_rol) {
      console.error('Error: No se pudo identificar el rol del usuario.', this.usuario);
      return;
    }

    // 3. NAVEGACIÓN SEGURA
    if (this.usuario.nombre_rol === 'administrador') {
      this.router.navigate(['/admin/ticket', ticket_id]);
    } else {
      this.router.navigate(['/soporte/ticket', ticket_id]);
    }
  }

  // =========================================================
  // LÓGICA DE FILTRADO GENERAL
  // =========================================================
  getFilteredTickets() {
    const search = this.filtroBusqueda.toLowerCase().trim();

    return this.tickets().filter(t => {
      // 1. Búsqueda
      const matchSearch =
        !search ||
        t.asunto.toLowerCase().includes(search) ||
        t.descripcion?.toLowerCase().includes(search) ||
        t.ticket_id.toString().includes(search);

      // 2. Prioridad
      const matchPrioridad =
        this.filtroPrioridad === 'todos' ||
        t.prioridad.toLowerCase() === this.filtroPrioridad;

      // 3. Estado
      const matchEstado =
        this.filtroEstado === 'todos' ||
        t.estado.toLowerCase() === this.filtroEstado;

      // 4. Fechas
      const fecha = new Date(t.fecha_creacion);
      const matchFechaDesde = !this.filtroFechaDesde || fecha >= new Date(this.filtroFechaDesde);
      const matchFechaHasta = !this.filtroFechaHasta || fecha <= new Date(this.filtroFechaHasta + 'T23:59:59');

      return matchSearch && matchPrioridad && matchEstado && matchFechaDesde && matchFechaHasta;
    });
  }

  // =========================================================
  // FILTRO PARA KANBAN
  // =========================================================
  getTicketsByPriority(prioridadColumna: string) {
    const ticketsFiltrados = this.getFilteredTickets();
    return ticketsFiltrados.filter(t => t.prioridad.toLowerCase() === prioridadColumna.toLowerCase());
  }

  get nombreUnidad(): string {
    // Como ya "desempaquetamos" el usuario en cargarUsuario(), ahora sí podemos acceder directo
    if (!this.usuario) return 'Cargando...';
    
    // Tu JSON dice "unidad", pero a veces puede ser "nombre_unidad", dejamos ambos por seguridad
    const u = this.usuario.nombre_unidad || this.usuario.unidad || 'Unidad Central';
    return u.charAt(0).toUpperCase() + u.slice(1); // Capitalizar primera letra
  }

  resetFiltros() {
    this.filtroBusqueda = '';
    this.filtroPrioridad = 'todos';
    this.filtroEstado = 'todos';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
  }
}