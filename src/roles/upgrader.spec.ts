import { mockInstanceOf, mockStructure } from 'screeps-jest';
import roleUpgrader, { Upgrader } from './upgrader';

const controller = mockStructure(STRUCTURE_CONTROLLER);
const source1 = mockInstanceOf<Source>({ id: 'source1' as Id<Source> });
const source2 = mockInstanceOf<Source>({ id: 'source2' as Id<Source> });

describe('Upgrader role', () => {

  it('upgrades the controller, when it has energy and is within range', () => {
    const creep = mockInstanceOf<Upgrader>({
      store: { energy: 50 },
      memory: {
        role: 'upgrader',
        upgrading: true
      },
      room: { controller },
      upgradeController: () => OK
    });

    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeTruthy();
    expect(creep.upgradeController).toHaveBeenCalledWith(controller);
  });

  it('idles, when it has energy, but is in a room without a controller', () => {
    const creep = mockInstanceOf<Upgrader>({
      store: { energy: 50 },
      memory: {
        role: 'upgrader',
        upgrading: true
      },
      room: { controller: undefined },
      upgradeController: () => OK
    });

    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeTruthy();
    expect(creep.upgradeController).not.toHaveBeenCalled();
  });

  it('moves towards controller, when it has energy but is out of range', () => {
    const creep = mockInstanceOf<Upgrader>({
      store: { energy: 50 },
      memory: {
        role: 'upgrader',
        upgrading: true
      },
      room: { controller },
      upgradeController: () => ERR_NOT_IN_RANGE,
      moveTo: () => OK
    });

    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeTruthy();
    expect(creep.upgradeController).toHaveBeenCalledWith(controller);
    expect(creep.moveTo).toHaveBeenCalledWith(controller, expect.anything());
  });

  it("harvests, when it's near a source and not full", () => {
    const creep = mockInstanceOf<Upgrader>({
      store: { getFreeCapacity: () => 50 },
      memory: {
        role: 'upgrader',
        upgrading: false
      },
      room: { find: () => [source1, source2] },
      harvest: () => OK
    });

    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeFalsy();
    expect(creep.room.find).toHaveBeenCalledWith(FIND_SOURCES);
    expect(creep.harvest).toHaveBeenCalledWith(source1);
  });

  it("moves to a source, when it's not full and not near a source", () => {
    const creep = mockInstanceOf<Upgrader>({
      store: { getFreeCapacity: () => 50 },
      memory: {
        role: 'upgrader',
        upgrading: false
      },
      room: { find: () => [source1, source2] },
      harvest: () => ERR_NOT_IN_RANGE,
      moveTo: () => OK
    });
    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeFalsy();
    expect(creep.room.find).toHaveBeenCalledWith(FIND_SOURCES);
    expect(creep.moveTo).toHaveBeenCalledWith(source1, expect.anything());
  });

  it('switches to upgrading when it gets full', () => {
    const creep = mockInstanceOf<Upgrader>({
      store: { getFreeCapacity: () => 0 },
      memory: {
        role: 'upgrader',
        upgrading: false
      },
      room: { controller },
      upgradeController: () => OK,
      say: () => OK
    });
    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeTruthy();
  });

  it('switches to harvesting when it gets empty', () => {
    const creep = mockInstanceOf<Upgrader>({
      store: {
        energy: 0,
        getFreeCapacity: () => 50
      },
      memory: {
        role: 'upgrader',
        upgrading: true
      },
      room: { find: () => [source1, source2] },
      harvest: () => OK,
      say: () => OK
    });
    roleUpgrader.run(creep);
    expect(creep.room.find).toHaveBeenCalledWith(FIND_SOURCES);
    expect(creep.memory.upgrading).toBeFalsy();
  });

});
