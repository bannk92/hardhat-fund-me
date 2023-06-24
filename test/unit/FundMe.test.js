const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")

describe("FundMe", async function () {
    let fundMe
    let fundMeAddress
    let deployer
    let mockV3AggregatorAddress
    let mockV3Aggregator
    const sendValue = ethers.parseEther("10")
    beforeEach(async function () {
        //address
        deployer = (await getNamedAccounts()).deployer
        //signer
        deployer = await ethers.provider.getSigner(deployer)
        const _deployments = await deployments.fixture(["all"])
        fundMeAddress = _deployments.FundMe.address
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress, deployer)
        mockV3AggregatorAddress = _deployments.MockV3Aggregator.address
        mockV3Aggregator = await ethers.getContractAt(
            "MockV3Aggregator",
            mockV3AggregatorAddress,
            deployer
        )
    })

    describe("constructor", async function () {
        it("sets the aggregator address correctly", async function () {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3AggregatorAddress)
        })
    })

    describe("fund", async function () {
        it("Failed if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })

        it("updated the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountFunded(
                deployer.address
            )
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array to s_funders", async function () {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getFunder(0)
            assert.equal(response, deployer.address)
        })
    })

    describe("withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue })
        })
        it("Withdraw ETH from a single funder", async function () {
            //Arrange
            const startFundMeBalance = await ethers.provider.getBalance(
                fundMeAddress
            )
            const startDeployerBalance = await ethers.provider.getBalance(
                deployer.address
            )
            //Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const count =
                transactionReceipt.gasPrice * transactionReceipt.gasUsed

            const endFundMeBalance = await ethers.provider.getBalance(
                fundMeAddress
            )
            const endDeployerBalance = await ethers.provider.getBalance(
                deployer.address
            )
            //Assert
            assert.equal(endFundMeBalance, 0)
            assert.equal(
                BigInt(startFundMeBalance) + BigInt(startDeployerBalance),
                BigInt(endDeployerBalance) + count
            )
        })
        it("allows us to withdraw with multiple funders", async function () {
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const connectionContract = await fundMe.connect(accounts[i])
                await connectionContract.fund({ value: sendValue })
            }

            const startFundBalance = await ethers.provider.getBalance(
                fundMeAddress
            )
            const startDeployerBalance = await ethers.provider.getBalance(
                deployer.address
            )

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const endFundMeBalance = await ethers.provider.getBalance(
                fundMeAddress
            )
            const endDeployerBalance = await ethers.provider.getBalance(
                deployer.address
            )
            const gasCost =
                transactionReceipt.gasPrice * transactionReceipt.gasUsed

            assert.equal(endFundMeBalance, 0)
            assert.equal(
                BigInt(startFundBalance) + BigInt(startDeployerBalance),
                BigInt(endDeployerBalance) + BigInt(gasCost)
            )

            await expect(fundMe.getFunder(0)).to.be.reverted

            for (let i = 0; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })

        it("Only deployer can withdraw", async function () {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker)
            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWithCustomError(
                attackerConnectedContract,
                "FundMe__NotOwner"
            )
        })
    })
})
