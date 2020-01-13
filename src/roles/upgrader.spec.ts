import { mockInstanceOf, mockStructure } from "screeps-jest";
import roleUpgrader, { Upgrader } from "./upgrader";


const controller = mockStructure(STRUCTURE_CONTROLLER);
const source1 = mockInstanceOf<Source>({ id: "source1" as Id<Source> });
const source2 = mockInstanceOf<Source>({ id: "source2" as Id<Source> });
const room = mockInstanceOf<Room>({
  controller,
  find: (type: FindConstant) => type === FIND_SOURCES ? [source1, source2] : []
});


describe("Upgrader role", () => {

  it("should upgrade the controller, when it has energy and is within range", () => {
    const creep = mockInstanceOf<Upgrader>({
      memory: {
        role: "upgrader",
        upgrading: true
      },
      room,
      store: {
        energy: 50
      },
      upgradeController: () => OK
    });

    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeTruthy();
    expect(creep.upgradeController).toHaveBeenCalledWith(controller);
  });

  it("should move towards controller, when it has energy but is out of range", () => {
    const creep = mockInstanceOf<Upgrader>({
      memory: {
        role: "upgrader",
        upgrading: true
      },
      moveTo: () => OK,
      room,
      store: {
        energy: 50
      },
      upgradeController: () => ERR_NOT_IN_RANGE
    });

    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeTruthy();
    expect(creep.upgradeController).toHaveBeenCalledWith(controller);
    expect(creep.moveTo).toHaveBeenCalledWith(controller, expect.anything());
  });

  it("should harvest, when it's near a source and not full", () => {
    const creep = mockInstanceOf<Upgrader>({
      harvest: () => OK,
      memory: {
        role: "upgrader",
        upgrading: false
      },
      room,
      store: {
        getFreeCapacity: () => 50
      }
    });

    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeFalsy();
    expect(creep.harvest).toHaveBeenCalledWith(source1);
  });

  it("should move to a source, when it's not full and not near a source", () => {
    const creep = mockInstanceOf<Upgrader>({
      harvest: () => ERR_NOT_IN_RANGE,
      memory: {
        role: "upgrader",
        upgrading: false
      },
      moveTo: () => OK,
      room,
      store: {
        getFreeCapacity: () => 50
      }
    });
    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeFalsy();
    expect(creep.moveTo).toHaveBeenCalledWith(source1, expect.anything());
  });

  it("should switch to upgrading when it gets full", () => {
    const creep = mockInstanceOf<Upgrader>({
      memory: {
        role: "upgrader",
        upgrading: false
      },
      room,
      say: () => OK,
      store: {
        getFreeCapacity: () => 0
      },
      upgradeController: () => OK
    });
    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeTruthy();
  });

  it("should switch to harvesting when it gets empty", () => {
    const creep = mockInstanceOf<Upgrader>({
      harvest: () => OK,
      memory: {
        role: "upgrader",
        upgrading: true
      },
      room,
      say: () => OK,
      store: {
        energy: 0,
        getFreeCapacity: () => 50
      }
    });
    roleUpgrader.run(creep);
    expect(creep.memory.upgrading).toBeFalsy();
  });

});
