import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    templateUrl: './sidebar.html',
    imports: [CommonModule],
})
export class SidebarComponent implements OnInit {

    currentRoute = '';

    // --- NUEVO: Estado del sidebar ---
    isSidebarOpen = true;

    constructor(
        public authService: AuthService,
        private router: Router,
    ) {
        // ... (tu código existente del constructor se mantiene igual)
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.currentRoute = event.urlAfterRedirects || event.url;
        });

        effect(() => {
            const user = this.authService.user();
            if (user) {
                this.redirectIfRoleMismatch(user);
            }
        });
    }

    ngOnInit() {
        // ... (tu código existente ngOnInit se mantiene igual)
        this.currentRoute = this.router.url;
        if (!this.authService.getUser()) {
            this.authService.refreshUser();
        }
    }

    // --- NUEVO: Función para alternar el sidebar ---
    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    // ... (El resto de tus funciones: get usuario, getNavButtonClass, etc. se mantienen igual)
    get usuario() { return this.authService.user(); }

    getNavButtonClass(route: string): string {
        const isActive = this.currentRoute === route;
        if (isActive) {
            return 'bg-[#62CEEA] text-[#002777] shadow-md shadow-[#62CEEA]/20 font-bold';
        }
        return 'text-white/80 hover:bg-white/10 hover:text-white font-medium';
    }

    getInitials(name: string | undefined): string {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }
    


    private redirectIfRoleMismatch(user: any) { /*...*/ }
    goDashboard() { this.router.navigate(['/admin']); }
    goTicketsSinRevisar() { this.router.navigate(['/admin/tickets/sin-revisar']); }
    goTicketsRevisados() { this.router.navigate(['/admin/tickets/revisados']); }
    goCrearTicket() { this.router.navigate(['/admin/crear-ticket']); }
    goUsuarios() { this.router.navigate(['/admin/solicitantes']); }
    goSoportes() { this.router.navigate(['/admin/soportes']); }
    goUbicaciones() { this.router.navigate(['/admin/ubicaciones']); }
    goSoporteTickets() { this.router.navigate(['/soporte']); }
    goSoporteMisTickets() { this.router.navigate(['/soporte/mis-tickets']); }
    goSoporteCrearTicket() { this.router.navigate(['/soporte/crear-ticket']); }
    cerrarSesion() {
        this.authService.setUser(null);
        localStorage.removeItem('hospital_credenciales');
        this.router.navigate(['/login']);
    }
}