import { Routes } from '@angular/router';

import { LoginComponent } from './auth/pages/login/login';

import { SolicitanteInicioComponent } from './features/solicitante/pages/inicio/inicio';
import { MisTicketsComponent } from './features/solicitante/pages/mis-tickets/mis-tickets';
import { AdminDashboardComponent } from './features/admin/pages/dashboard/dashboard';
import { AdminTicketsSinRevisarComponent } from './features/admin/pages/tickets-sin-revisar/tickets-sin-revisar';
import { AdminTicketRevisarComponent } from './features/admin/pages/ticket-revisar/ticket-revisar';
import { UsuariosSolicitantesComponent } from './features/admin/pages/usuarios-solicitantes/usuarios-solicitantes';
import { TicketsAsignadosPorSoporteComponent } from './features/soporte/pages/tickets-asignados-por-soporte/tickets-asignados-por-soporte';
import { UsuariosSoportesComponent } from './features/admin/pages/usuarios-soportes/usuarios-soportes';
import { UbicacionesComponent } from './features/admin/pages/ubicaciones/ubicaciones';
// layouts
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { SoporteLayoutComponent } from './layouts/soporte-layout/soporte-layout.component';
import { SolicitanteLayoutComponent } from './layouts/solicitante-layout/solicitante-layout.component';
// compartidos
import { CrearTicketComponent } from './shared/pages/crear-ticket/crear-ticket';
import { TicketDetalleComponent } from './features/solicitante/pages/ticket-detalle/ticket-detalle';
import { TicketsRevisadosComponent } from './shared/pages/tickets-revisados/tickets-revisados';
import { TicketDetalleStaffComponent } from './shared/pages/ticket-detalle-staff/ticket-detalle-staff';



export const routes: Routes = [
    // rutas de autenticación
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'inicio',
        component: SolicitanteLayoutComponent,
        children: [
            { path: '', component: SolicitanteInicioComponent },
            { path: 'crear-ticket', component: CrearTicketComponent },
            { path: 'mis-tickets', component: MisTicketsComponent },
            { path: 'ticket/:id', component: TicketDetalleComponent },
        ]
    },
    {
        path: 'soporte',
        component: SoporteLayoutComponent,
        children: [
            { path: '', component: TicketsRevisadosComponent },
            { path: 'mis-tickets', component: TicketsAsignadosPorSoporteComponent },
            { path: 'crear-ticket', component: CrearTicketComponent },
            { path: 'ticket/:id', component: TicketDetalleStaffComponent },
        ]
    },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        children: [
            { path: '', component: AdminDashboardComponent },
            { path: 'tickets/sin-revisar', component: AdminTicketsSinRevisarComponent },
            { path: 'ticket/:id/sin-revisar', component: AdminTicketRevisarComponent },
            { path: 'tickets/revisados', component: TicketsRevisadosComponent },
            { path: 'ticket/:id', component: TicketDetalleStaffComponent },
            { path: 'crear-ticket', component: CrearTicketComponent },
            { path: 'solicitantes', component: UsuariosSolicitantesComponent },
            { path: 'soportes', component: UsuariosSoportesComponent },
            { path: 'ubicaciones', component: UbicacionesComponent },
        ]
    },
];
