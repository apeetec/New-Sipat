import { describe, it, expect } from 'vitest';

interface UserMock {
  id: string;
  name: string;
  unitId: string;
  active: boolean;
}

interface ParticipationMock {
  userId: string;
  eventDayId: string;
  status: 'submitted' | 'in_progress';
  perfectScore: boolean;
}

function filterEligibleUsers(
  users: UserMock[],
  participations: ParticipationMock[],
  previousWinnerIds: Set<string>,
  options: {
    scope: 'day-1' | 'full_week';
    unitFilter: string | 'all';
    excludePreviousWinners: boolean;
  }
): UserMock[] {
  return users.filter(user => {
    if (!user.active) return false;
    if (options.unitFilter !== 'all' && user.unitId !== options.unitFilter) return false;
    if (options.excludePreviousWinners && previousWinnerIds.has(user.id)) return false;

    if (options.scope === 'day-1') {
      const p = participations.find(part => part.userId === user.id && part.eventDayId === 'day-1');
      return p?.status === 'submitted' && p.perfectScore === true;
    }

    if (options.scope === 'full_week') {
      const userParts = participations.filter(part => part.userId === user.id && part.status === 'submitted');
      return userParts.length === 5 && userParts.every(part => part.perfectScore === true);
    }

    return false;
  });
}

describe('Regras de Elegibilidade e Filtros de Sorteio SIPAT', () => {
  const mockUsers: UserMock[] = [
    { id: 'u1', name: 'Colaborador Perfeito 1', unitId: 'unit-sumare', active: true },
    { id: 'u2', name: 'Colaborador Perfeito 2 (Já Ganhou)', unitId: 'unit-sumare', active: true },
    { id: 'u3', name: 'Colaborador Outra Unidade', unitId: 'unit-itirapina', active: true },
    { id: 'u4', name: 'Colaborador Nota 80%', unitId: 'unit-sumare', active: true },
  ];

  const mockParts: ParticipationMock[] = [
    { userId: 'u1', eventDayId: 'day-1', status: 'submitted', perfectScore: true },
    { userId: 'u2', eventDayId: 'day-1', status: 'submitted', perfectScore: true },
    { userId: 'u3', eventDayId: 'day-1', status: 'submitted', perfectScore: true },
    { userId: 'u4', eventDayId: 'day-1', status: 'submitted', perfectScore: false }, // Não gabaritou
  ];

  const previousWinnerIds = new Set(['u2']);

  it('deve excluir colaboradores que já ganharam quando a opção estiver ativa', () => {
    const eligible = filterEligibleUsers(mockUsers, mockParts, previousWinnerIds, {
      scope: 'day-1',
      unitFilter: 'all',
      excludePreviousWinners: true,
    });

    const ids = eligible.map(u => u.id);
    expect(ids).toContain('u1');
    expect(ids).toContain('u3');
    expect(ids).not.toContain('u2'); // Excluído por premiação anterior
    expect(ids).not.toContain('u4'); // Excluído por não gabaritar
  });

  it('deve filtrar estritamente por ID exato de unidade', () => {
    const eligible = filterEligibleUsers(mockUsers, mockParts, previousWinnerIds, {
      scope: 'day-1',
      unitFilter: 'unit-sumare',
      excludePreviousWinners: true,
    });

    expect(eligible.length).toBe(1);
    expect(eligible[0].id).toBe('u1');
  });
});
