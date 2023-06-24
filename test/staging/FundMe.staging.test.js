const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let fundMeAddress
          let deployer
          const sendValue = ethers.parseEther("0.1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              deployer = await ethers.provider.getSigner(deployer)
              const deployment = await deployments.getOrNull("FundMe")
              fundMeAddress = deployment.address
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeAddress,
                  deployer
              )
          })

          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endBalace = await ethers.provider.getBalance(fundMeAddress)
              assert.equal(endBalace.toString(), "0")
          })
      })
