import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TokenRewardsNft } from "../target/types/token_rewards_nft";

import { findMetadataPda } from "@metaplex-foundation/js";
import {
  DataV2,
  createUpdateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import fs from "fs";

describe("token-rewards-nft", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TokenRewardsNft as Program<TokenRewardsNft>;
  const connection = anchor.getProvider().connection;
  const userWallet = anchor.workspace.TokenRewardsNft.provider.wallet;

  // it("Create New Reward Token", async () => {
  //   const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  //     "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  //   );

  //   // Add your test here.
  //   const [rewardDataPda, rewardDataBump] = await PublicKey.findProgramAddress(
  //     [Buffer.from("DATA"), userWallet.publicKey.toBuffer()],
  //     program.programId
  //   );

  //   const [rewardMintPda, rewardMintBump] = await PublicKey.findProgramAddress(
  //     [Buffer.from("MINT"), rewardDataPda.toBuffer()],
  //     program.programId
  //   );

  //   const metadataPDA = await findMetadataPda(rewardMintPda);

  //   const tx = await program.methods
  //     .createNftReward(
  //       new anchor.BN(100),
  //       "https://arweave.net/OwXDf7SM6nCVY2cvQ4svNjtV7WBTz3plbI4obN9JNkk",
  //       "TEST",
  //       "SYMBOL"
  //     )
  //     .accounts({
  //       rewardData: rewardDataPda,
  //       rewardMint: rewardMintPda,
  //       user: userWallet.publicKey,
  //       systemProgram: SystemProgram.programId,
  //       rent: SYSVAR_RENT_PUBKEY,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       metadata: metadataPDA,
  //       tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  //     })
  //     .rpc();
  //   // console.log("Your transaction signature", tx);

  //   const token = await program.account.tokenData.fetch(rewardDataPda);
  //   // console.log(token);
  // });

  // it("Update Metadata", async () => {
  //   const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  //     "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  //   );

  //   // Add your test here.
  //   const [rewardDataPda, rewardDataBump] = await PublicKey.findProgramAddress(
  //     [Buffer.from("DATA"), userWallet.publicKey.toBuffer()],
  //     program.programId
  //   );

  //   const [rewardMintPda, rewardMintBump] = await PublicKey.findProgramAddress(
  //     [Buffer.from("MINT"), rewardDataPda.toBuffer()],
  //     program.programId
  //   );

  //   const metadataPDA = await findMetadataPda(rewardMintPda);

  //   const tokenMetadata = {
  //     name: "UPDATE",
  //     symbol: "UPDATE",
  //     uri: "https://arweave.net/8VVz347Ib58PElH0a0prc5bnQ0JGBTS1XE-CculWyIc",
  //     sellerFeeBasisPoints: 0,
  //     creators: null,
  //     collection: null,
  //     uses: null,
  //   } as DataV2;

  //   const updateMetadataTransaction = new anchor.web3.Transaction().add(
  //     createUpdateMetadataAccountV2Instruction(
  //       {
  //         metadata: metadataPDA,
  //         updateAuthority: userWallet.publicKey,
  //       },
  //       {
  //         updateMetadataAccountArgsV2: {
  //           data: tokenMetadata,
  //           updateAuthority: userWallet.publicKey,
  //           primarySaleHappened: true,
  //           isMutable: true,
  //         },
  //       }
  //     )
  //   );

  //   const res = await program.provider.sendAndConfirm(
  //     updateMetadataTransaction
  //   );

  // });

  it("Mint NFt", async () => {
    const payer = Keypair.generate();
    const signature = await connection.requestAirdrop(
      payer.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);

    // Add your test here.
    const [rewardDataPda, rewardDataBump] = await PublicKey.findProgramAddress(
      [Buffer.from("DATA"), userWallet.publicKey.toBuffer()],
      program.programId
    );

    const [rewardMintPda, rewardMintBump] = await PublicKey.findProgramAddress(
      [Buffer.from("MINT"), rewardDataPda.toBuffer()],
      program.programId
    );

    console.log(userWallet.publicKey.toString());

    // const customerNft = await getAssociatedTokenAddress(
    //   rewardMintPda,
    //   payer.publicKey
    // );
    // console.log("NFT Account: ", customerNft.toBase58());

    // const mint_tx = new anchor.web3.Transaction().add(
    //   createAssociatedTokenAccountInstruction(
    //     payer.publicKey,
    //     customerNft,
    //     payer.publicKey,
    //     rewardMintPda
    //   )
    // );

    // const res = await program.provider.sendAndConfirm(mint_tx, [payer]);

    const customerNft = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      rewardMintPda,
      userWallet.publicKey
    );

    console.log(customerNft);

    const tx = await program.methods
      .mintNft()
      .accounts({
        rewardData: rewardDataPda,
        rewardMint: rewardMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        user: userWallet.publicKey,
        customerNft: customerNft.address,
        customer: userWallet.publicKey,
      })
      // .signers([payer])
      .rpc();
    console.log("Your transaction signature", tx);

    const token = await program.account.tokenData.fetch(rewardDataPda);
    console.log(token);
  });

  // it("Update Reward Data", async () => {
  //   // Add your test here.
  //   const [rewardDataPda, rewardDataBump] = await PublicKey.findProgramAddress(
  //     [Buffer.from("DATA"), userWallet.publicKey.toBuffer()],
  //     program.programId
  //   );

  //   const tx = await program.methods
  //     .updateNftReward(new anchor.BN(300))
  //     .accounts({
  //       rewardData: rewardDataPda,
  //       user: userWallet.publicKey,
  //     })
  //     .rpc();
  //   console.log("Your transaction signature", tx);

  //   const token = await program.account.tokenData.fetch(rewardDataPda);
  //   console.log(token.rewardBasisPoints.toString());
  // });
});
