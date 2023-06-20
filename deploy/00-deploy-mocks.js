const { network } = require("hardhat")
const {
    developmentChains,
    decimals,
    initialAnswer,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const { chainId } = network.config.chainId

    if (developmentChains.includes(network.name)) {
        log("检测到本地网络 正在部署MOCK...")

        const mocks = await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            args: [decimals, initialAnswer],
            log: true,
        })
        log("本地网络MOCK智能合约部署完毕...")
    }
}

module.exports.tags = ["all", "mocks"]
