const assert = require('assert');
const etherlimeLib = require('etherlime-lib');

const ProtocolContractsBuilder = require('./builders/protocol-contracts-builder.js');
const WorkgroupContractsBuilder = require('./builders/workgroup-contracts-builder.js');

class BaselineDeployer {

	constructor(deployerWallet, provider) {
		assert(deployerWallet, "Deployment wallet was not provided");
		assert(provider, "Provider was not provided");
		this.provider = provider;
		this.deployerWallet = deployerWallet.connect(provider)
	}

	getProtocolBuilder(contractsResolver) {
		return new ProtocolContractsBuilder(contractsResolver);
	}

	getWorkgroupBuilder(contractsResolver) {
		return new WorkgroupContractsBuilder(contractsResolver);
	}

	async deployProtocol(deployProtocolTask) {
		if (typeof deployProtocolTask === 'undefined') {
			throw new Error('No deployment task supplied. Get one from  protocolBuilder.build()');
		}

		const deployer = new etherlimeLib.Deployer(this.deployerWallet, this.provider);
		const result = {}

		const erc1820RegistryContract = await this._deployErc1820Registry(deployer, deployProtocolTask.erc1820Artifacts);

		result['ERC1820Registry'] = erc1820RegistryContract;

		return result;
	}

	async _deployErc1820Registry(deployer, contractArtifacts) {
		if (typeof contractArtifacts === 'undefined') {
			throw new Error('No ERC1820Registry contract artifacts supplied');
		}

		return await deployer.deploy(contractArtifacts);
	}

	async deployWorkgroup(deployWorkgroupTask) {
		if (typeof deployWorkgroupTask === 'undefined') {
			throw new Error('No deployment task supplied. Get one from  workgroupBuilder.build()');
		}

		const deployer = new etherlimeLib.Deployer(this.deployerWallet, this.provider);
		let result = {}

		if (typeof deployWorkgroupTask.orgRegistryArtifacts !== 'undefined') {
			const orgRegistryContract = await this._deployOrgRegistry(deployer, deployWorkgroupTask.orgRegistryArtifacts);
			result['OrgRegistry'] = orgRegistryContract;
		}

		if (typeof deployWorkgroupTask.shieldArtifacts !== 'undefined') {
			const shieldContracts = await this._deployShield(deployer, deployWorkgroupTask.BN256G2Artifacts, deployWorkgroupTask.verifierArtifacts, deployWorkgroupTask.shieldArtifacts);
			result = {
				...result,
				...shieldContracts
			}
		}

		return result;
	}

	async _deployOrgRegistry(deployer, contractArtifacts) {
		if (typeof contractArtifacts === 'undefined') {
			throw new Error('No OrgRegistry contract artifacts supplied');
		}

		return await deployer.deploy(contractArtifacts, {}, contractArtifacts.erc1820RegistryAddress);
	}

	async _deployShield(deployer, bnArtifacts, verifierArtifacts, shieldArtifacts) {
		if (typeof bnArtifacts === 'undefined') {
			throw new Error('No BN256G2 contract artifacts supplied');
		}

		if (typeof verifierArtifacts === 'undefined') {
			throw new Error('No Verifier contract artifacts supplied');
		}

		if (typeof shieldArtifacts === 'undefined') {
			throw new Error('No Shield contract artifacts supplied');
		}


		const BNContract = await deployer.deploy(bnArtifacts, {});

		const VerifierContract = await deployer.deploy(verifierArtifacts, {
			'BN256G2': BNContract.contractAddress
		}, verifierArtifacts.erc1820RegistryAddress);

		const ShieldContract = await deployer.deploy(shieldArtifacts, {}, VerifierContract.contractAddress, shieldArtifacts.erc1820RegistryAddress)

		const result = {}
		result['BN256G2'] = BNContract;
		result['Verifier'] = VerifierContract;
		result['Shield'] = ShieldContract;

		return result;
	}



}

module.exports = BaselineDeployer