import 'ts-polyfill/lib/es2019-array';

import roleBuilder, { Builder } from "roles/builder";
import roleHarvester from "roles/harvester";
import roleUpgrader, { Upgrader } from "roles/upgrader";
import { ErrorMapper } from "utils/ErrorMapper";
import { runTower } from "./tower";


function unwrappedLoop() {
  console.log(`Current game tick is ${Game.time}`);

  Object.values(Game.rooms).forEach(room => {
    if (room.controller && room.controller.my) {
      const towers: StructureTower[] = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } }) as any;

      towers.forEach(tower => {
        runTower(tower);
      });
    }
  });

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === "harvester") {
      roleHarvester.run(creep);
    }
    if (creep.memory.role === "upgrader") {
      roleUpgrader.run(creep as Upgrader);
    }
    if (creep.memory.role === "builder") {
      roleBuilder.run(creep as Builder);
    }
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
const loop = ErrorMapper.wrapLoop(unwrappedLoop);

export {
  loop,
  unwrappedLoop
};
