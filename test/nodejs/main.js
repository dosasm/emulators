const path=require("path")
const assert=require("chai").assert

const { getEmulators,utils } =require("../..")
const emu=getEmulators(path.resolve(__dirname,"..","..","dist"))


const TEST_STRING="XDRGS"
const config={
    dosboxConf: `[autoexec]
echo ${TEST_STRING}
`,
    jsdosConf: {
        version: "",
    },
};

describe('Basic emulator test', function () {
    it("node dosbox backend",async function(){
        const ci=await emu.dosboxNode(config);
        let stdout="";
        ci.events().onStdout(data=>{stdout+=data})
        await new Promise(resolve=>setTimeout(resolve,1000))
        assert.ok(stdout.includes(TEST_STRING),"stdout:"+stdout);
        await ci.exit()
        assert.ok(true);
    })

    it("node dosbox backend exit with command",async function(){
        const ci=await emu.dosboxNode(config);
        let stdout="";
        ci.events().onStdout(data=>{stdout+=data})
        await new Promise(resolve=>setTimeout(resolve,1000))
        assert.ok(stdout.includes(TEST_STRING),"stdout:"+stdout);
        utils.String2jsdosCode("exit").forEach(code=>ci.simulateKeyPress(...code))
        assert.ok(true);
    })

    it("node dosboxX backend",async function(){
        this.timeout(9000)
        const ci=await emu.dosboxXNode(config);
        let stdout="";
        ci.events().onStdout(data=>{stdout+=data})
        await new Promise(resolve=>setTimeout(resolve,2000))
        assert.ok(stdout.includes(TEST_STRING),"stdout:"+stdout);
        await ci.exit()
        assert.ok(true);
    })
});