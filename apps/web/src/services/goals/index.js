import { apiClient, authToken } from '@/api/http.js';
import { ROLES } from '@/constants/roles.js';

const monthKey = () => new Date().toISOString().slice(0, 7);

export const goalsService = {
  async listSellerGoals(month = monthKey()) {
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
  },

  async setMonthlyGoal({ userId, monthlyGoal, month = monthKey() }) {
    const metaMonto = Number(monthlyGoal) || 0;
    if (!userId) throw new Error('Falta el usuario del vendedor');
    return apiClient.put('goals', {
      usuarioId: userId,
      month,
      metaMonto,
      metaCotiz: 0,
    }, { token: authToken() });
  },
};

export default goalsService;
