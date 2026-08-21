export const mockVehiculos = [
  {
    id: 'veh_01',
    placa: '3344-ABC',
    marca: 'Toyota',
    modelo: 'Hilux',
    anio: 2021,
    estado: 'activo',
    sucursal_id: 'suc_central',
    kilometraje_actual: 48200,
    fotografias: [],
    created_by: 'usr_admin',
    created: '2026-01-20 00:00:00',
    updated: '2026-08-12 00:00:00',
  },
  {
    id: 'veh_02',
    placa: '1188-LPZ',
    marca: 'Nissan',
    modelo: 'Frontier',
    anio: 2019,
    estado: 'activo',
    sucursal_id: 'suc_quillacollo',
    kilometraje_actual: 76110,
    fotografias: [],
    created_by: 'usr_admin',
    created: '2026-02-04 00:00:00',
    updated: '2026-08-10 00:00:00',
  },
];

export const mockRegistrosCombustible = [
  {
    id: 'fuel_1',
    vehiculo_id: 'veh_01',
    fecha: '2026-08-12',
    litros: 45,
    costo: 280,
    kilometraje: 48200,
    created_by: 'usr_tec',
    created: '2026-08-12 18:00:00',
    updated: '2026-08-12 18:00:00',
  },
];

export const mockRegistrosMantenimiento = [
  {
    id: 'mnt_1',
    vehiculo_id: 'veh_02',
    fecha: '2026-08-03',
    tipo_mantenimiento: 'Preventivo',
    descripcion: 'Cambio de aceite y filtros',
    costo: 650,
    created_by: 'usr_admin',
    created: '2026-08-03 11:00:00',
    updated: '2026-08-03 11:00:00',
  },
];

export const mockRegistrosAceite = [];
export const mockRegistrosObservaciones = [];
export const mockRegistrosProblemas = [];
export const mockComentariosVehiculos = [];
export const mockHistorialVehiculos = [
  {
    id: 'hveh_1',
    entidad_tipo: 'vehiculos',
    entidad_id: 'veh_01',
    usuario_id: 'usr_tec',
    accion: 'combustible',
    descripcion: 'Carga 45 L',
    created_by: 'usr_tec',
    created: '2026-08-12 18:00:00',
    updated: '2026-08-12 18:00:00',
  },
];
