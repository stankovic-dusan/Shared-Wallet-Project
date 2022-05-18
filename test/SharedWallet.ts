import { ethers, waffle } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { SharedWallet } from "../typechain/SharedWallet";

chai.use(solidity);
const { expect } = chai;
const provider = waffle.provider;

describe("SharedWallet", () => {
  let sharedWallet: SharedWallet;
  let signers: any;

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const sharedWalletFactory = await ethers.getContractFactory(
      "SharedWallet",
      signers[0]
    );
    sharedWallet = (await sharedWalletFactory.deploy()) as SharedWallet;
    await sharedWallet.deployed();

    expect(sharedWallet.address).to.properAddress;
  });

  describe("Transactions test ", async () => {
    it("should receive ETH to contract", async () => {
      expect(await provider.getBalance(sharedWallet.address)).to.equal(0);

      await signers[0].sendTransaction({
        to: sharedWallet.address,
        value: ethers.constants.WeiPerEther.mul(10),
      });

      expect(await provider.getBalance(sharedWallet.address)).to.equal(
        ethers.constants.WeiPerEther.mul(10)
      );
    });

    it("should owner withdraw ETH from contract to any address", async () => {
      expect(await provider.getBalance(sharedWallet.address)).to.equal(0);

      await signers[0].sendTransaction({
        to: sharedWallet.address,
        value: ethers.constants.WeiPerEther.mul(10),
      });

      expect(await provider.getBalance(sharedWallet.address)).to.equal(
        ethers.constants.WeiPerEther.mul(10)
      );

      await sharedWallet.withdrawMoney(
        signers[1].address,
        ethers.constants.WeiPerEther.mul(5)
      );
    });

    it("should withdraw ETH from contract with allowance", async () => {
      expect(await provider.getBalance(sharedWallet.address)).to.equal(0);

      await signers[0].sendTransaction({
        to: sharedWallet.address,
        value: ethers.constants.WeiPerEther.mul(10),
      });

      expect(await provider.getBalance(sharedWallet.address)).to.equal(
        ethers.constants.WeiPerEther.mul(10)
      );

      await sharedWallet.setAllowance(
        signers[1].address,
        ethers.constants.WeiPerEther.mul(5)
      );

      sharedWallet = await sharedWallet.connect(signers[1]);

      await sharedWallet.withdrawMoney(
        signers[2].address,
        ethers.constants.WeiPerEther.mul(5)
      );

      expect(await provider.getBalance(signers[2].address)).to.equal(
        ethers.constants.WeiPerEther.mul(10005)
      );
    });

    it("should fail withdraw ETH from contract without approved allowance", async () => {
      expect(await provider.getBalance(sharedWallet.address)).to.equal(0);

      await signers[0].sendTransaction({
        to: sharedWallet.address,
        value: ethers.constants.WeiPerEther.mul(10),
      });

      expect(await provider.getBalance(sharedWallet.address)).to.equal(
        ethers.constants.WeiPerEther.mul(10)
      );

      sharedWallet = await sharedWallet.connect(signers[1]);

      await expect(
        sharedWallet.withdrawMoney(
          signers[2].address,
          ethers.constants.WeiPerEther.mul(5)
        )
      ).to.be.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'You are not allowed'"
      );
    });

    it("should fail withdraw ETH from contract with inssuficient allowance", async () => {
      expect(await provider.getBalance(sharedWallet.address)).to.equal(0);

      await signers[0].sendTransaction({
        to: sharedWallet.address,
        value: ethers.constants.WeiPerEther.mul(10),
      });

      expect(await provider.getBalance(sharedWallet.address)).to.equal(
        ethers.constants.WeiPerEther.mul(10)
      );

      await sharedWallet.setAllowance(
        signers[1].address,
        ethers.constants.WeiPerEther.mul(5)
      );

      sharedWallet = await sharedWallet.connect(signers[1]);

      await expect(
        sharedWallet.withdrawMoney(
          signers[2].address,
          ethers.constants.WeiPerEther.mul(6)
        )
      ).to.be.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'You are not allowed'"
      );
    });

    it("should fail withdraw ETH from contract with inssuficient funds on contract", async () => {
      expect(await provider.getBalance(sharedWallet.address)).to.equal(0);

      await signers[0].sendTransaction({
        to: sharedWallet.address,
        value: ethers.constants.WeiPerEther.mul(10),
      });

      expect(await provider.getBalance(sharedWallet.address)).to.equal(
        ethers.constants.WeiPerEther.mul(10)
      );

      await sharedWallet.setAllowance(
        signers[1].address,
        ethers.constants.WeiPerEther.mul(15)
      );

      sharedWallet = await sharedWallet.connect(signers[1]);

      await expect(
        sharedWallet.withdrawMoney(
          signers[2].address,
          ethers.constants.WeiPerEther.mul(15)
        )
      ).to.be.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'Contract doesn't own enough money'"
      );
    });
  });
});
