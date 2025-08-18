import { expect } from 'chai';

import path from "path";
import { getEmulators, utils } from "../emulators-nodejs";
import { Shell } from "../utils/shell";

const project = path.resolve(__dirname, "..", "..", "..");

const pathPrefix = {
  production: path.join(project, "dist"),
  development: path.join(project, "build/wasm/"),
};
const emu = getEmulators(pathPrefix.development);



async function run_emulator(autoexecString: string) {
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
  const ci = await emu.dosboxDirect(config);
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
  return {stdout,ci}
}


describe('Shell', () => {
  describe('#stdout', () => {
    it('autoexec echo message', async () => {
      const AUTOEXEC_TEST_STRING = "AUTOEXEC TEST";
      const {ci,stdout}=await run_emulator(AUTOEXEC_TEST_STRING);
      expect(stdout).to.include(AUTOEXEC_TEST_STRING)
      ci.exit()
    })
    it('shell echo message', async () => {
      const AUTOEXEC_TEST_STRING = "AUTOEXEC TEST";
      const {ci,stdout}=await run_emulator(AUTOEXEC_TEST_STRING);

      const cmds = Array.from({length: 3}, () => "echo " + Math.random().toFixed(3));
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

