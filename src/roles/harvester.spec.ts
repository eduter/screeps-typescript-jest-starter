import { mockInstanceOf, mockStructure } from 'screeps-jest';
import roleHarvester from './harvester';

const source1 = mockInstanceOf<Source>({ id: 'source1' as Id<Source> });
const source2 = mockInstanceOf<Source>({ id: 'source2' as Id<Source> });
const extension = mockStructure(STRUCTURE_EXTENSION);
const room = mockInstanceOf<Room>({
  find: (type: FindConstant) => {
    switch (type) {
      case FIND_SOURCES:
        return [source1, source2];
      case FIND_STRUCTURES:
        return [extension];
      default:
        return [];
    }
  }
});

describe('Harvester role', () => {

  describe('run', () => {

    it("should harvest, when it's near a source and not full", () => {
      const creep = mockInstanceOf<Creep>({
        harvest: () => OK,
        room,
        store: { getFreeCapacity: () => 50 }
      });

      roleHarvester.run(creep);
      expect(creep.harvest).toHaveBeenCalledWith(source1);
    });

    it("should move to a source, when it's not full and not near a source", () => {
      const creep = mockInstanceOf<Creep>({
        harvest: () => ERR_NOT_IN_RANGE,
        moveTo: () => OK,
        room,
        store: { getFreeCapacity: () => 50 }
      });
      roleHarvester.run(creep);
      expect(creep.moveTo).toHaveBeenCalledWith(source1, expect.anything());
    });

    it("should fill structures, when it's full and near a non-full structure", () => {
      const creep = mockInstanceOf<Creep>({
        room,
        store: { getFreeCapacity: () => 0 },
        transfer: () => OK
      });

      roleHarvester.run(creep);
      expect(creep.transfer).toHaveBeenCalledWith(extension, RESOURCE_ENERGY);
      // doesn't actually guarantee that the filter function is roleHarvester.isToBeFilled, as it should
      expect(creep.room.find).toHaveBeenCalledWith(FIND_STRUCTURES, { filter: expect.any(Function) });
    });

    it("should move towards a non-full structure, when it's full and out of range to transfer", () => {
      const creep = mockInstanceOf<Creep>({
        moveTo: () => OK,
        room,
        store: { getFreeCapacity: () => 0 },
        transfer: () => ERR_NOT_IN_RANGE
      });

      roleHarvester.run(creep);
      expect(creep.moveTo).toHaveBeenCalledWith(extension, expect.anything());
    });

  });

  describe('isToBeFilled', () => {

    it('should accept extension, spawns and towers that are not full', () => {
      [
        STRUCTURE_EXTENSION,
        STRUCTURE_SPAWN,
        STRUCTURE_TOWER
      ].forEach(structureType => {
        const structure = mockStructure(structureType, {
          energy: 0,
          energyCapacity: 100
        });
        expect(roleHarvester.isToBeFilled(structure)).toBeTruthy();
      });
    });

    it('should reject extension, spawns and towers that are already full', () => {
      [
        STRUCTURE_EXTENSION,
        STRUCTURE_SPAWN,
        STRUCTURE_TOWER
      ].forEach(structureType => {
        const structure = mockStructure(structureType, {
          energy: 100,
          energyCapacity: 100
        });
        expect(roleHarvester.isToBeFilled(structure)).toBeFalsy();
      });
    });

    it('should reject any other structure type', () => {
      [
        STRUCTURE_CONTAINER,
        STRUCTURE_CONTROLLER,
        STRUCTURE_EXTRACTOR,
        STRUCTURE_KEEPER_LAIR,
        STRUCTURE_LAB,
        STRUCTURE_LINK,
        STRUCTURE_NUKER,
        STRUCTURE_OBSERVER,
        STRUCTURE_PORTAL,
        STRUCTURE_POWER_BANK,
        STRUCTURE_POWER_SPAWN,
        STRUCTURE_RAMPART,
        STRUCTURE_ROAD,
        STRUCTURE_STORAGE,
        STRUCTURE_TERMINAL,
        STRUCTURE_WALL
      ].forEach(structureType => {
        const structure = mockStructure(structureType);
        expect(roleHarvester.isToBeFilled(structure)).toBeFalsy();
      });
    });

  });
});
