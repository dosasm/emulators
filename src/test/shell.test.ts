import { expect } from 'chai';

import { getEmulators, utils, BUILTIN } from "../emulators-nodejs";
import { Shell } from "../utils/shell";

const emu = getEmulators(BUILTIN.development);

async function run_emulator(autoexecString: string, emulator = "dosbox") {
  const config = {
    dosboxConf: `[autoexec]
      mount c .
      c:
      echo ${autoexecString}
      `,
    jsdosConf: {
      version: "",
    },
  };
  let ci = undefined;
  if (emulator === "dosbox") {
    ci = await emu.dosboxDirect(config);
  }
  else if (emulator === "dosbox-x") {
    ci = await emu.dosboxXDirect(config);
  }
  if (ci === undefined) {
    throw new Error("")
  }
  let stdout = "";
  ci.events().onStdout((data) => {
    stdout += data;
  });
  const p = new Promise(resolve => {
    setInterval(() => {
      if (stdout.includes(autoexecString)) {
        resolve(stdout)
      }
    }, 100);
  })
  await p;
  return { stdout, ci }
}


describe('Shell dosbox', () => {
  describe('#stdout', () => {
    it('autoexec echo message', async () => {
      const AUTOEXEC_TEST_STRING = "AUTOEXEC TEST";
      const { ci, stdout } = await run_emulator(AUTOEXEC_TEST_STRING);
      expect(stdout).to.include(AUTOEXEC_TEST_STRING)
      ci.exit()
    })
    it('shell echo message', async () => {
      const AUTOEXEC_TEST_STRING = "AUTOEXEC TEST";
      const { ci, stdout } = await run_emulator(AUTOEXEC_TEST_STRING);

      const cmds = Array.from({ length: 3 }, () => "echo " + Math.random().toFixed(3));
      const shell = new Shell(ci)
      await shell.wait_prompt()
      for (const cmd of cmds) {
        await utils.sleep(100)
        console.log(cmd)
        const out = await shell.exec(cmd)
        expect(out).to.include(cmd)
      }
      ci.exit()
    });
  });
});


describe('Shell dosbox-x', () => {
  describe('#stdout', () => {
    it('autoexec echo message', async () => {
      const AUTOEXEC_TEST_STRING = "AUTOEXEC TEST";
      const { ci, stdout } = await run_emulator(AUTOEXEC_TEST_STRING, "dosbox-x");
      expect(stdout).to.include(AUTOEXEC_TEST_STRING)
      ci.exit()
    })
    it('shell echo message', async () => {
      const AUTOEXEC_TEST_STRING = "AUTOEXEC TEST";
      const { ci, stdout } = await run_emulator(AUTOEXEC_TEST_STRING, "dosbox-x");

      const cmds = Array.from({ length: 3 }, () => "echo " + Math.random().toFixed(3));
      const shell = new Shell(ci)
      await shell.wait_prompt()
      for (const cmd of cmds) {
        await utils.sleep(100)
        console.log(cmd)
        const out = await shell.exec(cmd)
        expect(out).to.include(cmd)
      }
      ci.exit()
    });
  });
});
