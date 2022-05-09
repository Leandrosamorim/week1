const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");
const { time } = require("console");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing

        //Specifies the input values, circuit and initial setup
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        //Prints the result of the public signals
        console.log('1x2 =',publicSignals[0]);


        //Deserialize public signals
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        //Deserialize proof
        const editedProof = unstringifyBigInts(proof);
        //Formats proof and public signal for web3
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
        //Remove irregular characters, converts to string and groups on array
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        //Formats arguments based on contract calldata
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        //Asserts proof is true with given arguments
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    //False scenario with false arguments
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        //Asserts proof is false with given arguments
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");

        //Prints the result of the public signals
        console.log('1x2x3 =',publicSignals[0]);


        //Deserialize public signals
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        //Deserialize proof
        const editedProof = unstringifyBigInts(proof);
        //Formats proof and public signal for web3
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
        //Remove irregular characters, converts to string and groups on array
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        //Formats arguments based on contract calldata
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        //Asserts proof is true with given arguments
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        //Asserts proof is false with given arguments
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/_plonkMultiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/_plonkMultiplier3/circuit_final.zkey");

        //Prints the result of the public signals
        console.log('1x2x3 =',publicSignals[0]);


        //Deserialize public signals
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        //Deserialize proof
        const editedProof = unstringifyBigInts(proof);
        //Formats proof and public signal for web3
        const calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals);
        //Remove irregular characters, converts to string and groups on array

        let firstParameter = calldata.split(",")[0]
        let secondParameter = [calldata.split(",")[1].slice(2,calldata.split(",")[1].length-2)]

        expect(await verifier.verifyProof(firstParameter,secondParameter)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let firstParameter = "0x00"
        let secondParameter = ["0x00"]
        //Asserts proof is false with given arguments
        expect(await verifier.verifyProof(firstParameter, secondParameter)).to.be.false;
    });
});