import { mockInstanceOf } from 'screeps-jest';
import roleBuilder, { Builder } from './builder';

const cs1 = mockInstanceOf<ConstructionSite>({ id: 'cs1' as Id<ConstructionSite> });
const cs2 = mockInstanceOf<ConstructionSite>({ id: 'cs2' as Id<ConstructionSite> });
const source1 = mockInstanceOf<Source>({ id: 'source1' as Id<Source> });
const source2 = mockInstanceOf<Source>({ id: 'source2' as Id<Source> });
const room = mockInstanceOf<Room>({
  find: (type: FindConstant) => {
    switch (type) {
      case FIND_CONSTRUCTION_SITES:
        return [cs1, cs2];
      case FIND_SOURCES:
        return [source1, source2];
      default:
        return [];
    }
  }
});

describe('Builder role', () => {

  it('should work on a construction site, when it has energy and is within range', () => {
    const creep = mockInstanceOf<Builder>({
      build: () => OK,
      memory: {
        building: true,
        role: 'builder'
      },
      room,
      store: { energy: 50 }
    });

    roleBuilder.run(creep);
    expect(creep.memory.building).toBeTruthy();
    expect(creep.build).toHaveBeenCalledWith(cs1);
  });

  it('should move towards construction site, when it has energy but is out of range', () => {
    const creep = mockInstanceOf<Builder>({
      build: () => ERR_NOT_IN_RANGE,
      memory: {
        building: true,
        role: 'builder'
      },
      moveTo: () => OK,
      room,
      store: { energy: 50 }
    });

    roleBuilder.run(creep);
    expect(creep.memory.building).toBeTruthy();
    expect(creep.build).toHaveBeenCalledWith(cs1);
    expect(creep.moveTo).toHaveBeenCalledWith(cs1, expect.anything());
  });

  it("should harvest, when it's near a source and not full", () => {
    const creep = mockInstanceOf<Builder>({
      harvest: () => OK,
      memory: {
        building: false,
        role: 'builder'
      },
      room,
      store: { getFreeCapacity: () => 50 }
    });

    roleBuilder.run(creep);
    expect(creep.memory.building).toBeFalsy();
    expect(creep.harvest).toHaveBeenCalledWith(source1);
  });

  it("should move to a source, when it's not full and not near a source", () => {
    const creep = mockInstanceOf<Builder>({
      harvest: () => ERR_NOT_IN_RANGE,
      memory: {
        building: false,
        role: 'builder'
      },
      moveTo: () => OK,
      room,
      store: { getFreeCapacity: () => 50 }
    });
    roleBuilder.run(creep);
    expect(creep.memory.building).toBeFalsy();
    expect(creep.moveTo).toHaveBeenCalledWith(source1, expect.anything());
  });

  it('should switch to building when it gets full', () => {
    const creep = mockInstanceOf<Builder>({
      build: () => OK,
      memory: {
        building: false,
        role: 'builder'
      },
      room,
      say: () => OK,
      store: { getFreeCapacity: () => 0 }
    });
    roleBuilder.run(creep);
    expect(creep.memory.building).toBeTruthy();
  });

  it('should switch to harvesting when it gets empty', () => {
    const creep = mockInstanceOf<Builder>({
      harvest: () => OK,
      memory: {
        building: true,
        role: 'builder'
      },
      room,
      say: () => OK,
      store: {
        energy: 0,
        getFreeCapacity: () => 50
      }
    });
    roleBuilder.run(creep);
    expect(creep.memory.building).toBeFalsy();
  });

});
