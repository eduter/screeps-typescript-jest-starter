import { mockInstanceOf, mockStructure } from 'screeps-jest';
import { isDamaged, runTower } from 'tower';

describe('tower module', () => {

  describe('runTower', () => {

    it('attacks the nearest hostile creep, if there is one in the room', () => {
      const hostileCreep = mockInstanceOf<Creep>();
      const tower = mockStructure(STRUCTURE_TOWER, {
        attack: () => OK,
        pos: { findClosestByRange: (type: FindConstant) => (type === FIND_HOSTILE_CREEPS ? hostileCreep : null) }
      });
      runTower(tower);
      expect(tower.attack).toHaveBeenCalledWith(hostileCreep);
    });

    it('repairs the nearest damaged structure, if there is one in the room', () => {
      const damagedStructure = mockStructure(STRUCTURE_EXTENSION);
      const tower = mockStructure(STRUCTURE_TOWER, {
        pos: { findClosestByRange: (type: FindConstant) => (type === FIND_STRUCTURES ? damagedStructure : null) },
        repair: () => OK
      });
      runTower(tower);
      expect(tower.pos.findClosestByRange).toHaveBeenCalledWith(FIND_STRUCTURES, { filter: isDamaged });
      expect(tower.repair).toHaveBeenCalledWith(damagedStructure);
    });

    it('idles, otherwise', () => {
      const tower = mockStructure(STRUCTURE_TOWER, {
        attack: () => OK,
        heal: () => OK,
        pos: { findClosestByRange: () => null },
        repair: () => OK
      });
      runTower(tower);
      expect(tower.attack).not.toHaveBeenCalled();
      expect(tower.repair).not.toHaveBeenCalled();
      expect(tower.heal).not.toHaveBeenCalled();
    });

  });

  describe('isDamaged', () => {

    it('returns false if the structure has full health', () => {
      const structure = mockStructure(STRUCTURE_SPAWN, {
        hits: 5000,
        hitsMax: 5000
      });
      expect(isDamaged(structure)).toBeFalsy();
    });

    it("returns true if the structure doesn't have full health", () => {
      const structure = mockStructure(STRUCTURE_SPAWN, {
        hits: 3000,
        hitsMax: 5000
      });
      expect(isDamaged(structure)).toBeTruthy();
    });

  });

});
