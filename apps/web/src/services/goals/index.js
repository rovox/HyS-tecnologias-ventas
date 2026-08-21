import * as store from '@/mocks/store.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';
import { ROLES } from '@/mocks/users.js';

const monthKey = () => new Date().toISOString().slice(0, 7);

function mapMock(row) {
  return {
    id: row.id,
    user_id: row.user_id || '',
    salesperson_name: row.salesperson_name,
    monthly_goal: Number(row.monthly_goal) || 0,
  };
}

/** Metas mensuales por vendedor. Solo el admin escribe (API + UI de Configuración). */
export const goalsService = {
  async listSellerGoals(month = monthKey()) {
    if (!isMockMode) {
      const [goals, users] = await Promise.all([
        apiClient.get('goals', { token: authToken(), query: { month } }),
        apiClient.get('users', { token: authToken() }),
      ]);
      const byUser = new Map((goals || []).map((row) => [row.usuarioId, row]));
      return (users || [])
        .filter((user) => user.role === ROLES.ADMIN || user.role === ROLES.VENTAS)
        .map((user) => {
          const goal = byUser.get(user.id);
          return {
            id: goal?.id || `pending-${user.id}`,
            user_id: user.id,
            salesperson_name: user.name || user.email,
            monthly_goal: Number(goal?.metaMonto ?? 0),
          };
        })
        .sort((a, b) => a.salesperson_name.localeCompare(b.salesperson_name, 'es'));
    }
    return store.list('salesperson_goals').map(mapMock);
  },

  async setMonthlyGoal({ id, userId, monthlyGoal, month = monthKey() }) {
    const metaMonto = Number(monthlyGoal) || 0;
    if (!isMockMode) {
      if (!userId) throw new Error('Falta el usuario del vendedor');
      return apiClient.put('goals', {
        usuarioId: userId,
        month,
        metaMonto,
        metaCotiz: 0,
      }, { token: authToken() });
    }
    const updated = store.update('salesperson_goals', id, { monthly_goal: metaMonto });
    if (!updated) throw new Error('Meta no encontrada');
    return mapMock(updated);
  },

  async createSellerGoal({ name, monthlyGoal }) {
    if (!isMockMode) {
      throw new Error('En modo API las metas se editan sobre usuarios existentes.');
    }
    const nombre = String(name || '').trim();
    if (!nombre) throw new Error('El nombre es obligatorio');
    return mapMock(store.insert('salesperson_goals', {
      salesperson_name: nombre,
      monthly_goal: Number(monthlyGoal) || 0,
      annual_goal: 0,
      user_id: '',
      created_by: 'usr_admin',
    }));
  },

  async removeSellerGoal(id) {
    if (!isMockMode) {
      throw new Error('En modo API no se eliminan metas; edita el monto a 0 si no aplica.');
    }
    return store.remove('salesperson_goals', id);
  },
};

export default goalsService;
