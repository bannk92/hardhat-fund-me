const { deployments, getNamedAccounts, ethers } = require("hardhat")

async function main() {
    let deployer = (await getNamedAccounts()).deployer
    deployer = await ethers.provider.getSigner(deployer)
    const fundMeAddress = (await deployments.getOrNull("FundMe")).address
    const fundMe = await ethers.getContractAt("FundMe", fundMeAddress, deployer)
    console.log("FundMe contract ...")

    const transactionResponse = await fundMe.fund({value: ethers.parseEther("0.1")})
    await transactionResponse.wait(1)

    console.log("Funded!")
}

main().then(() => {
    process.exit(0)
}).catch((error) => {
    console.error(error)
    process.exit(1)
}) 