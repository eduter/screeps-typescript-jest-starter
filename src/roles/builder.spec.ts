import { mockInstanceOf } from 'screeps-jest';
import roleBuilder, { Builder } from './builder';

const cs1 = mockInstanceOf<ConstructionSite>({ id: 'cs1' as Id<ConstructionSite> });
const cs2 = mockInstanceOf<ConstructionSite>({ id: 'cs2' as Id<ConstructionSite> });
const source1 = mockInstanceOf<Source>({ id: 'source1' as Id<Source> });
const source2 = mockInstanceOf<Source>({ id: 'source2' as Id<Source> });

describe('Builder role', () => {

  it('works on a construction site, when it has energy and is within range', () => {
    const creep = mockInstanceOf<Builder>({
      store: { energy: 50 },
      memory: {
        building: true,
        role: 'builder'
      },
      room: { find: () => [cs1, cs2] },
      build: () => OK
    });

    roleBuilder.run(creep);
    expect(creep.memory.building).toBeTruthy();
    expect(creep.room.find).toHaveBeenCalledWith(FIND_CONSTRUCTION_SITES);
    expect(creep.build).toHaveBeenCalledWith(cs1);
  });

  it('moves towards construction site, when it has energy but is out of range', () => {
    const creep = mockInstanceOf<Builder>({
      store: { energy: 50 },
      memory: {
        building: true,
        role: 'builder'
      },
      room: { find: () => [cs1, cs2] },
      build: () => ERR_NOT_IN_RANGE,
      moveTo: () => OK
    });

    roleBuilder.run(creep);
    expect(creep.memory.building).toBeTruthy();
    expect(creep.room.find).toHaveBeenCalledWith(FIND_CONSTRUCTION_SITES);
    expect(creep.build).toHaveBeenCalledWith(cs1);
    expect(creep.moveTo).toHaveBeenCalledWith(cs1, expect.anything());
  });

  it("harvests, when it's near a source and not full", () => {
    const creep = mockInstanceOf<Builder>({
      store: { getFreeCapacity: () => 50 },
      memory: {
        building: false,
        role: 'builder'
      },
      room: { find: () => [source1, source2] },
      harvest: () => OK
    });

    roleBuilder.run(creep);
    expect(creep.memory.building).toBeFalsy();
    expect(creep.room.find).toHaveBeenCalledWith(FIND_SOURCES);
    expect(creep.harvest).toHaveBeenCalledWith(source1);
  });

  it("moves to a source, when it's not full and not near a source", () => {
    const creep = mockInstanceOf<Builder>({
      store: { getFreeCapacity: () => 50 },
      memory: {
        building: false,
        role: 'builder'
      },
      room: { find: () => [source1, source2] },
      harvest: () => ERR_NOT_IN_RANGE,
      moveTo: () => OK
    });
    roleBuilder.run(creep);
    expect(creep.memory.building).toBeFalsy();
    expect(creep.room.find).toHaveBeenCalledWith(FIND_SOURCES);
    expect(creep.moveTo).toHaveBeenCalledWith(source1, expect.anything());
  });

  it('switches to building when it gets full', () => {
    const creep = mockInstanceOf<Builder>({
      store: { getFreeCapacity: () => 0 },
      memory: {
        building: false,
        role: 'builder'
      },
      room: { find: () => [cs1, cs2] },
      build: () => OK,
      say: () => OK
    });
    roleBuilder.run(creep);
    expect(creep.room.find).toHaveBeenCalledWith(FIND_CONSTRUCTION_SITES);
    expect(creep.memory.building).toBeTruthy();
  });

  it('switches to harvesting when it gets empty', () => {
    const creep = mockInstanceOf<Builder>({
      store: {
        energy: 0,
        getFreeCapacity: () => 50
      },
      memory: {
        building: true,
        role: 'builder'
      },
      room: { find: () => [source1, source2] },
      harvest: () => OK,
      say: () => OK
    });
    roleBuilder.run(creep);
    expect(creep.room.find).toHaveBeenCalledWith(FIND_SOURCES);
    expect(creep.memory.building).toBeFalsy();
  });

});
