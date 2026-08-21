import { PEDIDOS_FLOW } from '@/hooks/StateFlowValidator.js';

export { PEDIDOS_FLOW };

export const mockPedidosInternos = [
  {
    id: 'ped_andina',
    numero_pedido: 'PI-2026-008',
    responsable_id: 'usr_tec',
    aprobado_por_id: 'usr_admin',
    sucursal_origen_id: 'suc_central',
    sucursal_destino_id: 'suc_central',
    cronograma_id: 'sch_andina',
    prioridad: 'Alta',
    estado: 'en_preparación',
    observacion: 'Material para instalación CCTV Andina',
    entregado_por_id: '',
    observacion_entrega: '',
    vendedor_responsable_id: 'usr_ventas',
    created_by: 'usr_tec',
    created: '2026-08-07 08:30:00',
    updated: '2026-08-12 10:00:00',
  },
  {
    id: 'ped_mall',
    numero_pedido: 'PI-2026-011',
    responsable_id: 'usr_tec',
    aprobado_por_id: '',
    sucursal_origen_id: 'suc_central',
    sucursal_destino_id: 'suc_quillacollo',
    cronograma_id: 'sch_mall',
    prioridad: 'Normal',
    estado: 'solicitado',
    observacion: 'Cámaras de recambio Plaza Norte',
    entregado_por_id: '',
    observacion_entrega: '',
    vendedor_responsable_id: 'usr_ventas',
    created_by: 'usr_tec',
    created: '2026-08-11 09:00:00',
    updated: '2026-08-11 09:00:00',
  },
  {
    id: 'ped_pino',
    numero_pedido: 'PI-2026-004',
    responsable_id: 'usr_admin',
    aprobado_por_id: 'usr_admin',
    sucursal_origen_id: 'suc_central',
    sucursal_destino_id: 'suc_punata',
    cronograma_id: 'sch_pino',
    prioridad: 'Normal',
    estado: 'entregado',
    observacion: 'Material cerco Los Pinos',
    entregado_por_id: 'usr_tec',
    observacion_entrega: 'Entregado en obra',
    vendedor_responsable_id: 'usr_ventas',
    created_by: 'usr_tec',
    created: '2026-07-29 11:00:00',
    updated: '2026-08-02 16:00:00',
  },
];

export const mockDetallesPedidos = [
  { id: 'det_a1', pedido_id: 'ped_andina', descripcion: 'Cámara IP 4MP', cantidad: 12, unidad: 'pza', created: '2026-08-07 08:31:00', updated: '2026-08-07 08:31:00' },
  { id: 'det_a2', pedido_id: 'ped_andina', descripcion: 'Cable UTP cat6 (caja)', cantidad: 4, unidad: 'caja', created: '2026-08-07 08:31:00', updated: '2026-08-07 08:31:00' },
  { id: 'det_a3', pedido_id: 'ped_andina', descripcion: 'NVR 16ch', cantidad: 1, unidad: 'pza', created: '2026-08-07 08:31:00', updated: '2026-08-07 08:31:00' },
  { id: 'det_m1', pedido_id: 'ped_mall', descripcion: 'Cámara bullet 2MP', cantidad: 4, unidad: 'pza', created: '2026-08-11 09:01:00', updated: '2026-08-11 09:01:00' },
  { id: 'det_p1', pedido_id: 'ped_pino', descripcion: 'Alambre de cerco', cantidad: 8, unidad: 'rollo', created: '2026-07-29 11:01:00', updated: '2026-07-29 11:01:00' },
];

export const mockComentariosPedidos = [
  {
    id: 'cped_1',
    pedido_id: 'ped_andina',
    contenido: 'Falta confirmar stock de NVR en almacén Central',
    created_by: 'usr_admin',
    created: '2026-08-08 10:00:00',
    updated: '2026-08-08 10:00:00',
  },
];

export const mockMerchandiseOrders = [];
