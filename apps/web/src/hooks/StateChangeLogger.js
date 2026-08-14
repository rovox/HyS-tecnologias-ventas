import pb from '@/lib/pocketbaseClient.js';

export const logStateChange = async ({
  entityType,
  entityId,
  userId,
  userName,
  estadoAnterior,
  estadoNuevo,
  comentario = '',
  fotografias = []
}) => {
  console.log(`[StateChangeLogger] Initiating log for ${entityType} ${entityId}: ${estadoAnterior} -> ${estadoNuevo}`);
  
  try {
    const descripcion = comentario || `Estado cambiado de '${estadoAnterior}' a '${estadoNuevo}'`;
    
    const payload = {
      entidad_tipo: entityType,
      entidad_id: entityId,
      usuario_id: userId,
      accion: 'cambiar_estado',
      campo_modificado: 'estado',
      valor_anterior: estadoAnterior,
      valor_nuevo: estadoNuevo,
      descripcion: descripcion,
      created_by: userName
    };

    console.log(`[StateChangeLogger] Payload to save:`, payload);

    const record = await pb.collection('historial_actividad').create(payload, { $autoCancel: false });
    console.log(`[StateChangeLogger] Record created with ID: ${record.id}`);

    // Immediately fetch back to confirm persistence
    const fetchedRecord = await pb.collection('historial_actividad').getOne(record.id, { $autoCancel: false });
    console.log(`[StateChangeLogger] FETCHED BACK RECORD TO CONFIRM PERSISTENCE:`, fetchedRecord);

    return { success: true, record: fetchedRecord };
  } catch (error) {
    console.error('[StateChangeLogger] Error logging state change:', error);
    return { success: false, error };
  }
};