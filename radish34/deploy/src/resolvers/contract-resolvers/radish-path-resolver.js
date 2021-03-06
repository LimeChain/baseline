const path = require('path');
const assert = require('assert');

const DEFAULT_PATHS = {
	"ERC1820Registry": "../../../config/contract-artifacts/ERC1820Registry.json",
	"Registrar": "../../../config/contract-artifacts/Registrar.json",
	"OrgRegistry": "../../../config/contract-artifacts/OrgRegistry.json",

	"Pairing": "../../../config/contract-artifacts/Pairing.json",
	"BN256G2": "../../../config/contract-artifacts/BN256G2.json",
	"Verifier": "../../../config/contract-artifacts/Verifier.json",
	"Shield": "../../../config/contract-artifacts/Shield.json"
}


/*  
	Replacing the __hash(path.name)__  with __libraryname__ become "somewhat of a standard" 
	as it allows for linking to happen on different machine than the compilation.

	This will allow deployment libraries to work out of the box.

	https://github.com/trufflesuite/truffle/blob/99add8f5e47586030a44a999bcfb287224e304e1/packages/contract/lib/utils/index.js#L146
	https://github.com/LimeChain/etherlime/blob/446b411961c50c36797727fea725d1bdc5a962c5/packages/etherlime-utils/utils/linking-utils.js#L5

	PS. I know it is ugly.
*/
const _replaceLibraryReferenceToTruffleStyle = (bytecode, linkReferences) => {
	for (const entry of Object.entries(linkReferences)) {
		const libraryReferenceObj = entry[1];

		for (const key of Object.keys(libraryReferenceObj)) {

			const metadata = libraryReferenceObj[key][0];

			const lengthBytes = metadata.length;
			const startBytes = metadata.start;

			// 1 byte is always encoded in 2 chars, thus doubling to find the correct length and start
			const lengthChars = lengthBytes * 2;
			const startChars = (startBytes * 2) + 2; // +2 to account for 0x

			const bytecodeBeforeLibraryLink = bytecode.substring(0, startChars)
			const bytecodeAfterLibraryLink = bytecode.substring(startChars+lengthChars);
			bytecode = `${bytecodeBeforeLibraryLink}__${key}__${bytecodeAfterLibraryLink}`
		}
	}

	return bytecode;

}

class RadishPathContractsResolver {

	constructor(paths) {
		this.paths = DEFAULT_PATHS;
		if (typeof paths !== 'undefined') {
			this.paths = require(paths);
		}
		this.cwd = process.cwd();
	}

	resolve(name) {
		const contractPath = path.resolve(this.cwd, this.paths[name]);
		const contractJSON = require(contractPath);

		const contractName = contractJSON.contractName;
		const abi = contractJSON.compilerOutput.abi;
		const bytecode = _replaceLibraryReferenceToTruffleStyle(contractJSON.compilerOutput.evm.bytecode.object, contractJSON.compilerOutput.evm.bytecode.linkReferences)

		return {
			contractName,
			abi,
			bytecode
		}
	}


}

module.exports = RadishPathContractsResolver