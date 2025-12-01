import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, UpdateUserPayload } from '../../../../core/services/user/user.service';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin-usuarios-soportes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './usuarios-soportes.html'
})
export class UsuariosSoportesComponent implements OnInit {

    // DATA PRINCIPAL
    soportes = signal<any[]>([]);

    // DATA PARA MODAL AGREGAR
    solicitantes = signal<any[]>([]); // Lista para convertir
    solicitanteSeleccionado: any = null; // El usuario que vamos a convertir
    nuevaUnidadId: number | null = null; // La unidad que le asignaremos

    // STATES
    loading = signal(false);
    loadingModal = signal(false);

    // FILTROS VISTA PRINCIPAL
    filtroBusqueda = signal('');
    filtroActivo = signal('todos');
    filtroUnidad = signal('todos');

    // FILTRO MODAL
    filtroBusquedaSolicitante = signal('');

    // MODALS
    showModalAgregar = false;
    modalPassword: any = null; // Usuario al que se le cambia la pass

    // PAGINACIÓN
    currentPage = 1;
    itemsPerPage = 9;
    totalUsers = 0;

    constructor(
        private userService: UserService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.cargarSoportes();
    }

    // =============================
    // CARGA DE SOPORTES (VISTA PRINCIPAL)
    // =============================
    cargarSoportes() {
        this.loading.set(true);
        this.userService.getSupportUsers() // Asegúrate que este método exista en tu servicio
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.soportes.set(resp.data || []);
                        this.totalUsers = (resp.data || []).length;
                    } else {
                        this.toastr.error('No se pudieron obtener los soportes', 'Error');
                    }
                },
                error: () => this.toastr.error('Error de conexión', 'Error')
            });
    }

    // =============================
    // LÓGICA MODAL "AGREGAR SOPORTE"
    // =============================
    abrirModalAgregar() {
        this.showModalAgregar = true;
        this.solicitanteSeleccionado = null;
        this.nuevaUnidadId = null;
        this.filtroBusquedaSolicitante.set('');

        // Cargar solicitantes solo cuando se abre el modal
        this.loadingModal.set(true);
        this.userService.getRequestingUser()
            .pipe(finalize(() => this.loadingModal.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        // Solo mostramos los activos para convertir
                        const activos = (resp.data || []).filter((u: any) => u.activo === 1);
                        this.solicitantes.set(activos);
                    }
                }
            });
    }

    convertirASoporte() {
        if (!this.solicitanteSeleccionado || !this.nuevaUnidadId) {
            this.toastr.warning('Debes seleccionar un usuario y una unidad', 'Faltan datos');
            return;
        }

        const payload: UpdateUserPayload = {
            rol_id: 2, // 2 = Rol Soporte (Ajusta según tu DB)
            unidad_id: Number(this.nuevaUnidadId)
        };

        const toastId = this.toastr.info('Convirtiendo usuario...', 'Procesando').toastId;

        this.userService.updateUser(this.solicitanteSeleccionado.usuario_id, payload)
            .subscribe({
                next: (resp: any) => {
                    this.toastr.clear(toastId);
                    if (resp.success) {
                        this.toastr.success(`${this.solicitanteSeleccionado.nombre_completo} ahora es soporte`, 'Éxito');
                        this.showModalAgregar = false;
                        this.cargarSoportes(); // Recargar la lista principal
                    } else {
                        this.toastr.error('No se pudo actualizar el rol', 'Error');
                    }
                },
                error: () => {
                    this.toastr.clear(toastId);
                    this.toastr.error('Error del servidor', 'Error');
                }
            });
    }

    // =============================
    // ACCIONES EN CARDS
    // =============================
    toggleEstado(u: any) {
        const nuevoEstado = u.activo === 1 ? 0 : 1;
        const estadoAnterior = u.activo;

        // UI Optimista
        u.activo = nuevoEstado;

        this.userService.updateUser(u.usuario_id, { activo: nuevoEstado })
            .subscribe({
                next: (resp: any) => {
                    if (resp.success) {
                        this.toastr.success('Estado actualizado', 'Éxito');
                    } else {
                        u.activo = estadoAnterior;
                        this.toastr.error('Error al cambiar estado', 'Error');
                    }
                },
                error: () => {
                    u.activo = estadoAnterior;
                    this.toastr.error('Error de conexión', 'Error');
                }
            });
    }

    cambiarPassword(usuarioId: number, nuevaContrasena: string) {
        if (!nuevaContrasena?.trim()) {
            this.toastr.warning('La contraseña no es válida', 'Atención');
            return;
        }

        this.userService.updateUser(usuarioId, { contrasena: nuevaContrasena })
            .subscribe({
                next: (resp: any) => {
                    if (resp.success) {
                        this.toastr.success('Contraseña cambiada', 'Éxito');
                        this.modalPassword = null;
                    } else {
                        this.toastr.error('No se pudo cambiar la contraseña', 'Error');
                    }
                }
            });
    }

    // =============================
    // FILTROS Y UTILS
    // =============================

    // Filtro principal (Soportes)
    getFilteredSoportes() {
        const search = this.filtroBusqueda().toLowerCase();
        const activo = this.filtroActivo();
        const unidad = this.filtroUnidad();

        return this.soportes().filter(u => {
            const matchSearch = u.nombre_completo.toLowerCase().includes(search) || u.correo.toLowerCase().includes(search);
            const matchActivo = activo === 'todos' || String(u.activo) === activo;

            // Filtro de unidad un poco más flexible (por nombre o ID si viniera)
            const matchUnidad = unidad === 'todos' ||
                (u.unidad && u.unidad.toLowerCase() === unidad) || // Si viene texto "infraestructura"
                (u.unidad_id && String(u.unidad_id) === unidad);   // Si viene ID

            return matchSearch && matchActivo && matchUnidad;
        });
    }

    // Filtro para el modal (Solicitantes)
    getFilteredSolicitantes() {
        const search = this.filtroBusquedaSolicitante().toLowerCase();
        return this.solicitantes().filter(u =>
            u.nombre_completo.toLowerCase().includes(search) ||
            u.correo.toLowerCase().includes(search)
        );
    }

    // Paginación
    getPaginatedSoportes() {
        const filtered = this.getFilteredSoportes();
        this.totalUsers = filtered.length;

        const maxPage = Math.ceil(this.totalUsers / this.itemsPerPage) || 1;
        if (this.currentPage > maxPage) this.currentPage = 1;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.totalUsers / this.itemsPerPage) || 1;
    }

    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
    previousPage() { if (this.currentPage > 1) this.currentPage--; }
}