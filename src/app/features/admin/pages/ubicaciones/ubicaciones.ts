import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoService } from '../../../../core/services/tipo/tipo.service';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin-ubicaciones',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ubicaciones.html'
})
export class UbicacionesComponent implements OnInit {

    // DATA
    ubicaciones = signal<any[]>([]);
    areas = signal<any[]>([]);

    // STATES
    loading = signal(false);
    activeTab = signal<'ubicaciones' | 'areas'>('ubicaciones');

    // MODALS STATE
    modalUbicacion: any = null;
    modalArea: any = null;

    // FILTRO
    filtroBusqueda = signal('');

    constructor(
        private tipoService: TipoService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.cargarDatos();
    }

    cargarDatos() {
        this.loading.set(true);
        this.tipoService.getAreas().subscribe({
            next: (resp: any) => {
                if (resp.success) this.areas.set(resp.data?.tipos_area?.areas || []);

                this.tipoService.getUbicaciones()
                    .pipe(finalize(() => this.loading.set(false)))
                    .subscribe({
                        next: (r: any) => {
                            if (r.success) this.ubicaciones.set(r.data?.tipos_ubicacion?.ubicaciones || []);
                        },
                        error: () => this.toastr.error('Error cargando ubicaciones')
                    });
            },
            error: () => {
                this.loading.set(false);
                this.toastr.error('Error cargando áreas');
            }
        });
    }

    // =========================
    // GESTIÓN UBICACIONES
    // =========================
    guardarUbicacion(nombre: string, areaId: string) {
        // CORRECCIÓN AQUÍ: Separamos el toastr del return
        if (!nombre || !areaId) {
            this.toastr.warning('Complete los datos');
            return;
        }

        const payload = { ubicacion: nombre, area_id: Number(areaId) };
        const esEdicion = this.modalUbicacion.ubicacion_id;

        const request = esEdicion
            ? this.tipoService.updateUbicacion(this.modalUbicacion.ubicacion_id, payload)
            : this.tipoService.createUbicacion(payload);

        request.subscribe({
            next: (resp: any) => {
                if (resp.success) {
                    this.toastr.success(esEdicion ? 'Ubicación actualizada' : 'Ubicación creada');
                    this.modalUbicacion = null;
                    this.cargarDatos();
                } else {
                    this.toastr.error(resp.message);
                }
            },
            error: () => this.toastr.error('Error en el servidor')
        });
    }

    // =========================
    // GESTIÓN ÁREAS
    // =========================
    guardarArea(nombre: string) {
        // CORRECCIÓN AQUÍ: Separamos el toastr del return
        if (!nombre) {
            this.toastr.warning('Ingrese el nombre del área');
            return;
        }

        const payload = { nombre_area: nombre };
        const esEdicion = this.modalArea.area_id;

        const request = esEdicion
            ? this.tipoService.updateArea(this.modalArea.area_id, payload)
            : this.tipoService.createArea(payload);

        request.subscribe({
            next: (resp: any) => {
                if (resp.success) {
                    this.toastr.success(esEdicion ? 'Área actualizada' : 'Área creada');
                    this.modalArea = null;
                    this.cargarDatos();
                } else {
                    this.toastr.error(resp.message);
                }
            },
            error: () => this.toastr.error('Error en el servidor')
        });
    }

    // =========================
    // UTILS & FILTROS
    // =========================
    getFilteredUbicaciones() {
        const search = this.filtroBusqueda().toLowerCase();
        return this.ubicaciones().filter(u =>
            u.ubicacion.toLowerCase().includes(search) ||
            (u.nombre_area && u.nombre_area.toLowerCase().includes(search))
        );
    }

    getFilteredAreas() {
        const search = this.filtroBusqueda().toLowerCase();
        return this.areas().filter(a =>
            a.nombre_area.toLowerCase().includes(search)
        );
    }
}