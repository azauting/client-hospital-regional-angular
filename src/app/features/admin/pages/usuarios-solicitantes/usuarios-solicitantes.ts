import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// Asegúrate de importar la interfaz si la tienes exportada en el servicio, ayuda al autocompletado
import { UserService, UpdateUserPayload } from '../../../../core/services/user/user.service';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './usuarios-solicitantes.html'
})
export class UsuariosSolicitantesComponent implements OnInit {

    // DATA & STATES
    usuarios = signal<any[]>([]);
    loading = signal(false);

    // FILTROS
    filtroBusqueda = signal('');
    filtroActivo = signal('todos');

    // MODALS
    modalPassword: any = null;

    // PAGINACIÓN
    currentPage = 1;
    itemsPerPage = 9;
    totalUsers = 0;

    usuario: any;

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.usuario = this.authService.getUser();
        this.cargarUsuarios();
    }

    // =============================
    // CARGA DE DATOS
    // =============================
    cargarUsuarios() {
        this.loading.set(true);

        this.userService.getRequestingUser()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const usersData = resp.data || [];
                        this.usuarios.set(usersData);
                        this.totalUsers = usersData.length;
                    } else {
                        this.toastr.error(resp?.message || 'Error al cargar usuarios', 'Error');
                    }
                },
                error: () => this.toastr.error('Error de conexión', 'Error'),
            });
    }

    // ===================================
    // ACCIONES
    // ===================================

    // 1. CAMBIAR CONTRASEÑA (Actualizado para usar updateUser)
    cambiarPassword(usuarioId: number, nuevaContrasena: string) {
        if (!nuevaContrasena || !nuevaContrasena.trim()) {
            this.toastr.warning('La contraseña no puede estar vacía', 'Atención');
            return;
        }

        const toastId = this.toastr.info('Actualizando...', 'Procesando').toastId;

        // Preparamos el payload usando la interfaz genérica
        const payload: UpdateUserPayload = {
            contrasena: nuevaContrasena
        };

        // Usamos el método genérico updateUser
        this.userService.updateUser(usuarioId, payload)
            .subscribe({
                next: (resp: any) => {
                    this.toastr.clear(toastId);
                    if (resp.success) {
                        this.toastr.success('Contraseña actualizada correctamente', 'Éxito');
                    } else {
                        this.toastr.error(resp.message || 'Error al actualizar', 'Error');
                    }
                },
                error: () => {
                    this.toastr.clear(toastId);
                    this.toastr.error('Error del servidor', 'Error');
                }
            });
    }

    // 2. TOGGLE ESTADO (Activo/Inactivo)
    toggleEstado(u: any) {
        const nuevoEstado = u.activo === 1 ? 0 : 1;

        // Optimistic UI Update
        const estadoAnterior = u.activo;
        u.activo = nuevoEstado;

        const payload: UpdateUserPayload = {
            activo: nuevoEstado
        };

        this.userService.updateUser(u.usuario_id, payload)
            .subscribe({
                next: (resp: any) => {
                    if (resp.success) {
                        this.toastr.success(`Usuario ${nuevoEstado === 1 ? 'habilitado' : 'deshabilitado'}`, 'Éxito');
                    } else {
                        u.activo = estadoAnterior; // Revertir
                        this.toastr.error('No se pudo cambiar el estado', 'Error');
                    }
                },
                error: () => {
                    u.activo = estadoAnterior; // Revertir
                    this.toastr.error('Error de conexión', 'Error');
                }
            });
    }

    // ===================================
    // FILTROS
    // ===================================
    getFilteredUsers() {
        const search = this.filtroBusqueda().toLowerCase();
        const activo = this.filtroActivo();

        return this.usuarios().filter(u => {
            const matchSearch =
                u.nombre_completo.toLowerCase().includes(search) ||
                u.correo.toLowerCase().includes(search);

            const matchActivo =
                activo === 'todos' ||
                String(u.activo) === activo;

            return matchSearch && matchActivo;
        });
    }

    // ===============================
    // PAGINACIÓN
    // ===============================
    getPaginatedUsers() {
        const filtered = this.getFilteredUsers();
        this.totalUsers = filtered.length;

        const maxPage = Math.ceil(this.totalUsers / this.itemsPerPage) || 1;
        if (this.currentPage > maxPage) this.currentPage = 1;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.totalUsers / this.itemsPerPage) || 1;
    }

    nextPage() {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }

    previousPage() {
        if (this.currentPage > 1) this.currentPage--;
    }
}